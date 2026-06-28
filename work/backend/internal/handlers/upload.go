package handlers

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/models"
	uploadsvc "github.com/share-schedule/backend/internal/services/upload"
	"github.com/share-schedule/backend/internal/services/safebrowsing"
)

type UploadHandler struct {
	storageClient   *storage.Client
	bucketName      string
	safeChecker     *safebrowsing.Checker
}

func NewUploadHandler(
	storageClient *storage.Client,
	bucketName string,
	safeChecker *safebrowsing.Checker,
) *UploadHandler {
	return &UploadHandler{
		storageClient: storageClient,
		bucketName:    bucketName,
		safeChecker:   safeChecker,
	}
}

func (h *UploadHandler) UploadImage(c *fiber.Ctx) error {
	_ = middleware.GetUID(c)

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File is required"})
	}

	if err := uploadsvc.ValidateImageFile(file); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	url, err := h.uploadToStorage(c.Context(), file.Filename, file.Header.Get("Content-Type"), func(w io.Writer) error {
		f, err := file.Open()
		if err != nil {
			return err
		}
		defer f.Close()
		_, err = io.Copy(w, f)
		return err
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload file"})
	}

	attachment := models.Attachment{
		Name:     file.Filename,
		URL:      url,
		Size:     file.Size,
		MIMEType: file.Header.Get("Content-Type"),
		IsSafe:   true,
	}

	return c.Status(fiber.StatusCreated).JSON(attachment)
}

func (h *UploadHandler) UploadFile(c *fiber.Ctx) error {
	_ = middleware.GetUID(c)

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File is required"})
	}

	if err := uploadsvc.ValidateFile(file); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	mimeType := file.Header.Get("Content-Type")
	isDangerous := uploadsvc.IsDangerousFile(mimeType, file.Filename)

	url, err := h.uploadToStorage(c.Context(), file.Filename, mimeType, func(w io.Writer) error {
		f, err := file.Open()
		if err != nil {
			return err
		}
		defer f.Close()
		_, err = io.Copy(w, f)
		return err
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload file"})
	}

	attachment := models.Attachment{
		Name:     file.Filename,
		URL:      url,
		Size:     file.Size,
		MIMEType: mimeType,
		IsSafe:   !isDangerous,
	}

	return c.Status(fiber.StatusCreated).JSON(attachment)
}

func (h *UploadHandler) CheckURLSafety(c *fiber.Ctx) error {
	var req struct {
		URL string `json:"url"`
	}
	if err := c.BodyParser(&req); err != nil || req.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "url is required"})
	}

	result, err := h.safeChecker.CheckURL(c.Context(), req.URL)
	if err != nil {
		return c.JSON(fiber.Map{"isSafe": true})
	}

	return c.JSON(result)
}

func (h *UploadHandler) uploadToStorage(ctx context.Context, fileName, contentType string, reader func(io.Writer) error) (string, error) {
	if h.storageClient == nil {
		// ストレージが設定されていない場合はプレースホルダーURLを返す
		return fmt.Sprintf("https://storage.example.com/%s", fileName), nil
	}

	ext := filepath.Ext(fileName)
	objectName := fmt.Sprintf("uploads/%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)

	obj := h.storageClient.Bucket(h.bucketName).Object(objectName)
	w := obj.NewWriter(ctx)
	w.ContentType = contentType

	if err := reader(w); err != nil {
		w.Close()
		return "", fmt.Errorf("write to storage: %w", err)
	}

	if err := w.Close(); err != nil {
		return "", fmt.Errorf("close storage writer: %w", err)
	}

	return fmt.Sprintf("https://storage.googleapis.com/%s/%s", h.bucketName, objectName), nil
}

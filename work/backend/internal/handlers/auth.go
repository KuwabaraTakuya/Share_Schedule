package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/models"
	"github.com/share-schedule/backend/internal/repository"
)

type AuthHandler struct {
	userRepo *repository.UserRepository
}

func NewAuthHandler(userRepo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{userRepo: userRepo}
}

type verifyRequest struct {
	IDToken string `json:"idToken"`
}

func (h *AuthHandler) Verify(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	email := middleware.GetEmail(c)

	// 既存ユーザーを検索
	user, err := h.userRepo.GetByID(c.Context(), uid)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user",
		})
	}

	if user != nil {
		return c.JSON(user)
	}

	// 新規ユーザー作成
	now := time.Now()

	newUser := &models.User{
		ID:          uid,
		DisplayName: email,
		Email:       email,
		AvatarURL:   "",
		Timezone:    "Asia/Tokyo",
		CreatedAt:   now,
		UpdatedAt:   now,
		Settings: models.UserSettings{
			GlobalNotification: models.GlobalNotificationSettings{
				Enabled: true,
			},
		},
	}

	if err := h.userRepo.Create(c.Context(), newUser); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(newUser)
}

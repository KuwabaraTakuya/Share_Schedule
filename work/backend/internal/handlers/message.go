package handlers

import (
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/models"
	"github.com/share-schedule/backend/internal/repository"
)

type MessageHandler struct {
	messageRepo   *repository.MessageRepository
	channelRepo   *repository.ChannelRepository
	communityRepo *repository.CommunityRepository
	firestoreRepo *repository.FirestoreRepo
}

func NewMessageHandler(
	messageRepo *repository.MessageRepository,
	channelRepo *repository.ChannelRepository,
	communityRepo *repository.CommunityRepository,
	firestoreRepo *repository.FirestoreRepo,
) *MessageHandler {
	return &MessageHandler{
		messageRepo:   messageRepo,
		channelRepo:   channelRepo,
		communityRepo: communityRepo,
		firestoreRepo: firestoreRepo,
	}
}

func (h *MessageHandler) GetByChannel(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	channelID := c.Params("id")
	cursor := c.Query("cursor")
	limit := 50

	channel, err := h.channelRepo.GetByID(c.Context(), channelID)
	if err != nil || channel == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Channel not found"})
	}

	isMember, err := h.communityRepo.IsMember(c.Context(), channel.CommunityID, uid)
	if err != nil || !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}

	messages, nextCursor, err := h.messageRepo.GetByChannelID(c.Context(), channelID, limit, cursor)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get messages"})
	}

	return c.JSON(fiber.Map{
		"messages":   messages,
		"nextCursor": nextCursor,
	})
}

func (h *MessageHandler) Send(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	channelID := c.Params("id")

	channel, err := h.channelRepo.GetByID(c.Context(), channelID)
	if err != nil || channel == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Channel not found"})
	}

	isMember, err := h.communityRepo.IsMember(c.Context(), channel.CommunityID, uid)
	if err != nil || !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}

	var req struct {
		Content     string              `json:"content"`
		Type        string              `json:"type"`
		Attachments []models.Attachment `json:"attachments"`
		Location    *models.LocationData `json:"location,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	msgType := req.Type
	if msgType == "" {
		msgType = "text"
	}

	message := &models.Message{
		ID:          uuid.New().String(),
		ChannelID:   channelID,
		UserID:      uid,
		Content:     req.Content,
		Type:        msgType,
		Attachments: req.Attachments,
		Location:    req.Location,
		Reactions:   make(map[string][]string),
		ThreadCount: 0,
		CreatedAt:   time.Now(),
		ReadBy:      []string{uid},
	}
	if message.Attachments == nil {
		message.Attachments = []models.Attachment{}
	}

	if err := h.messageRepo.Create(c.Context(), channelID, message); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send message"})
	}

	return c.Status(fiber.StatusCreated).JSON(message)
}

func (h *MessageHandler) Edit(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	messageID := c.Params("id")

	var req struct {
		Content string `json:"content"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// チャンネルIDを取得するためにメッセージを探す（チャンネルIDをパラメータに含めるのが望ましいが、ここでは省略）
	// 実際にはクエリパラメータまたはボディでchannelIdを受け取る
	channelID := c.Query("channelId")
	if channelID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "channelId is required"})
	}

	msg, err := h.messageRepo.GetByID(c.Context(), channelID, messageID)
	if err != nil || msg == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Message not found"})
	}

	if msg.UserID != uid {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Cannot edit other's message"})
	}

	now := time.Now()
	if err := h.messageRepo.Update(c.Context(), channelID, messageID, map[string]interface{}{
		"content":  req.Content,
		"editedAt": now,
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to edit message"})
	}

	msg.Content = req.Content
	msg.EditedAt = &now
	return c.JSON(msg)
}

func (h *MessageHandler) Delete(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	messageID := c.Params("id")
	channelID := c.Query("channelId")

	if channelID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "channelId is required"})
	}

	msg, err := h.messageRepo.GetByID(c.Context(), channelID, messageID)
	if err != nil || msg == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Message not found"})
	}

	// 本人 or Admin以上
	if msg.UserID != uid {
		channel, _ := h.channelRepo.GetByID(c.Context(), channelID)
		if channel != nil {
			member, _ := h.communityRepo.GetMember(c.Context(), channel.CommunityID, uid)
			if member == nil || member.Role == "member" {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Permission denied"})
			}
		}
	}

	now := time.Now()
	if err := h.messageRepo.Update(c.Context(), channelID, messageID, map[string]interface{}{
		"deletedAt": now,
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete message"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MessageHandler) AddReaction(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	messageID := c.Params("id")
	channelID := c.Query("channelId")

	if channelID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "channelId is required"})
	}

	var req struct {
		Emoji string `json:"emoji"`
	}
	if err := c.BodyParser(&req); err != nil || req.Emoji == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "emoji is required"})
	}

	if err := h.messageRepo.Update(c.Context(), channelID, messageID, map[string]interface{}{
		"reactions." + req.Emoji: firestore.ArrayUnion(uid),
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add reaction"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MessageHandler) RemoveReaction(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	messageID := c.Params("id")
	emoji := c.Params("emoji")
	channelID := c.Query("channelId")

	if channelID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "channelId is required"})
	}

	if err := h.messageRepo.Update(c.Context(), channelID, messageID, map[string]interface{}{
		"reactions." + emoji: firestore.ArrayRemove(uid),
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove reaction"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

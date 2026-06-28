package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/models"
	"github.com/share-schedule/backend/internal/repository"
)

type ChannelHandler struct {
	channelRepo   *repository.ChannelRepository
	communityRepo *repository.CommunityRepository
}

func NewChannelHandler(
	channelRepo *repository.ChannelRepository,
	communityRepo *repository.CommunityRepository,
) *ChannelHandler {
	return &ChannelHandler{
		channelRepo:   channelRepo,
		communityRepo: communityRepo,
	}
}

func (h *ChannelHandler) GetByCommunity(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	communityID := c.Params("id")

	isMember, err := h.communityRepo.IsMember(c.Context(), communityID, uid)
	if err != nil || !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}

	channels, err := h.channelRepo.GetByCommunityID(c.Context(), communityID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get channels"})
	}

	return c.JSON(channels)
}

func (h *ChannelHandler) Create(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	communityID := c.Params("id")

	member, err := h.communityRepo.GetMember(c.Context(), communityID, uid)
	if err != nil || member == nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}
	if member.Role == "member" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Admin permission required"})
	}

	var req struct {
		Name string `json:"name"`
		Type string `json:"type"`
		Date string `json:"date,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if req.Name == "" || req.Type == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Name and type are required"})
	}

	// 現在のチャンネル数を取得してpositionを決定
	existing, _ := h.channelRepo.GetByCommunityID(c.Context(), communityID)
	position := len(existing)

	channel := &models.Channel{
		ID:          uuid.New().String(),
		CommunityID: communityID,
		Name:        req.Name,
		Type:        req.Type,
		Date:        req.Date,
		Position:    position,
		CreatedAt:   time.Now(),
		CreatedBy:   uid,
	}

	if err := h.channelRepo.Create(c.Context(), channel); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create channel"})
	}

	return c.Status(fiber.StatusCreated).JSON(channel)
}

func (h *ChannelHandler) UpdatePosition(c *fiber.Ctx) error {
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
		Position int `json:"position"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.channelRepo.Update(c.Context(), channelID, map[string]interface{}{
		"position": req.Position,
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update position"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *ChannelHandler) Delete(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	channelID := c.Params("id")

	channel, err := h.channelRepo.GetByID(c.Context(), channelID)
	if err != nil || channel == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Channel not found"})
	}

	member, err := h.communityRepo.GetMember(c.Context(), channel.CommunityID, uid)
	if err != nil || member == nil || member.Role == "member" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Admin permission required"})
	}

	if err := h.channelRepo.Delete(c.Context(), channelID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete channel"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

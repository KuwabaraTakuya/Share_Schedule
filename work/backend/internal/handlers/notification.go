package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/repository"
)

type NotificationHandler struct {
	userRepo *repository.UserRepository
}

func NewNotificationHandler(userRepo *repository.UserRepository) *NotificationHandler {
	return &NotificationHandler{userRepo: userRepo}
}

func (h *NotificationHandler) RegisterToken(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)

	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil || req.Token == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "token is required"})
	}

	if err := h.userRepo.AddFCMToken(c.Context(), uid, req.Token); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to register token"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *NotificationHandler) UpdateSettings(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)

	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	updates := make(map[string]interface{})
	if start, ok := req["quietHoursStart"].(string); ok {
		updates["settings.globalNotification.quietHours.start"] = start
	}
	if end, ok := req["quietHoursEnd"].(string); ok {
		updates["settings.globalNotification.quietHours.end"] = end
	}
	if enabled, ok := req["enabled"].(bool); ok {
		updates["settings.globalNotification.enabled"] = enabled
	}

	if len(updates) == 0 {
		return c.SendStatus(fiber.StatusNoContent)
	}

	if err := h.userRepo.Update(c.Context(), uid, updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update settings"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

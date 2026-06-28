package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/models"
	"github.com/share-schedule/backend/internal/repository"
	"github.com/share-schedule/backend/internal/services/availability"
	"github.com/share-schedule/backend/internal/services/calendar"
	"github.com/share-schedule/backend/internal/services/gemini"
)

type EventHandler struct {
	eventRepo      *repository.EventRepository
	communityRepo  *repository.CommunityRepository
	geminiClient   *gemini.Client
	availCalc      *availability.Calculator
	calendarSvc    *calendar.GoogleCalendarService
}

func NewEventHandler(
	eventRepo *repository.EventRepository,
	communityRepo *repository.CommunityRepository,
	geminiClient *gemini.Client,
	availCalc *availability.Calculator,
) *EventHandler {
	return &EventHandler{
		eventRepo:     eventRepo,
		communityRepo: communityRepo,
		geminiClient:  geminiClient,
		availCalc:     availCalc,
		calendarSvc:   calendar.NewGoogleCalendarService(),
	}
}

func (h *EventHandler) GetAll(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	startStr := c.Query("start")
	endStr := c.Query("end")

	start, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		start = time.Now().AddDate(0, -1, 0)
	}
	end, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		end = time.Now().AddDate(0, 1, 0)
	}

	events, err := h.eventRepo.GetByUserAndRange(c.Context(), uid, start, end)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get events"})
	}

	return c.JSON(events)
}

func (h *EventHandler) Create(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)

	var req models.CalendarEvent
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	req.ID = uuid.New().String()
	req.UserID = uid
	req.Source = "manual"
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	if err := h.eventRepo.Create(c.Context(), &req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create event"})
	}

	return c.Status(fiber.StatusCreated).JSON(req)
}

func (h *EventHandler) Update(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	eventID := c.Params("id")

	event, err := h.eventRepo.GetByID(c.Context(), eventID)
	if err != nil || event == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Event not found"})
	}
	if event.UserID != uid {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Permission denied"})
	}

	var updates map[string]interface{}
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	updates["updatedAt"] = time.Now()

	if err := h.eventRepo.Update(c.Context(), eventID, updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update event"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *EventHandler) Delete(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	eventID := c.Params("id")

	event, err := h.eventRepo.GetByID(c.Context(), eventID)
	if err != nil || event == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Event not found"})
	}
	if event.UserID != uid {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Permission denied"})
	}

	if err := h.eventRepo.Delete(c.Context(), eventID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete event"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *EventHandler) ParseFromText(c *fiber.Ctx) error {
	if h.geminiClient == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Gemini not configured"})
	}

	var req struct {
		Text     string `json:"text"`
		Timezone string `json:"timezone"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if req.Timezone == "" {
		req.Timezone = "Asia/Tokyo"
	}

	parsed, err := h.geminiClient.ParseScheduleFromText(c.Context(), req.Text, req.Timezone, time.Now())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse event"})
	}

	return c.JSON(parsed)
}

func (h *EventHandler) GetAvailability(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	communityID := c.Params("id")
	monthStr := c.Query("month") // YYYY-MM

	isMember, err := h.communityRepo.IsMember(c.Context(), communityID, uid)
	if err != nil || !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}

	if monthStr == "" {
		monthStr = time.Now().Format("2006-01")
	}

	parts := splitMonth(monthStr)
	if len(parts) != 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid month format"})
	}

	year, _ := strconv.Atoi(parts[0])
	month, _ := strconv.Atoi(parts[1])

	result, err := h.availCalc.CalculateMonth(c.Context(), communityID, year, month)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to calculate availability"})
	}

	return c.JSON(result)
}

// SyncGoogleCalendar fetches events from Google Calendar using the user's access token
// and upserts them into Firestore.
func (h *EventHandler) SyncGoogleCalendar(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)

	var req struct {
		AccessToken string `json:"accessToken"`
		Start       string `json:"start"`
		End         string `json:"end"`
	}
	if err := c.BodyParser(&req); err != nil || req.AccessToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "accessToken required"})
	}

	start := time.Now().AddDate(0, -1, 0)
	end := time.Now().AddDate(0, 3, 0)
	if t, err := time.Parse(time.RFC3339, req.Start); err == nil {
		start = t
	}
	if t, err := time.Parse(time.RFC3339, req.End); err == nil {
		end = t
	}

	events, err := h.calendarSvc.FetchEvents(c.Context(), req.AccessToken, uid, start, end)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Failed to fetch Google Calendar events"})
	}

	for _, ev := range events {
		if err := h.eventRepo.Create(c.Context(), ev); err != nil {
			// Duplicate keys are expected on re-sync; log and continue
			continue
		}
	}

	return c.JSON(fiber.Map{"synced": len(events)})
}

// ImportICS parses an uploaded .ics file and saves events to Firestore.
func (h *EventHandler) ImportICS(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file required"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to open file"})
	}
	defer f.Close()

	events, err := calendar.ParseICS(f, uid)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to parse ICS file"})
	}

	saved := 0
	for _, ev := range events {
		if err := h.eventRepo.Create(c.Context(), ev); err != nil {
			continue
		}
		saved++
	}

	return c.JSON(fiber.Map{"imported": saved, "total": len(events)})
}

func splitMonth(s string) []string {
	for i, c := range s {
		if c == '-' {
			return []string{s[:i], s[i+1:]}
		}
	}
	return []string{s}
}

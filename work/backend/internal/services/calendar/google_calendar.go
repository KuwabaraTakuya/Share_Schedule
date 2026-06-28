package calendar

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/share-schedule/backend/internal/models"
	"golang.org/x/oauth2"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// GoogleCalendarService syncs Google Calendar events into Firestore.
type GoogleCalendarService struct{}

func NewGoogleCalendarService() *GoogleCalendarService {
	return &GoogleCalendarService{}
}

// FetchEvents fetches events from the user's primary Google Calendar
// using the provided OAuth2 access token.
func (s *GoogleCalendarService) FetchEvents(
	ctx context.Context,
	accessToken string,
	userID string,
	start, end time.Time,
) ([]*models.CalendarEvent, error) {
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: accessToken})

	svc, err := calendar.NewService(ctx, option.WithTokenSource(ts))
	if err != nil {
		return nil, fmt.Errorf("create calendar service: %w", err)
	}

	call := svc.Events.List("primary").
		TimeMin(start.Format(time.RFC3339)).
		TimeMax(end.Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime").
		MaxResults(500)

	resp, err := call.Context(ctx).Do()
	if err != nil {
		return nil, fmt.Errorf("list google calendar events: %w", err)
	}

	now := time.Now()
	events := make([]*models.CalendarEvent, 0, len(resp.Items))
	for _, item := range resp.Items {
		ev, err := convertGoogleEvent(item, userID, now)
		if err != nil {
			continue
		}
		events = append(events, ev)
	}

	return events, nil
}

func convertGoogleEvent(item *calendar.Event, userID string, now time.Time) (*models.CalendarEvent, error) {
	startTime, allDay, err := parseGoogleDateTime(item.Start)
	if err != nil {
		return nil, err
	}
	endTime, _, err := parseGoogleDateTime(item.End)
	if err != nil {
		if allDay {
			endTime = startTime.AddDate(0, 0, 1)
		} else {
			endTime = startTime.Add(time.Hour)
		}
	}

	syncedAt := now
	return &models.CalendarEvent{
		ID:            uuid.New().String(),
		UserID:        userID,
		Title:         item.Summary,
		Description:   item.Description,
		Location:      item.Location,
		StartTime:     startTime,
		EndTime:       endTime,
		IsAllDay:      allDay,
		Source:        "google",
		SourceEventID: item.Id,
		SyncedAt:      &syncedAt,
		Visibility:    "private",
		Recurrence:    models.Recurrence{Type: "none"},
		CreatedAt:     now,
		UpdatedAt:     now,
	}, nil
}

func parseGoogleDateTime(dt *calendar.EventDateTime) (time.Time, bool, error) {
	if dt == nil {
		return time.Time{}, false, fmt.Errorf("nil EventDateTime")
	}
	if dt.Date != "" {
		t, err := time.Parse("2006-01-02", dt.Date)
		return t, true, err
	}
	t, err := time.Parse(time.RFC3339, dt.DateTime)
	return t, false, err
}

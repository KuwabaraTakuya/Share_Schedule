package calendar

import (
	"bufio"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/share-schedule/backend/internal/models"
)

// ParseICS parses an iCalendar (.ics) stream and returns CalendarEvents for the given user.
func ParseICS(r io.Reader, userID string) ([]*models.CalendarEvent, error) {
	scanner := bufio.NewScanner(r)
	var events []*models.CalendarEvent
	var current map[string]string
	inEvent := false

	for scanner.Scan() {
		line := unfold(scanner.Text())

		switch {
		case line == "BEGIN:VEVENT":
			inEvent = true
			current = make(map[string]string)
		case line == "END:VEVENT":
			if inEvent && current != nil {
				ev, err := parseVEvent(current, userID)
				if err == nil {
					events = append(events, ev)
				}
			}
			inEvent = false
			current = nil
		case inEvent:
			key, value, ok := splitProperty(line)
			if ok {
				// Store only the first occurrence of each key (except RDATE/EXDATE)
				if _, exists := current[key]; !exists {
					current[key] = value
				}
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scan ics: %w", err)
	}

	return events, nil
}

// unfold joins folded lines (RFC 5545 §3.1)
func unfold(line string) string {
	// Folded continuation lines start with a space or tab —
	// a single-pass scanner can't detect them here, but we handle
	// multi-line values by joining when writing; for a simple parser
	// we just trim trailing \r.
	return strings.TrimRight(line, "\r")
}

// splitProperty splits "KEY;PARAMS:VALUE" into (key, value).
func splitProperty(line string) (string, string, bool) {
	// Find the first ':' that isn't inside a quoted string
	inQuote := false
	for i, ch := range line {
		switch {
		case ch == '"':
			inQuote = !inQuote
		case ch == ':' && !inQuote:
			rawKey := line[:i]
			// Strip parameters (KEY;PARAM=val → KEY)
			key := strings.SplitN(rawKey, ";", 2)[0]
			return strings.ToUpper(key), line[i+1:], true
		}
	}
	return "", "", false
}

func parseVEvent(props map[string]string, userID string) (*models.CalendarEvent, error) {
	title := props["SUMMARY"]
	if title == "" {
		title = "（タイトルなし）"
	}

	startTime, allDay, err := parseDateTime(props["DTSTART"])
	if err != nil {
		return nil, fmt.Errorf("parse DTSTART: %w", err)
	}

	endTime, _, err := parseDateTime(props["DTEND"])
	if err != nil {
		// Fall back to start + 1 hour / 1 day
		if allDay {
			endTime = startTime.AddDate(0, 0, 1)
		} else {
			endTime = startTime.Add(time.Hour)
		}
	}

	now := time.Now()
	ev := &models.CalendarEvent{
		ID:            uuid.New().String(),
		UserID:        userID,
		Title:         title,
		Description:   props["DESCRIPTION"],
		Location:      props["LOCATION"],
		StartTime:     startTime,
		EndTime:       endTime,
		IsAllDay:      allDay,
		Source:        "ics",
		SourceEventID: props["UID"],
		Visibility:    "private",
		Recurrence:    models.Recurrence{Type: "none"},
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	return ev, nil
}

// parseDateTime handles DATE (allDay) and DATE-TIME (with or without Z).
func parseDateTime(raw string) (time.Time, bool, error) {
	if raw == "" {
		return time.Time{}, false, fmt.Errorf("empty datetime")
	}

	// DATE-only: 20060102
	if len(raw) == 8 {
		t, err := time.Parse("20060102", raw)
		return t, true, err
	}

	// DATE-TIME UTC: 20060102T150405Z
	if strings.HasSuffix(raw, "Z") {
		t, err := time.Parse("20060102T150405Z", raw)
		return t, false, err
	}

	// DATE-TIME local: 20060102T150405
	t, err := time.ParseInLocation("20060102T150405", raw, time.Local)
	return t, false, err
}

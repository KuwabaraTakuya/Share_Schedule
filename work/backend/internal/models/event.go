package models

import "time"

type CalendarEvent struct {
	ID            string      `json:"id" firestore:"id"`
	UserID        string      `json:"userId" firestore:"userId"`
	CommunityID   string      `json:"communityId,omitempty" firestore:"communityId,omitempty"`
	Title         string      `json:"title" firestore:"title"`
	Description   string      `json:"description" firestore:"description"`
	StartTime     time.Time   `json:"startTime" firestore:"startTime"`
	EndTime       time.Time   `json:"endTime" firestore:"endTime"`
	IsAllDay      bool        `json:"isAllDay" firestore:"isAllDay"`
	Location      string      `json:"location,omitempty" firestore:"location,omitempty"`
	Color         string      `json:"color,omitempty" firestore:"color,omitempty"`
	Recurrence    Recurrence  `json:"recurrence" firestore:"recurrence"`
	Visibility    interface{} `json:"visibility" firestore:"visibility"` // "private" | "community" | []string
	Source        string      `json:"source" firestore:"source"` // manual | google | ics
	SourceEventID string      `json:"sourceEventId,omitempty" firestore:"sourceEventId,omitempty"`
	SyncedAt      *time.Time  `json:"syncedAt,omitempty" firestore:"syncedAt,omitempty"`
	CreatedAt     time.Time   `json:"createdAt" firestore:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt" firestore:"updatedAt"`
}

type Recurrence struct {
	Type     string     `json:"type" firestore:"type"` // none | daily | weekly | monthly | custom
	Until    *time.Time `json:"until,omitempty" firestore:"until,omitempty"`
	Interval *int       `json:"interval,omitempty" firestore:"interval,omitempty"`
}

type DayAvailability struct {
	Date           string    `json:"date"`
	Status         string    `json:"status"` // ○ | △ | ×
	AvailableCount int       `json:"availableCount"`
	TotalCount     int       `json:"totalCount"`
	BestTimeRanges []string  `json:"bestTimeRanges,omitempty"`
	CalculatedAt   time.Time `json:"calculatedAt"`
}

type ParsedEvent struct {
	Title       string    `json:"title"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	IsAllDay    bool      `json:"isAllDay"`
	Location    string    `json:"location,omitempty"`
	Description string    `json:"description,omitempty"`
	Confidence  float64   `json:"confidence"`
}

type AvailabilityCache struct {
	Days map[string]DayAvailability `json:"days" firestore:"days"`
}

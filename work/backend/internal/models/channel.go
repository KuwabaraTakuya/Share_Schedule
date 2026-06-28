package models

import "time"

type Channel struct {
	ID          string    `json:"id" firestore:"id"`
	CommunityID string    `json:"communityId" firestore:"communityId"`
	Name        string    `json:"name" firestore:"name"`
	Type        string    `json:"type" firestore:"type"` // text | date
	Date        string    `json:"date,omitempty" firestore:"date,omitempty"`
	Position    int       `json:"position" firestore:"position"`
	Topic       string    `json:"topic,omitempty" firestore:"topic,omitempty"`
	CreatedAt   time.Time `json:"createdAt" firestore:"createdAt"`
	CreatedBy   string    `json:"createdBy" firestore:"createdBy"`
}

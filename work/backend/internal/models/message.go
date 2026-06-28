package models

import "time"

type Message struct {
	ID          string              `json:"id" firestore:"id"`
	ChannelID   string              `json:"channelId" firestore:"channelId"`
	UserID      string              `json:"userId" firestore:"userId"`
	Content     string              `json:"content" firestore:"content"`
	Type        string              `json:"type" firestore:"type"` // text | image | file | location | system
	Attachments []Attachment        `json:"attachments" firestore:"attachments"`
	Location    *LocationData       `json:"location,omitempty" firestore:"location,omitempty"`
	Reactions   map[string][]string `json:"reactions" firestore:"reactions"`
	ThreadCount int                 `json:"threadCount" firestore:"threadCount"`
	EditedAt    *time.Time          `json:"editedAt,omitempty" firestore:"editedAt,omitempty"`
	DeletedAt   *time.Time          `json:"deletedAt,omitempty" firestore:"deletedAt,omitempty"`
	CreatedAt   time.Time           `json:"createdAt" firestore:"createdAt"`
	ReadBy      []string            `json:"readBy" firestore:"readBy"`
}

type Attachment struct {
	Name     string `json:"name" firestore:"name"`
	URL      string `json:"url" firestore:"url"`
	Size     int64  `json:"size" firestore:"size"`
	MIMEType string `json:"mimeType" firestore:"mimeType"`
	IsSafe   bool   `json:"isSafe" firestore:"isSafe"`
}

type LocationData struct {
	PlaceID         string  `json:"placeId" firestore:"placeId"`
	Name            string  `json:"name" firestore:"name"`
	Address         string  `json:"address" firestore:"address"`
	Lat             float64 `json:"lat" firestore:"lat"`
	Lng             float64 `json:"lng" firestore:"lng"`
	MapThumbnailURL string  `json:"mapThumbnailUrl" firestore:"mapThumbnailUrl"`
}

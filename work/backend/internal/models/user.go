package models

import "time"

type User struct {
	ID           string       `json:"id" firestore:"id"`
	DisplayName  string       `json:"displayName" firestore:"displayName"`
	Email        string       `json:"email" firestore:"email"`
	AvatarURL    string       `json:"avatarUrl" firestore:"avatarUrl"`
	Timezone     string       `json:"timezone" firestore:"timezone"`
	CommunityIDs []string     `json:"communityIds" firestore:"communityIds"`
	CreatedAt    time.Time    `json:"createdAt" firestore:"createdAt"`
	UpdatedAt    time.Time    `json:"updatedAt" firestore:"updatedAt"`
	Settings     UserSettings `json:"settings" firestore:"settings"`
}

type UserSettings struct {
	GlobalNotification GlobalNotificationSettings `json:"globalNotification" firestore:"globalNotification"`
	FCMTokens          []string                   `json:"fcmTokens,omitempty" firestore:"fcmTokens,omitempty"`
}

type GlobalNotificationSettings struct {
	Enabled     bool   `json:"enabled" firestore:"enabled"`
	QuietHours  QuietHours `json:"quietHours" firestore:"quietHours"`
}

type QuietHours struct {
	Start string `json:"start" firestore:"start"` // "23:00"
	End   string `json:"end" firestore:"end"`     // "07:00"
}

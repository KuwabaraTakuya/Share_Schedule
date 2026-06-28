package models

import "time"

type Community struct {
	ID         string            `json:"id" firestore:"id"`
	Name       string            `json:"name" firestore:"name"`
	IconURL    string            `json:"iconUrl" firestore:"iconUrl"`
	OwnerID    string            `json:"ownerId" firestore:"ownerId"`
	InviteCode string            `json:"inviteCode" firestore:"inviteCode"`
	Settings   CommunitySettings `json:"settings" firestore:"settings"`
	CreatedAt  time.Time         `json:"createdAt" firestore:"createdAt"`
}

type CommunitySettings struct {
	AvailabilityThreshold      int  `json:"availabilityThreshold" firestore:"availabilityThreshold"`
	AllowAnonymousAvailability bool `json:"allowAnonymousAvailability" firestore:"allowAnonymousAvailability"`
}

type CommunityMember struct {
	UserID               string               `json:"userId" firestore:"userId"`
	Role                 string               `json:"role" firestore:"role"` // owner | admin | member
	DisplayName          string               `json:"displayName" firestore:"displayName"`
	JoinedAt             time.Time            `json:"joinedAt" firestore:"joinedAt"`
	PrivacySettings      PrivacySettings      `json:"privacySettings" firestore:"privacySettings"`
	NotificationSettings NotificationSettings `json:"notificationSettings" firestore:"notificationSettings"`
	SharedCalendarIDs    []string             `json:"sharedCalendarIds,omitempty" firestore:"sharedCalendarIds,omitempty"`
}

type PrivacySettings struct {
	// "all" | "none" | []string (userIDs)
	ShareCalendarWith interface{} `json:"shareCalendarWith" firestore:"shareCalendarWith"`
	ShareDetailWith   interface{} `json:"shareDetailWith" firestore:"shareDetailWith"`
}

type NotificationSettings struct {
	Default string `json:"default" firestore:"default"` // all | mentions | muted
}

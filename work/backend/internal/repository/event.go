package repository

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/share-schedule/backend/internal/models"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type EventRepository struct {
	repo *FirestoreRepo
}

func NewEventRepository(repo *FirestoreRepo) *EventRepository {
	return &EventRepository{repo: repo}
}

func (r *EventRepository) GetByID(ctx context.Context, id string) (*models.CalendarEvent, error) {
	doc, err := r.repo.Collection("events").Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get event: %w", err)
	}

	var event models.CalendarEvent
	if err := doc.DataTo(&event); err != nil {
		return nil, fmt.Errorf("decode event: %w", err)
	}
	event.ID = doc.Ref.ID
	return &event, nil
}

func (r *EventRepository) GetByUserAndRange(ctx context.Context, userID string, start, end time.Time) ([]*models.CalendarEvent, error) {
	docs, err := r.repo.Collection("events").
		Where("userId", "==", userID).
		Where("startTime", ">=", start).
		Where("startTime", "<=", end).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("get user events: %w", err)
	}

	events := make([]*models.CalendarEvent, 0, len(docs))
	for _, doc := range docs {
		var event models.CalendarEvent
		if err := doc.DataTo(&event); err != nil {
			continue
		}
		event.ID = doc.Ref.ID
		events = append(events, &event)
	}
	return events, nil
}

func (r *EventRepository) GetByCommunityAndRange(ctx context.Context, communityID string, start, end time.Time) ([]*models.CalendarEvent, error) {
	docs, err := r.repo.Collection("events").
		Where("communityId", "==", communityID).
		Where("startTime", ">=", start).
		Where("startTime", "<=", end).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("get community events: %w", err)
	}

	events := make([]*models.CalendarEvent, 0, len(docs))
	for _, doc := range docs {
		var event models.CalendarEvent
		if err := doc.DataTo(&event); err != nil {
			continue
		}
		event.ID = doc.Ref.ID
		events = append(events, &event)
	}
	return events, nil
}

func (r *EventRepository) Create(ctx context.Context, event *models.CalendarEvent) error {
	_, err := r.repo.Collection("events").Doc(event.ID).Set(ctx, event)
	return err
}

func (r *EventRepository) Update(ctx context.Context, id string, data map[string]interface{}) error {
	updates := make([]firestore.Update, 0, len(data))
	for k, v := range data {
		updates = append(updates, firestore.Update{Path: k, Value: v})
	}
	_, err := r.repo.Collection("events").Doc(id).Update(ctx, updates)
	return err
}

func (r *EventRepository) Delete(ctx context.Context, id string) error {
	_, err := r.repo.Collection("events").Doc(id).Delete(ctx)
	return err
}

func (r *EventRepository) GetAvailabilityCache(ctx context.Context, communityID, month string) (*models.AvailabilityCache, error) {
	cacheKey := communityID + "_" + month
	doc, err := r.repo.Collection("availability_cache").Doc(cacheKey).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get availability cache: %w", err)
	}

	var cache models.AvailabilityCache
	if err := doc.DataTo(&cache); err != nil {
		return nil, fmt.Errorf("decode availability cache: %w", err)
	}
	return &cache, nil
}

func (r *EventRepository) SetAvailabilityCache(ctx context.Context, communityID, month string, cache *models.AvailabilityCache) error {
	cacheKey := communityID + "_" + month
	_, err := r.repo.Collection("availability_cache").Doc(cacheKey).Set(ctx, cache)
	return err
}

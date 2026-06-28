package repository

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	"github.com/share-schedule/backend/internal/models"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type ChannelRepository struct {
	repo *FirestoreRepo
}

func NewChannelRepository(repo *FirestoreRepo) *ChannelRepository {
	return &ChannelRepository{repo: repo}
}

func (r *ChannelRepository) GetByID(ctx context.Context, id string) (*models.Channel, error) {
	doc, err := r.repo.Collection("channels").Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get channel: %w", err)
	}

	var channel models.Channel
	if err := doc.DataTo(&channel); err != nil {
		return nil, fmt.Errorf("decode channel: %w", err)
	}
	channel.ID = doc.Ref.ID
	return &channel, nil
}

func (r *ChannelRepository) GetByCommunityID(ctx context.Context, communityID string) ([]*models.Channel, error) {
	docs, err := r.repo.Collection("channels").
		Where("communityId", "==", communityID).
		OrderBy("position", firestore.Asc).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("get channels: %w", err)
	}

	channels := make([]*models.Channel, 0, len(docs))
	for _, doc := range docs {
		var channel models.Channel
		if err := doc.DataTo(&channel); err != nil {
			continue
		}
		channel.ID = doc.Ref.ID
		channels = append(channels, &channel)
	}
	return channels, nil
}

func (r *ChannelRepository) Create(ctx context.Context, channel *models.Channel) error {
	_, err := r.repo.Collection("channels").Doc(channel.ID).Set(ctx, channel)
	return err
}

func (r *ChannelRepository) Update(ctx context.Context, id string, data map[string]interface{}) error {
	updates := make([]firestore.Update, 0, len(data))
	for k, v := range data {
		updates = append(updates, firestore.Update{Path: k, Value: v})
	}
	_, err := r.repo.Collection("channels").Doc(id).Update(ctx, updates)
	return err
}

func (r *ChannelRepository) Delete(ctx context.Context, id string) error {
	_, err := r.repo.Collection("channels").Doc(id).Delete(ctx)
	return err
}

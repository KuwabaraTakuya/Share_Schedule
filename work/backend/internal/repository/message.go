package repository

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	"github.com/share-schedule/backend/internal/models"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type MessageRepository struct {
	repo *FirestoreRepo
}

func NewMessageRepository(repo *FirestoreRepo) *MessageRepository {
	return &MessageRepository{repo: repo}
}

func (r *MessageRepository) GetByID(ctx context.Context, channelID, messageID string) (*models.Message, error) {
	doc, err := r.repo.Collection("channels").Doc(channelID).
		Collection("messages").Doc(messageID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get message: %w", err)
	}

	var msg models.Message
	if err := doc.DataTo(&msg); err != nil {
		return nil, fmt.Errorf("decode message: %w", err)
	}
	msg.ID = doc.Ref.ID
	return &msg, nil
}

func (r *MessageRepository) GetByChannelID(ctx context.Context, channelID string, limit int, cursor string) ([]*models.Message, string, error) {
	q := r.repo.Collection("channels").Doc(channelID).
		Collection("messages").
		OrderBy("createdAt", firestore.Desc).
		Limit(limit)

	if cursor != "" {
		cursorDoc, err := r.repo.Collection("channels").Doc(channelID).
			Collection("messages").Doc(cursor).Get(ctx)
		if err == nil {
			q = q.StartAfter(cursorDoc)
		}
	}

	docs, err := q.Documents(ctx).GetAll()
	if err != nil {
		return nil, "", fmt.Errorf("get messages: %w", err)
	}

	messages := make([]*models.Message, 0, len(docs))
	for _, doc := range docs {
		var msg models.Message
		if err := doc.DataTo(&msg); err != nil {
			continue
		}
		msg.ID = doc.Ref.ID
		if msg.DeletedAt == nil {
			messages = append(messages, &msg)
		}
	}

	var nextCursor string
	if len(docs) == limit {
		nextCursor = docs[len(docs)-1].Ref.ID
	}

	return messages, nextCursor, nil
}

func (r *MessageRepository) Create(ctx context.Context, channelID string, message *models.Message) error {
	_, err := r.repo.Collection("channels").Doc(channelID).
		Collection("messages").Doc(message.ID).Set(ctx, message)
	return err
}

func (r *MessageRepository) Update(ctx context.Context, channelID, messageID string, data map[string]interface{}) error {
	updates := make([]firestore.Update, 0, len(data))
	for k, v := range data {
		updates = append(updates, firestore.Update{Path: k, Value: v})
	}
	_, err := r.repo.Collection("channels").Doc(channelID).
		Collection("messages").Doc(messageID).Update(ctx, updates)
	return err
}

func (r *MessageRepository) Delete(ctx context.Context, channelID, messageID string) error {
	_, err := r.repo.Collection("channels").Doc(channelID).
		Collection("messages").Doc(messageID).Delete(ctx)
	return err
}

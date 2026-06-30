package repository

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	"github.com/share-schedule/backend/internal/models"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type UserRepository struct {
	repo *FirestoreRepo
}

func NewUserRepository(repo *FirestoreRepo) *UserRepository {
	return &UserRepository{repo: repo}
}

func (r *UserRepository) GetByID(ctx context.Context, uid string) (*models.User, error) {
	doc, err := r.repo.Collection("users").Doc(uid).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get user: %w", err)
	}

	var user models.User
	if err := doc.DataTo(&user); err != nil {
		return nil, fmt.Errorf("decode user: %w", err)
	}
	user.ID = doc.Ref.ID
	return &user, nil
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	_, err := r.repo.Collection("users").Doc(user.ID).Set(ctx, user)
	return err
}

func (r *UserRepository) Update(ctx context.Context, uid string, data map[string]interface{}) error {
	updates := make([]firestore.Update, 0, len(data))
	for k, v := range data {
		updates = append(updates, firestore.Update{Path: k, Value: v})
	}
	_, err := r.repo.Collection("users").Doc(uid).Update(ctx, updates)
	return err
}

func (r *UserRepository) AddFCMToken(ctx context.Context, uid, token string) error {
	_, err := r.repo.Collection("users").Doc(uid).Update(ctx, []firestore.Update{
		{Path: "settings.fcmTokens", Value: firestore.ArrayUnion(token)},
	})
	return err
}

func (r *UserRepository) AddCommunityID(ctx context.Context, uid, communityID string) error {
	_, err := r.repo.Collection("users").Doc(uid).Update(ctx, []firestore.Update{
		{Path: "communityIds", Value: firestore.ArrayUnion(communityID)},
	})
	return err
}

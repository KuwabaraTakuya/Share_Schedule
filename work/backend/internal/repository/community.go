package repository

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	"github.com/share-schedule/backend/internal/models"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CommunityRepository struct {
	repo *FirestoreRepo
}

func NewCommunityRepository(repo *FirestoreRepo) *CommunityRepository {
	return &CommunityRepository{repo: repo}
}

func (r *CommunityRepository) GetByID(ctx context.Context, id string) (*models.Community, error) {
	doc, err := r.repo.Collection("communities").Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get community: %w", err)
	}

	var community models.Community
	if err := doc.DataTo(&community); err != nil {
		return nil, fmt.Errorf("decode community: %w", err)
	}
	community.ID = doc.Ref.ID
	return &community, nil
}

func (r *CommunityRepository) Create(ctx context.Context, community *models.Community) error {
	_, err := r.repo.Collection("communities").Doc(community.ID).Set(ctx, community)
	return err
}

func (r *CommunityRepository) Update(ctx context.Context, id string, data map[string]interface{}) error {
	updates := make([]firestore.Update, 0, len(data))
	for k, v := range data {
		updates = append(updates, firestore.Update{Path: k, Value: v})
	}
	_, err := r.repo.Collection("communities").Doc(id).Update(ctx, updates)
	return err
}

func (r *CommunityRepository) Delete(ctx context.Context, id string) error {
	_, err := r.repo.Collection("communities").Doc(id).Delete(ctx)
	return err
}

func (r *CommunityRepository) GetMember(ctx context.Context, communityID, userID string) (*models.CommunityMember, error) {
	doc, err := r.repo.Collection("communities").Doc(communityID).
		Collection("members").Doc(userID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get member: %w", err)
	}

	var member models.CommunityMember
	if err := doc.DataTo(&member); err != nil {
		return nil, fmt.Errorf("decode member: %w", err)
	}
	return &member, nil
}

func (r *CommunityRepository) GetMembers(ctx context.Context, communityID string) ([]*models.CommunityMember, error) {
	docs, err := r.repo.Collection("communities").Doc(communityID).
		Collection("members").Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("get members: %w", err)
	}

	members := make([]*models.CommunityMember, 0, len(docs))
	for _, doc := range docs {
		var member models.CommunityMember
		if err := doc.DataTo(&member); err != nil {
			continue
		}
		members = append(members, &member)
	}
	return members, nil
}

func (r *CommunityRepository) SetMember(ctx context.Context, communityID string, member *models.CommunityMember) error {
	_, err := r.repo.Collection("communities").Doc(communityID).
		Collection("members").Doc(member.UserID).Set(ctx, member)
	return err
}

func (r *CommunityRepository) RemoveMember(ctx context.Context, communityID, userID string) error {
	_, err := r.repo.Collection("communities").Doc(communityID).
		Collection("members").Doc(userID).Delete(ctx)
	return err
}

func (r *CommunityRepository) IsMember(ctx context.Context, communityID, userID string) (bool, error) {
	member, err := r.GetMember(ctx, communityID, userID)
	if err != nil {
		return false, err
	}
	return member != nil, nil
}

func (r *CommunityRepository) GetByInviteCode(ctx context.Context, code string) (*models.Community, error) {
	docs, err := r.repo.Collection("communities").
		Where("inviteCode", "==", code).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("query invite code: %w", err)
	}
	if len(docs) == 0 {
		return nil, nil
	}

	var community models.Community
	if err := docs[0].DataTo(&community); err != nil {
		return nil, fmt.Errorf("decode community: %w", err)
	}
	community.ID = docs[0].Ref.ID
	return &community, nil
}

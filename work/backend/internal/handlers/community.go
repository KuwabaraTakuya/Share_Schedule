package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/models"
	"github.com/share-schedule/backend/internal/repository"
)

type CommunityHandler struct {
	communityRepo *repository.CommunityRepository
	userRepo      *repository.UserRepository
}

func NewCommunityHandler(
	communityRepo *repository.CommunityRepository,
	userRepo *repository.UserRepository,
) *CommunityHandler {
	return &CommunityHandler{
		communityRepo: communityRepo,
		userRepo:      userRepo,
	}
}

func (h *CommunityHandler) GetAll(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	// TODO: ユーザーが所属するコミュニティを取得（membership インデックスを使う）
	// 現在はFirestoreのサブコレクション検索のため、バックエンドで全コミュニティをスキャンするのは非効率
	// 本番では users/{uid}/communityIds フィールドを使うことを推奨
	_ = uid
	return c.JSON([]models.Community{})
}

func (h *CommunityHandler) Create(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)

	var req struct {
		Name    string `json:"name"`
		IconURL string `json:"iconUrl"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Name is required"})
	}

	communityID := uuid.New().String()
	inviteCode := uuid.New().String()[:8]

	community := &models.Community{
		ID:         communityID,
		Name:       req.Name,
		IconURL:    req.IconURL,
		OwnerID:    uid,
		InviteCode: inviteCode,
		Settings: models.CommunitySettings{
			AvailabilityThreshold:      80,
			AllowAnonymousAvailability: true,
		},
		CreatedAt: time.Now(),
	}

	if err := h.communityRepo.Create(c.Context(), community); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create community"})
	}

	// オーナーをメンバーとして追加
	user, _ := h.userRepo.GetByID(c.Context(), uid)
	displayName := uid
	if user != nil {
		displayName = user.DisplayName
	}

	member := &models.CommunityMember{
		UserID:      uid,
		Role:        "owner",
		DisplayName: displayName,
		JoinedAt:    time.Now(),
		PrivacySettings: models.PrivacySettings{
			ShareCalendarWith: "none",
			ShareDetailWith:   "none",
		},
		NotificationSettings: models.NotificationSettings{
			Default: "all",
		},
	}

	if err := h.communityRepo.SetMember(c.Context(), communityID, member); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add owner as member"})
	}

	return c.Status(fiber.StatusCreated).JSON(community)
}

func (h *CommunityHandler) GetByID(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	communityID := c.Params("id")

	isMember, err := h.communityRepo.IsMember(c.Context(), communityID, uid)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check membership"})
	}
	if !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}

	community, err := h.communityRepo.GetByID(c.Context(), communityID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get community"})
	}
	if community == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Community not found"})
	}

	return c.JSON(community)
}

func (h *CommunityHandler) GetMembers(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	communityID := c.Params("id")

	isMember, err := h.communityRepo.IsMember(c.Context(), communityID, uid)
	if err != nil || !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}

	members, err := h.communityRepo.GetMembers(c.Context(), communityID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get members"})
	}

	return c.JSON(members)
}

func (h *CommunityHandler) GenerateInvite(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	communityID := c.Params("id")

	member, err := h.communityRepo.GetMember(c.Context(), communityID, uid)
	if err != nil || member == nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}
	if member.Role == "member" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Admin permission required"})
	}

	inviteCode := uuid.New().String()[:8]
	if err := h.communityRepo.Update(c.Context(), communityID, map[string]interface{}{
		"inviteCode": inviteCode,
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate invite"})
	}

	return c.JSON(fiber.Map{
		"inviteCode": inviteCode,
		"inviteUrl":  "/join/" + inviteCode,
	})
}

func (h *CommunityHandler) Join(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)

	var req struct {
		InviteCode string `json:"inviteCode"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	community, err := h.communityRepo.GetByInviteCode(c.Context(), req.InviteCode)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to find community"})
	}
	if community == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Invalid invite code"})
	}

	// 既存メンバーチェック
	existing, _ := h.communityRepo.GetMember(c.Context(), community.ID, uid)
	if existing != nil {
		return c.JSON(community)
	}

	user, _ := h.userRepo.GetByID(c.Context(), uid)
	displayName := uid
	if user != nil {
		displayName = user.DisplayName
	}

	member := &models.CommunityMember{
		UserID:      uid,
		Role:        "member",
		DisplayName: displayName,
		JoinedAt:    time.Now(),
		PrivacySettings: models.PrivacySettings{
			ShareCalendarWith: "none",
			ShareDetailWith:   "none",
		},
		NotificationSettings: models.NotificationSettings{
			Default: "all",
		},
	}

	if err := h.communityRepo.SetMember(c.Context(), community.ID, member); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to join community"})
	}

	return c.JSON(community)
}

func (h *CommunityHandler) KickMember(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	communityID := c.Params("id")
	targetUID := c.Params("uid")

	if uid == targetUID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot kick yourself"})
	}

	requestor, err := h.communityRepo.GetMember(c.Context(), communityID, uid)
	if err != nil || requestor == nil || requestor.Role == "member" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Admin permission required"})
	}

	// オーナーはキックできない
	target, err := h.communityRepo.GetMember(c.Context(), communityID, targetUID)
	if err != nil || target == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Member not found"})
	}
	if target.Role == "owner" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Cannot kick owner"})
	}

	if err := h.communityRepo.RemoveMember(c.Context(), communityID, targetUID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to kick member"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *CommunityHandler) UpdateMemberRole(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	communityID := c.Params("id")
	targetUID := c.Params("uid")

	requestor, err := h.communityRepo.GetMember(c.Context(), communityID, uid)
	if err != nil || requestor == nil || requestor.Role != "owner" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Owner permission required"})
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if req.Role != "admin" && req.Role != "member" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid role"})
	}

	if err := h.communityRepo.Update(c.Context(), communityID+"/members/"+targetUID, map[string]interface{}{
		"role": req.Role,
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update role"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

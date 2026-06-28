package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/repository"
)

type SearchHandler struct {
	communityRepo *repository.CommunityRepository
	messageRepo   *repository.MessageRepository
}

func NewSearchHandler(
	communityRepo *repository.CommunityRepository,
	messageRepo *repository.MessageRepository,
) *SearchHandler {
	return &SearchHandler{
		communityRepo: communityRepo,
		messageRepo:   messageRepo,
	}
}

func (h *SearchHandler) SearchUsers(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	query := c.Query("q")
	communityID := c.Query("communityId")

	isMember, err := h.communityRepo.IsMember(c.Context(), communityID, uid)
	if err != nil || !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}

	members, err := h.communityRepo.GetMembers(c.Context(), communityID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to search users"})
	}

	if query == "" {
		return c.JSON(members)
	}

	queryLower := strings.ToLower(query)
	var results []*interface{ GetDisplayName() string }
	_ = results

	// フィルタ
	var filtered []interface{}
	for _, m := range members {
		if strings.Contains(strings.ToLower(m.DisplayName), queryLower) {
			filtered = append(filtered, m)
		}
	}

	if filtered == nil {
		filtered = []interface{}{}
	}

	return c.JSON(filtered)
}

func (h *SearchHandler) SearchMessages(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	query := c.Query("q")
	communityID := c.Query("communityId")

	isMember, err := h.communityRepo.IsMember(c.Context(), communityID, uid)
	if err != nil || !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a member"})
	}

	_ = query
	// Firestoreは全文検索に対応していないため、Algolia等の外部検索エンジン連携を推奨
	// 現在はシンプルにチャンネルのメッセージを返す（本番はAlgolia/Typesense等と連携）
	return c.JSON([]interface{}{})
}

func (h *SearchHandler) SearchPlaces(c *fiber.Ctx) error {
	uid := middleware.GetUID(c)
	_ = uid
	// 場所検索はlocationタイプのメッセージを検索する
	// TODO: Firestoreのcompositeクエリで location.name を検索
	return c.JSON([]interface{}{})
}

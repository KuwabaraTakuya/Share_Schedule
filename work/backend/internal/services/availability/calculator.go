package availability

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/share-schedule/backend/internal/models"
	"github.com/share-schedule/backend/internal/repository"
	"github.com/share-schedule/backend/internal/services/gemini"
)

type Calculator struct {
	eventRepo   *repository.EventRepository
	communityRepo *repository.CommunityRepository
	gemini      *gemini.Client
}

func NewCalculator(
	eventRepo *repository.EventRepository,
	communityRepo *repository.CommunityRepository,
	geminiClient *gemini.Client,
) *Calculator {
	return &Calculator{
		eventRepo:     eventRepo,
		communityRepo: communityRepo,
		gemini:        geminiClient,
	}
}

func (c *Calculator) CalculateMonth(ctx context.Context, communityID string, year, month int) ([]models.DayAvailability, error) {
	// キャッシュ確認
	monthStr := fmt.Sprintf("%04d-%02d", year, month)
	cache, err := c.eventRepo.GetAvailabilityCache(ctx, communityID, monthStr)
	if err == nil && cache != nil {
		result := make([]models.DayAvailability, 0, len(cache.Days))
		for _, av := range cache.Days {
			// 1時間以内のキャッシュは有効
			if time.Since(av.CalculatedAt) < time.Hour {
				result = append(result, av)
			}
		}
		if len(result) > 0 {
			return result, nil
		}
	}

	// メンバー取得
	members, err := c.communityRepo.GetMembers(ctx, communityID)
	if err != nil {
		return nil, fmt.Errorf("get members: %w", err)
	}
	if len(members) == 0 {
		return nil, nil
	}

	// 月の日付範囲
	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	// コミュニティ設定を取得（デフォルト80%）
	threshold := 80

	// 各日の計算
	var result []models.DayAvailability
	cacheData := &models.AvailabilityCache{
		Days: make(map[string]models.DayAvailability),
	}

	for d := startOfMonth; !d.After(endOfMonth); d = d.AddDate(0, 0, 1) {
		dayStart := time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
		dayEnd := dayStart.Add(24*time.Hour - time.Second)
		dateStr := d.Format("2006-01-02")

		// メンバーの当日イベントを取得して集計
		memberEvents := make(map[string][]*models.CalendarEvent)
		for _, member := range members {
			events, err := c.eventRepo.GetByUserAndRange(ctx, member.UserID, dayStart, dayEnd)
			if err != nil {
				continue
			}
			// プライバシー設定に従いフィルタ
			var visibleEvents []*models.CalendarEvent
			for _, event := range events {
				if event.Visibility == "private" {
					// 終日予定があるかどうかだけ判定用に保持（詳細は非公開）
					visibleEvents = append(visibleEvents, &models.CalendarEvent{
						IsAllDay:  event.IsAllDay,
						StartTime: event.StartTime,
						EndTime:   event.EndTime,
					})
				} else {
					visibleEvents = append(visibleEvents, event)
				}
			}
			memberEvents[member.UserID] = visibleEvents
		}

		av := c.calculateDay(ctx, dateStr, memberEvents, len(members), threshold)
		result = append(result, av)
		cacheData.Days[dateStr] = av
	}

	// キャッシュ保存
	_ = c.eventRepo.SetAvailabilityCache(ctx, communityID, monthStr, cacheData)

	return result, nil
}

func (c *Calculator) calculateDay(
	ctx context.Context,
	date string,
	memberEvents map[string][]*models.CalendarEvent,
	totalMembers int,
	threshold int,
) models.DayAvailability {
	if totalMembers == 0 {
		return models.DayAvailability{
			Date:           date,
			Status:         "○",
			AvailableCount: 0,
			TotalCount:     0,
			CalculatedAt:   time.Now(),
		}
	}

	// 全員空きか確認
	freeCount := 0
	busyCount := 0
	for _, events := range memberEvents {
		if len(events) == 0 {
			freeCount++
		} else {
			busyCount++
		}
	}

	// ルールベース判定（明確なケース）
	if freeCount == totalMembers {
		return models.DayAvailability{
			Date:           date,
			Status:         "○",
			AvailableCount: freeCount,
			TotalCount:     totalMembers,
			CalculatedAt:   time.Now(),
		}
	}

	if busyCount == totalMembers {
		return models.DayAvailability{
			Date:           date,
			Status:         "×",
			AvailableCount: 0,
			TotalCount:     totalMembers,
			CalculatedAt:   time.Now(),
		}
	}

	// 中間ケースはGeminiで判定
	if c.gemini != nil {
		eventsData := buildEventsDescription(memberEvents)
		av, err := c.gemini.CalculateAvailability(ctx, eventsData, totalMembers, threshold, date)
		if err == nil {
			return *av
		}
	}

	// Gemini失敗時のフォールバック
	availablePercent := float64(freeCount) / float64(totalMembers) * 100
	status := "×"
	if availablePercent >= float64(threshold) {
		status = "△"
	}

	return models.DayAvailability{
		Date:           date,
		Status:         status,
		AvailableCount: freeCount,
		TotalCount:     totalMembers,
		CalculatedAt:   time.Now(),
	}
}

func buildEventsDescription(memberEvents map[string][]*models.CalendarEvent) string {
	var sb strings.Builder
	i := 0
	for _, events := range memberEvents {
		i++
		label := fmt.Sprintf("メンバー%c", rune('A'+i-1))
		if len(events) == 0 {
			sb.WriteString(fmt.Sprintf("%s: 空き\n", label))
		} else {
			var eventDescs []string
			for _, e := range events {
				if e.IsAllDay {
					eventDescs = append(eventDescs, "終日予定あり")
				} else {
					eventDescs = append(eventDescs, fmt.Sprintf("%s〜%s予定あり",
						e.StartTime.Format("15:04"),
						e.EndTime.Format("15:04"),
					))
				}
			}
			sb.WriteString(fmt.Sprintf("%s: %s\n", label, strings.Join(eventDescs, ", ")))
		}
	}
	return sb.String()
}

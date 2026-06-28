package gemini

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/share-schedule/backend/internal/models"
	"google.golang.org/api/option"
)

type Client struct {
	model *genai.GenerativeModel
}

func NewClient(apiKey string) (*Client, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("create gemini client: %w", err)
	}

	model := client.GenerativeModel("gemini-1.5-flash")
	model.SetTemperature(0.3)
	model.SetMaxOutputTokens(1024)

	return &Client{model: model}, nil
}

type scheduleJSON struct {
	Title       string  `json:"title"`
	StartTime   string  `json:"startTime"`
	EndTime     string  `json:"endTime"`
	IsAllDay    bool    `json:"isAllDay"`
	Location    string  `json:"location,omitempty"`
	Description string  `json:"description,omitempty"`
	Confidence  float64 `json:"confidence"`
}

func (c *Client) ParseScheduleFromText(ctx context.Context, text, timezone string, now time.Time) (*models.ParsedEvent, error) {
	prompt := fmt.Sprintf(`あなたはスケジュール解析AIです。ユーザーの自然言語入力を構造化されたスケジュールデータ（JSON）に変換してください。
現在日時: %s
ユーザーのタイムゾーン: %s

出力形式（JSONのみ返却。それ以外の文字は一切出力しないこと）:
{
  "title": "予定のタイトル",
  "startTime": "ISO8601形式",
  "endTime": "ISO8601形式",
  "isAllDay": false,
  "location": "場所（あれば）",
  "description": "メモ（あれば）",
  "confidence": 0.0〜1.0
}

不明な部分はnullではなく省略し、endTimeが不明な場合はstartTimeの1時間後にすること。

ユーザー入力: %s`, now.Format(time.RFC3339), timezone, text)

	resp, err := c.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, fmt.Errorf("generate content: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty response from gemini")
	}

	rawText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])
	rawText = strings.TrimSpace(rawText)
	rawText = strings.TrimPrefix(rawText, "```json")
	rawText = strings.TrimPrefix(rawText, "```")
	rawText = strings.TrimSuffix(rawText, "```")
	rawText = strings.TrimSpace(rawText)

	var result scheduleJSON
	if err := json.Unmarshal([]byte(rawText), &result); err != nil {
		return nil, fmt.Errorf("parse gemini response: %w", err)
	}

	startTime, err := time.Parse(time.RFC3339, result.StartTime)
	if err != nil {
		return nil, fmt.Errorf("parse start time: %w", err)
	}

	endTime := startTime.Add(time.Hour)
	if result.EndTime != "" {
		if t, err := time.Parse(time.RFC3339, result.EndTime); err == nil {
			endTime = t
		}
	}

	return &models.ParsedEvent{
		Title:       result.Title,
		StartTime:   startTime,
		EndTime:     endTime,
		IsAllDay:    result.IsAllDay,
		Location:    result.Location,
		Description: result.Description,
		Confidence:  result.Confidence,
	}, nil
}

type availabilityJSON struct {
	Status         string   `json:"status"`
	AvailableCount int      `json:"availableCount"`
	TotalCount     int      `json:"totalCount"`
	BestTimeRanges []string `json:"bestTimeRanges,omitempty"`
}

func (c *Client) CalculateAvailability(ctx context.Context, eventsData string, memberCount, threshold int, date string) (*models.DayAvailability, error) {
	prompt := fmt.Sprintf(`グループの%sの空き時間を分析し○/△/×を判定してください。
メンバー数: %d人
しきい値: %d%%以上が空きなら△（それ以上なら○）
匿名モード: 有効（個人名は絶対に返さないこと）

メンバーの予定:
%s

出力形式（JSONのみ返却。それ以外の文字は一切出力しないこと）:
{
  "status": "○" または "△" または "×",
  "availableCount": 数字,
  "totalCount": 数字,
  "bestTimeRanges": ["午前", "午後"]
}

判定基準:
- ○: 全員が空き
- △: %d%%以上が空き、または少数の例外あり
- ×: 過半数以上が終日予定あり`, date, memberCount, threshold, eventsData, threshold)

	resp, err := c.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, fmt.Errorf("generate availability: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty response")
	}

	rawText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])
	rawText = strings.TrimSpace(rawText)
	rawText = strings.TrimPrefix(rawText, "```json")
	rawText = strings.TrimPrefix(rawText, "```")
	rawText = strings.TrimSuffix(rawText, "```")
	rawText = strings.TrimSpace(rawText)

	var result availabilityJSON
	if err := json.Unmarshal([]byte(rawText), &result); err != nil {
		return nil, fmt.Errorf("parse availability response: %w", err)
	}

	return &models.DayAvailability{
		Date:           date,
		Status:         result.Status,
		AvailableCount: result.AvailableCount,
		TotalCount:     result.TotalCount,
		BestTimeRanges: result.BestTimeRanges,
		CalculatedAt:   time.Now(),
	}, nil
}

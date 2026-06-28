package safebrowsing

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type Checker struct {
	apiKey string
}

func NewChecker(apiKey string) *Checker {
	return &Checker{apiKey: apiKey}
}

type SafetyResult struct {
	IsSafe     bool   `json:"isSafe"`
	ThreatType string `json:"threatType,omitempty"`
}

type safeBrowsingRequest struct {
	Client struct {
		ClientID      string `json:"clientId"`
		ClientVersion string `json:"clientVersion"`
	} `json:"client"`
	ThreatInfo struct {
		ThreatTypes      []string `json:"threatTypes"`
		PlatformTypes    []string `json:"platformTypes"`
		ThreatEntryTypes []string `json:"threatEntryTypes"`
		ThreatEntries    []struct {
			URL string `json:"url"`
		} `json:"threatEntries"`
	} `json:"threatInfo"`
}

type safeBrowsingResponse struct {
	Matches []struct {
		ThreatType string `json:"threatType"`
		URL        struct {
			URL string `json:"url"`
		} `json:"threat"`
	} `json:"matches"`
}

func (c *Checker) CheckURL(ctx context.Context, url string) (*SafetyResult, error) {
	if c.apiKey == "" {
		return &SafetyResult{IsSafe: true}, nil
	}

	reqBody := safeBrowsingRequest{}
	reqBody.Client.ClientID = "share-schedule"
	reqBody.Client.ClientVersion = "1.0"
	reqBody.ThreatInfo.ThreatTypes = []string{
		"MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION",
	}
	reqBody.ThreatInfo.PlatformTypes = []string{"ANY_PLATFORM"}
	reqBody.ThreatInfo.ThreatEntryTypes = []string{"URL"}
	reqBody.ThreatInfo.ThreatEntries = []struct {
		URL string `json:"url"`
	}{{URL: url}}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	endpoint := fmt.Sprintf(
		"https://safebrowsing.googleapis.com/v4/threatMatches:find?key=%s",
		c.apiKey,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("execute request: %w", err)
	}
	defer resp.Body.Close()

	var sbResp safeBrowsingResponse
	if err := json.NewDecoder(resp.Body).Decode(&sbResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	if len(sbResp.Matches) == 0 {
		return &SafetyResult{IsSafe: true}, nil
	}

	return &SafetyResult{
		IsSafe:     false,
		ThreatType: sbResp.Matches[0].ThreatType,
	}, nil
}

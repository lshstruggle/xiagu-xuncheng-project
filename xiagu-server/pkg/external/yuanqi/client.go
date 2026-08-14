package yuanqi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"go.uber.org/zap"
)

// ===== 请求结构体 =====

// Message 对话消息（发送用）
type Message struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"` // 发送时用数组格式
}

// ContentItem 发送时content数组中的元素
type ContentItem struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// NewTextMessage 创建文本消息（发送用）
func NewTextMessage(role, text string) Message {
	return Message{
		Role: role,
		Content: []ContentItem{
			{Type: "text", Text: text},
		},
	}
}

// chatRequest 请求体
type chatRequest struct {
	AssistantID string    `json:"assistant_id"`
	UserID      string    `json:"user_id"`
	Messages    []Message `json:"messages"`
	Stream      bool      `json:"stream"`
}

// ===== 响应结构体 =====

// chatResponse 响应体（content是字符串）
type chatResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"` // 返回时是字符串
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// ===== 客户端 =====

type Client struct {
	baseURL     string
	assistantID string
	httpClient  *http.Client
	maxRetries  int
	logger      *zap.SugaredLogger
}

func NewClient(baseURL, assistantID string, timeout time.Duration, maxRetries int, logger *zap.SugaredLogger) *Client {
	if logger == nil {
		logger = zap.NewNop().Sugar()
	}
	return &Client{
		baseURL:     baseURL,
		assistantID: assistantID,
		httpClient:  &http.Client{Timeout: timeout},
		maxRetries:  maxRetries,
		logger:      logger,
	}
}

// Chat 发送对话请求，返回AI文本回复
func (c *Client) Chat(ctx context.Context, userID string, messages []Message) (string, error) {
	if !c.Configured() {
		return "", fmt.Errorf("元器客户端未配置")
	}

	// 将所有消息转换为元器要求的content数组格式
	apiMessages := make([]Message, 0, len(messages))
	for _, msg := range messages {
		// 如果content已经是字符串，转换为数组格式
		switch v := msg.Content.(type) {
		case string:
			apiMessages = append(apiMessages, NewTextMessage(msg.Role, v))
		case []ContentItem:
			apiMessages = append(apiMessages, msg)
		default:
			apiMessages = append(apiMessages, NewTextMessage(msg.Role, fmt.Sprintf("%v", v)))
		}
	}

	reqBody := chatRequest{
		AssistantID: c.assistantID,
		UserID:      userID,
		Messages:    apiMessages,
		Stream:      false,
	}

	var lastErr error

	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		if attempt > 0 {
			timer := time.NewTimer(time.Duration(attempt) * time.Second)
			select {
			case <-ctx.Done():
				timer.Stop()
				return "", fmt.Errorf("元器调用已取消: %w", ctx.Err())
			case <-timer.C:
			}
			c.logger.Warnf("[元器] 第%d次重试...", attempt)
		}

		body, err := json.Marshal(reqBody)
		if err != nil {
			lastErr = fmt.Errorf("序列化请求失败: %w", err)
			continue
		}

		req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL, bytes.NewReader(body))
		if err != nil {
			lastErr = fmt.Errorf("创建请求失败: %w", err)
			continue
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Source", "openapi")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("网络请求失败: %w", err)
			continue
		}

		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		c.logger.Infof("[元器] 响应状态: %d", resp.StatusCode)

		if resp.StatusCode != 200 {
			lastErr = fmt.Errorf("元器API返回%d: %s", resp.StatusCode, string(respBody))
			continue
		}

		// 解析响应
		var result chatResponse
		if err := json.Unmarshal(respBody, &result); err != nil {
			lastErr = fmt.Errorf("解析响应失败: %w, 原始响应: %s", err, string(respBody))
			continue
		}

		// 检查错误
		if result.Error != nil {
			lastErr = fmt.Errorf("元器返回错误: %s - %s", result.Error.Code, result.Error.Message)
			continue
		}

		if len(result.Choices) == 0 {
			lastErr = fmt.Errorf("元器返回空choices")
			continue
		}

		reply := result.Choices[0].Message.Content
		c.logger.Infof("[元器] 回复: %s", truncateStr(reply, 50))
		return reply, nil
	}

	return "", fmt.Errorf("元器调用失败(重试%d次): %w", c.maxRetries, lastErr)
}

// Configured reports whether all credentials required for an upstream call
// are available. Yuanqi is optional so the rest of the API can still start
// and AIService can return its fixed fallback reply.
func (c *Client) Configured() bool {
	return strings.TrimSpace(c.baseURL) != "" &&
		strings.TrimSpace(c.assistantID) != ""
}

func truncateStr(s string, maxLen int) string {
	r := []rune(s)
	if len(r) <= maxLen {
		return s
	}
	return string(r[:maxLen]) + "..."
}

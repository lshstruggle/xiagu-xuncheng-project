package yuanqi

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestClientRejectsUnconfiguredUpstream(t *testing.T) {
	client := NewClient("", "", time.Second, 0, nil)

	_, err := client.Chat(context.Background(), "user-id", nil)
	if err == nil || !strings.Contains(err.Error(), "未配置") {
		t.Fatalf("expected unconfigured client error, got %v", err)
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (function roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return function(request)
}

func TestClientRetryBackoffHonorsContext(t *testing.T) {
	client := NewClient(
		"https://yuanqi.example/chat",
		"assistant-id",
		time.Second,
		2,
		nil,
	)
	client.httpClient.Transport = roundTripFunc(func(*http.Request) (*http.Response, error) {
		return nil, errors.New("upstream unavailable")
	})

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	started := time.Now()
	_, err := client.Chat(ctx, "user-id", []Message{NewTextMessage("user", "hello")})
	if err == nil || !strings.Contains(err.Error(), "取消") {
		t.Fatalf("expected cancelled retry, got %v", err)
	}
	if elapsed := time.Since(started); elapsed > 500*time.Millisecond {
		t.Fatalf("context cancellation took too long: %s", elapsed)
	}
}

func TestClientConfigured(t *testing.T) {
	client := NewClient(
		"https://yuanqi.example/chat",
		"assistant-id",
		time.Second,
		0,
		nil,
	)

	if !client.Configured() {
		t.Fatal("expected complete Yuanqi configuration")
	}
}

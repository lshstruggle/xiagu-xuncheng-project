package repository

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"xiagu-server/internal/database"
)

func TestAIUsageBucketRejectsConfiguredLimit(t *testing.T) {
	requests := 0
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		requests++
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(
			`{"code":"DATABASE_REQUEST_FAILED","message":"E11000 duplicate key error","list":[]}`,
		))
	}))
	defer server.Close()

	repo := newAIUsageTestRepo(t, server.URL)
	err := repo.consumeBucket(
		context.Background(),
		"user-1:minute:bucket",
		"user-1",
		"minute",
		5,
		time.Now().Add(time.Minute),
	)
	if !errors.Is(err, ErrAIRateLimited) {
		t.Fatalf("expected rate limit, got %v", err)
	}
	if requests != 1 {
		t.Fatalf("limited bucket must not be incremented, requests=%d", requests)
	}
}

func TestAIUsageBucketIncrementsBelowLimit(t *testing.T) {
	requests := 0
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		requests++
		writer.Header().Set("Content-Type", "application/json")
		body, err := io.ReadAll(request.Body)
		if err != nil {
			t.Fatalf("read update: %v", err)
		}
		encoded := string(body)
		if !strings.Contains(encoded, `"$inc"`) ||
			!strings.Contains(encoded, `"expires_at"`) ||
			!strings.Contains(encoded, `"$lt"`) {
			t.Fatalf("unexpected usage update: %s", encoded)
		}
		_, _ = writer.Write([]byte(
			`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"}}]]}`,
		))
	}))
	defer server.Close()

	repo := newAIUsageTestRepo(t, server.URL)
	err := repo.consumeBucket(
		context.Background(),
		"user-1:minute:bucket",
		"user-1",
		"minute",
		5,
		time.Now().Add(time.Minute),
	)
	if err != nil {
		t.Fatalf("consume bucket: %v", err)
	}
	if requests != 1 {
		t.Fatalf("expected one atomic update, requests=%d", requests)
	}
}

func newAIUsageTestRepo(t *testing.T, baseURL string) *AIUsageRepo {
	t.Helper()
	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       baseURL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create database client: %v", err)
	}
	return NewAIUsageRepo(database.NewCollections(client, "test_"))
}

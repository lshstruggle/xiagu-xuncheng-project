package repository

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"xiagu-server/internal/database"
)

func TestAcquireCooldownGuardUsesAtomicUpdateResult(t *testing.T) {
	tests := []struct {
		name      string
		response  string
		firstTime bool
		cooldown  bool
	}{
		{
			name: "new guard is first check-in",
			response: `{"list":[[{"n":{"$numberInt":"1"},` +
				`"nModified":{"$numberInt":"0"},` +
				`"upserted":[{"index":{"$numberInt":"0"},"_id":"guard"}]}]]}`,
			firstTime: true,
		},
		{
			name: "expired guard is repeat check-in",
			response: `{"list":[[{"n":{"$numberInt":"1"},` +
				`"nModified":{"$numberInt":"1"}}]]}`,
			firstTime: false,
		},
		{
			name: "recent guard is rejected",
			response: `{"list":[[{"n":{"$numberInt":"0"},` +
				`"nModified":{"$numberInt":"0"}}]]}`,
			cooldown: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(
				writer http.ResponseWriter,
				request *http.Request,
			) {
				writer.Header().Set("Content-Type", "application/json")
				_, _ = writer.Write([]byte(test.response))
			}))
			defer server.Close()

			client, err := database.NewHTTPClient(database.HTTPClientConfig{
				EnvironmentID: "test-env",
				BaseURL:       server.URL,
			}, database.StaticToken("test-key"))
			if err != nil {
				t.Fatalf("create database client: %v", err)
			}
			repo := NewCheckinRepo(database.NewCollections(client, "test_"))

			firstTime, err := repo.AcquireCooldownGuard(
				context.Background(),
				"user-1",
				"poi-1",
				time.Now().Add(-24*time.Hour),
			)
			if test.cooldown {
				if !errors.Is(err, ErrCheckinCooldown) {
					t.Fatalf("expected cooldown, got %v", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("acquire guard: %v", err)
			}
			if firstTime != test.firstTime {
				t.Fatalf("firstTime = %t, want %t", firstTime, test.firstTime)
			}
		})
	}
}

package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"xiagu-server/internal/database"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
)

func TestCompleteBossRejectsInvalidOrUnfinishedChallenge(t *testing.T) {
	service := NewChallengeService(&repository.Repos{})
	tests := []BossCompletionRequest{
		{BossID: "missing", Mode: "quiz", Score: 4, HeroID: "libai", UserLat: 30.669, UserLng: 104.054},
		{BossID: "zhuzai", Mode: "invalid", Score: 4, HeroID: "libai", UserLat: 30.669, UserLng: 104.054},
		{BossID: "zhuzai", Mode: "quiz", Score: 3, HeroID: "libai", UserLat: 30.669, UserLng: 104.054},
		{BossID: "zhuzai", Mode: "minigame", Score: 999, HeroID: "libai", UserLat: 30.669, UserLng: 104.054},
		{BossID: "zhuzai", Mode: "quiz", Score: 4, HeroID: "libai", UserLat: 31, UserLng: 105},
	}
	for _, request := range tests {
		_, err := service.CompleteBoss(context.Background(), merchTestUserID, request)
		var applicationError *errcode.AppError
		if !errors.As(err, &applicationError) || applicationError.Code < 400 {
			t.Fatalf("request %#v should be rejected, got %v", request, err)
		}
	}
}

func TestCompleteBossAtomicallyPersistsCooldownAndReward(t *testing.T) {
	commandNumber := 0
	committed := false
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/transactions"):
			writer.WriteHeader(http.StatusCreated)
			_, _ = writer.Write([]byte(`{"transactionId":"boss-tx"}`))
		case strings.HasSuffix(request.URL.Path, "/commands"):
			commandNumber++
			var body struct {
				Commands      []map[string]any `json:"commands"`
				TransactionID string           `json:"transactionId"`
			}
			if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
				t.Fatalf("decode command: %v", err)
			}
			if body.TransactionID != "boss-tx" || len(body.Commands) != 1 {
				t.Fatalf("challenge writes must share transaction: %#v", body)
			}
			encoded, _ := json.Marshal(body.Commands[0])
			switch commandNumber {
			case 1:
				if !strings.Contains(string(encoded), "test_challenge_progress") ||
					!strings.Contains(string(encoded), `"$max"`) ||
					!strings.Contains(string(encoded), "cooldown_until") {
					t.Fatalf("unexpected progress write: %s", encoded)
				}
			case 2:
				if !strings.Contains(string(encoded), "test_users") ||
					!strings.Contains(string(encoded), "boss_posters") ||
					!strings.Contains(string(encoded), "hero_fragments") {
					t.Fatalf("unexpected reward write: %s", encoded)
				}
			default:
				t.Fatalf("unexpected command number %d", commandNumber)
			}
			_, _ = writer.Write([]byte(
				`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"}}]]}`,
			))
		case strings.HasSuffix(request.URL.Path, "/commit"):
			committed = true
			writer.WriteHeader(http.StatusNoContent)
		default:
			t.Fatalf("unexpected request %s", request.URL.Path)
		}
	}))
	defer server.Close()

	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env", BaseURL: server.URL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create client: %v", err)
	}
	service := NewChallengeService(repository.NewRepos(
		database.NewCollections(client, "test_"),
	))
	response, err := service.CompleteBoss(
		context.Background(),
		merchTestUserID,
		BossCompletionRequest{
			BossID: "zhuzai", Mode: "quiz", Score: 4, HeroID: "libai",
			UserLat: 30.669, UserLng: 104.054,
		},
	)
	if err != nil {
		t.Fatalf("complete boss: %v", err)
	}
	if !response.Success || response.Reward.HeroFragments != 5 || !committed {
		t.Fatalf("unexpected completion response: %#v", response)
	}
}

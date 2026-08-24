package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"xiagu-server/internal/database"
	"xiagu-server/internal/repository"
)

func TestAchievementsUseCloudProgressAndPersistUnlock(t *testing.T) {
	requestNumber := 0
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		requestNumber++
		writer.Header().Set("Content-Type", "application/json")
		var body struct {
			Commands []map[string]any `json:"commands"`
		}
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Fatalf("decode command: %v", err)
		}
		switch requestNumber {
		case 1:
			_, _ = writer.Write([]byte(`{"list":[[{"_id":{"$oid":"` + merchTestUserID + `"},"badges":[],"spirit_badges":[],"bond_bookmarks":[],"completed_routes":[],"share_count":{"$numberInt":"0"}}]]}`))
		case 2:
			_, _ = writer.Write([]byte(`{"list":[[{"user_id":"` + merchTestUserID + `","poi_id":"poi-1"},{"user_id":"` + merchTestUserID + `","poi_id":"poi-1"}]]}`))
		case 3:
			_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"19"}}]]}`))
		case 4:
			command := body.Commands[0]
			if command["update"] != "test_achievements" {
				t.Fatalf("expected achievement persistence, got %#v", command)
			}
			_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"}}]]}`))
		default:
			t.Fatalf("unexpected request %d", requestNumber)
		}
	}))
	defer server.Close()

	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env", BaseURL: server.URL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create client: %v", err)
	}
	service := NewAchievementService(repository.NewRepos(
		database.NewCollections(client, "test_"),
	))
	response, err := service.Get(context.Background(), merchTestUserID)
	if err != nil {
		t.Fatalf("get achievements: %v", err)
	}
	if len(response.Items) != 11 || response.EarnedScore != 1 || response.TotalScore != 30 {
		t.Fatalf("unexpected achievement summary: %#v", response)
	}
	if !response.Items[0].Unlocked || response.Items[1].Unlocked {
		t.Fatalf("unexpected unlock state: %#v", response.Items[:2])
	}
}

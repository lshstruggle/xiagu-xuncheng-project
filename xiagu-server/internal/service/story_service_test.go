package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
)

func TestResolveStoryAdvanceLinearNode(t *testing.T) {
	definition := &model.StoryDefinition{Nodes: map[string]model.StoryNode{
		"start": {ID: "start", Type: "dialog", NextNodeID: "next"},
		"next":  {ID: "next", Type: "dialog"},
	}}
	node, next, err := resolveStoryAdvance(definition, "start", "")
	if err != nil || node.ID != "start" || next != "next" {
		t.Fatalf("unexpected transition: node=%#v next=%q err=%v", node, next, err)
	}
}

func TestResolveStoryAdvanceValidatesChoice(t *testing.T) {
	definition := &model.StoryDefinition{Nodes: map[string]model.StoryNode{
		"choice": {
			ID:   "choice",
			Type: "choice",
			Choices: []model.StoryChoice{
				{ID: "left", NextNodeID: "left-ending"},
				{ID: "right", NextNodeID: "right-ending"},
			},
		},
		"left-ending":  {ID: "left-ending", Type: "ending"},
		"right-ending": {ID: "right-ending", Type: "ending"},
	}}

	_, next, err := resolveStoryAdvance(definition, "choice", "right")
	if err != nil || next != "right-ending" {
		t.Fatalf("valid choice failed: next=%q err=%v", next, err)
	}
	assertStoryAppErrorCode(t, func() error {
		_, _, err := resolveStoryAdvance(definition, "choice", "")
		return err
	}(), 400)
	assertStoryAppErrorCode(t, func() error {
		_, _, err := resolveStoryAdvance(definition, "choice", "missing")
		return err
	}(), 400)
}

func TestResolveStoryAdvanceRejectsBrokenDefinition(t *testing.T) {
	definition := &model.StoryDefinition{Nodes: map[string]model.StoryNode{
		"start": {ID: "start", Type: "dialog", NextNodeID: "missing"},
	}}
	_, _, err := resolveStoryAdvance(definition, "start", "")
	assertStoryAppErrorCode(t, err, 500)
}

func TestAppendUniqueMakesRewardClaimsIdempotent(t *testing.T) {
	values := appendUnique(nil, "reward-node")
	values = appendUnique(values, "reward-node")
	if len(values) != 1 || values[0] != "reward-node" {
		t.Fatalf("unexpected unique values: %#v", values)
	}
}

func TestNormalizeStoryMode(t *testing.T) {
	mode, err := normalizeStoryMode("")
	if err != nil || mode != "explore" {
		t.Fatalf("default mode = %q, %v", mode, err)
	}
	if _, err := normalizeStoryMode("invalid"); err == nil {
		t.Fatal("invalid mode must be rejected")
	}
}

func TestValidStoryProgressRejectsLegacyEmptyDocument(t *testing.T) {
	if validStoryProgress(&model.StoryProgress{}, "user-1", "story-1", "explore") {
		t.Fatal("empty legacy progress must not be treated as valid")
	}
	progress := &model.StoryProgress{
		ID:            "user-1:story-1:explore",
		UserID:        "user-1",
		StoryID:       "story-1",
		Mode:          "explore",
		CurrentNodeID: "start",
		Status:        "ongoing",
		Revision:      1,
	}
	if !validStoryProgress(progress, "user-1", "story-1", "explore") {
		t.Fatal("complete progress must be reusable")
	}
}

func TestStartInitializesProgressWithoutTransactionalReadBack(t *testing.T) {
	commandCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/transactions"):
			writer.WriteHeader(http.StatusCreated)
			_, _ = writer.Write([]byte(`{"transactionId":"story-tx"}`))
		case strings.HasSuffix(request.URL.Path, "/commit"):
			writer.WriteHeader(http.StatusNoContent)
		case strings.HasSuffix(request.URL.Path, "/commands"):
			commandCount++
			var body struct {
				Commands []map[string]any `json:"commands"`
			}
			if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
				t.Fatalf("decode command: %v", err)
			}
			if len(body.Commands) != 1 {
				t.Fatalf("unexpected commands: %#v", body.Commands)
			}
			command := body.Commands[0]
			switch commandCount {
			case 1:
				if command["find"] != "test_stories" {
					t.Fatalf("expected story definition query, got %#v", command)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"_id":"story-1","hero_id":"libai","version":{"$numberInt":"1"},"start_node_id":"start","status":"active","nodes":{"start":{"id":"start","type":"dialog"}}}]]}`))
			case 2:
				if command["find"] != "test_story_progress" {
					t.Fatalf("expected progress query, got %#v", command)
				}
				// Reproduce the legacy empty progress returned by the live database.
				_, _ = writer.Write([]byte(`{"list":[[{}]]}`))
			case 3:
				if command["update"] != "test_story_progress" {
					t.Fatalf("expected progress repair, got %#v", command)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"},"ok":{"$numberInt":"1"}}]]}`))
			default:
				t.Fatalf("unexpected read after progress initialization: %#v", command)
			}
		default:
			t.Fatalf("unexpected request %s", request.URL.Path)
		}
	}))
	defer server.Close()

	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       server.URL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create database client: %v", err)
	}
	repos := repository.NewRepos(database.NewCollections(client, "test_"))
	progress, err := NewStoryService(repos).Start(
		context.Background(),
		"user-1",
		"story-1",
		"libai",
		"explore",
	)
	if err != nil {
		t.Fatalf("start story: %v", err)
	}
	if !validStoryProgress(progress, "user-1", "story-1", "explore") {
		t.Fatalf("unexpected progress: %#v", progress)
	}
	if progress.CurrentNodeID != "start" || progress.Revision != 1 {
		t.Fatalf("unexpected initialized state: %#v", progress)
	}
	if commandCount != 3 {
		t.Fatalf("expected three database commands, got %d", commandCount)
	}
}

func TestSetStatusUsesAtomicRevisionWriteWithoutTransactionalRead(t *testing.T) {
	commandCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/commands"):
			commandCount++
			var body struct {
				Commands []map[string]any `json:"commands"`
			}
			if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
				t.Fatalf("decode command: %v", err)
			}
			command := body.Commands[0]
			switch commandCount {
			case 1:
				if command["find"] != "test_story_progress" {
					t.Fatalf("expected progress query, got %#v", command)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"_id":"user-1:story-1:explore","user_id":"user-1","story_id":"story-1","hero_id":"libai","mode":"explore","current_node_id":"start","completed_nodes":[],"claimed_reward_nodes":[],"choices":{},"status":"ongoing","revision":{"$numberLong":"1"},"story_version":{"$numberInt":"1"},"started_at":{"$date":{"$numberLong":"1786700000000"}},"updated_at":{"$date":{"$numberLong":"1786700000000"}}}]]}`))
			case 2:
				if command["update"] != "test_story_progress" {
					t.Fatalf("expected progress update, got %#v", command)
				}
				updates, ok := command["updates"].([]any)
				if !ok || len(updates) != 1 {
					t.Fatalf("unexpected updates: %#v", command["updates"])
				}
				update, ok := updates[0].(map[string]any)
				if !ok {
					t.Fatalf("unexpected update: %#v", updates[0])
				}
				filter, ok := update["q"].(map[string]any)
				if !ok || filter["_id"] != "user-1:story-1:explore" {
					t.Fatalf("unexpected update filter: %#v", update["q"])
				}
				if filter["revision"] != float64(1) {
					t.Fatalf("expected optimistic revision filter: %#v", filter)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"},"ok":{"$numberInt":"1"}}]]}`))
			default:
				t.Fatalf("unexpected command: %#v", command)
			}
		default:
			t.Fatalf("unexpected request %s", request.URL.Path)
		}
	}))
	defer server.Close()

	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       server.URL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create database client: %v", err)
	}
	repos := repository.NewRepos(database.NewCollections(client, "test_"))
	progress, err := NewStoryService(repos).SetStatus(
		context.Background(),
		"user-1",
		"story-1",
		"explore",
		"paused",
		1,
	)
	if err != nil {
		t.Fatalf("pause story: %v", err)
	}
	if progress.Status != "paused" || progress.Revision != 2 {
		t.Fatalf("unexpected progress: %#v", progress)
	}
}

func TestAdvanceKeepsReadsOutsideWriteOnlyTransaction(t *testing.T) {
	commandCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/transactions"):
			writer.WriteHeader(http.StatusCreated)
			_, _ = writer.Write([]byte(`{"transactionId":"advance-tx"}`))
		case strings.HasSuffix(request.URL.Path, "/commit"):
			writer.WriteHeader(http.StatusNoContent)
		case strings.HasSuffix(request.URL.Path, "/commands"):
			commandCount++
			var body struct {
				Commands      []map[string]any `json:"commands"`
				TransactionID string           `json:"transactionId"`
			}
			if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
				t.Fatalf("decode command: %v", err)
			}
			command := body.Commands[0]
			switch commandCount {
			case 1:
				if body.TransactionID != "" || command["find"] != "test_stories" {
					t.Fatalf("definition read must be outside transaction: %#v", body)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"_id":"story-1","hero_id":"libai","version":{"$numberInt":"1"},"start_node_id":"start","status":"active","nodes":{"start":{"id":"start","type":"dialog","next_node_id":"next"},"next":{"id":"next","type":"dialog"}}}]]}`))
			case 2:
				if body.TransactionID != "" || command["find"] != "test_story_progress" {
					t.Fatalf("progress read must be outside transaction: %#v", body)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"_id":"user-1:story-1:explore","user_id":"user-1","story_id":"story-1","hero_id":"libai","mode":"explore","current_node_id":"start","completed_nodes":[],"claimed_reward_nodes":[],"choices":{},"status":"ongoing","revision":{"$numberInt":"1"},"story_version":{"$numberInt":"1"},"started_at":{"$date":{"$numberLong":"1786700000000"}},"updated_at":{"$date":{"$numberLong":"1786700000000"}}}]]}`))
			case 3:
				if body.TransactionID != "advance-tx" || command["update"] != "test_story_progress" {
					t.Fatalf("transaction must contain only progress write: %#v", body)
				}
				_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"},"ok":{"$numberInt":"1"}}]]}`))
			default:
				t.Fatalf("unexpected command: %#v", body)
			}
		default:
			t.Fatalf("unexpected request %s", request.URL.Path)
		}
	}))
	defer server.Close()

	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       server.URL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create database client: %v", err)
	}
	repos := repository.NewRepos(database.NewCollections(client, "test_"))
	progress, err := NewStoryService(repos).Advance(
		context.Background(),
		"user-1",
		"story-1",
		StoryAdvanceRequest{Mode: "explore", Revision: 1},
	)
	if err != nil {
		t.Fatalf("advance story: %v", err)
	}
	if progress.CurrentNodeID != "next" || progress.Revision != 2 {
		t.Fatalf("unexpected progress: %#v", progress)
	}
}

func assertStoryAppErrorCode(t *testing.T, err error, code int) {
	t.Helper()
	applicationError, ok := err.(*errcode.AppError)
	if !ok || applicationError.Code != code {
		t.Fatalf("expected app error %d, got %T %v", code, err, err)
	}
}

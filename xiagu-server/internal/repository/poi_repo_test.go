package repository

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"xiagu-server/internal/database"
)

func TestPOIRepoAcceptsLegacyMapMarkerID(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		var body struct {
			Commands []struct {
				Filter map[string]any `json:"filter"`
			} `json:"commands"`
		}
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		filter := body.Commands[0].Filter
		if filter["poi_code"] != "cd_rongshe_homestay" {
			t.Fatalf("unexpected legacy marker filter: %#v", filter)
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"list":[[{"_id":{"$oid":"507f1f77bcf86cd799439011"},"poi_code":"cd_rongshe_homestay","name":"融舍·村里民宿","status":"active"}]]}`))
	}))
	defer server.Close()

	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env", BaseURL: server.URL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create database client: %v", err)
	}
	repo := NewPOIRepo(database.NewCollections(client, "test_"))

	poi, err := repo.GetByID(context.Background(), "8")
	if err != nil {
		t.Fatalf("resolve legacy marker: %v", err)
	}
	if poi.POICode != "cd_rongshe_homestay" {
		t.Fatalf("unexpected POI: %#v", poi)
	}
}

func TestPOIRepoAcceptsStablePOICode(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		var body struct {
			Commands []struct {
				Filter map[string]any `json:"filter"`
			} `json:"commands"`
		}
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		filter := body.Commands[0].Filter
		if filter["poi_code"] != "cd_wuhouci" {
			t.Fatalf("unexpected stable code filter: %#v", filter)
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"list":[[{"_id":{"$oid":"507f1f77bcf86cd799439011"},"poi_code":"cd_wuhouci","name":"武侯祠","status":"active"}]]}`))
	}))
	defer server.Close()

	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: "test-env", BaseURL: server.URL,
	}, database.StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create database client: %v", err)
	}
	repo := NewPOIRepo(database.NewCollections(client, "test_"))

	if _, err := repo.GetByID(context.Background(), "cd_wuhouci"); err != nil {
		t.Fatalf("resolve stable POI code: %v", err)
	}
}

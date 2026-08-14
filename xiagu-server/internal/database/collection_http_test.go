package database

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type testDocument struct {
	ID   primitive.ObjectID `bson:"_id,omitempty"`
	Name string             `bson:"name"`
}

func TestCollectionFindAndInsertOverHTTP(t *testing.T) {
	requestCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		requestCount++
		var body struct {
			Commands []bson.M `json:"commands"`
		}
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}

		writer.Header().Set("Content-Type", "application/json")
		switch requestCount {
		case 1:
			if body.Commands[0]["find"] != "test_users" {
				t.Fatalf("unexpected collection: %#v", body.Commands[0])
			}
			_, _ = writer.Write([]byte(
				`{"list":[[{"_id":{"$oid":"507f1f77bcf86cd799439011"},"name":"Alice"}]]}`,
			))
		case 2:
			if body.Commands[0]["insert"] != "test_users" {
				t.Fatalf("unexpected insert: %#v", body.Commands[0])
			}
			_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"},"ok":{"$numberInt":"1"}}]]}`))
		default:
			t.Fatalf("unexpected request %d", requestCount)
		}
	}))
	defer server.Close()

	client, err := NewHTTPClient(HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       server.URL,
	}, StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create client: %v", err)
	}
	collection := NewCollections(client, "test_").Collection("users")

	var found testDocument
	if err := collection.FindOne(
		context.Background(),
		bson.M{"name": "Alice"},
		options.FindOne().SetProjection(bson.M{"name": 1}),
	).Decode(&found); err != nil {
		t.Fatalf("find one: %v", err)
	}
	if found.Name != "Alice" {
		t.Fatalf("unexpected document: %#v", found)
	}

	created := testDocument{Name: "Bob"}
	result, err := collection.InsertOne(context.Background(), created)
	if err != nil {
		t.Fatalf("insert one: %v", err)
	}
	if result.InsertedID.(primitive.ObjectID).IsZero() {
		t.Fatal("expected generated object ID")
	}
}

func TestCollectionMapsEmptyFindToDocumentNotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		_ *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"list":[[]]}`))
	}))
	defer server.Close()

	client, err := NewHTTPClient(HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       server.URL,
	}, StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create client: %v", err)
	}

	err = NewCollections(client, "").Collection("users").
		FindOne(context.Background(), bson.M{"missing": true}).Decode(&testDocument{})
	if !errors.Is(err, ErrDocumentNotFound) {
		t.Fatalf("expected document not found, got %v", err)
	}
}

func TestPrepareInsertDocumentPreservesCustomID(t *testing.T) {
	prepared, id, err := prepareInsertDocument(bson.M{
		"_id":  "user-1:item-1",
		"name": "owned item",
	})
	if err != nil {
		t.Fatalf("prepare insert: %v", err)
	}
	if id != "user-1:item-1" || prepared["_id"] != "user-1:item-1" {
		t.Fatalf("custom ID was not preserved: id=%#v document=%#v", id, prepared)
	}
}

func TestCollectionUpdateCountAggregateAndIndexes(t *testing.T) {
	responses := []string{
		`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"},"ok":{"$numberInt":"1"}}]]}`,
		`{"list":[[{"n":{"$numberLong":"3"},"ok":{"$numberInt":"1"}}]]}`,
		`{"list":[[{"_id":"active","total":{"$numberInt":"3"}}]]}`,
		`{"list":[[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}],[{"ok":{"$numberInt":"1"}}]]}`,
	}
	requestIndex := 0
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		if requestIndex >= len(responses) {
			t.Fatalf("unexpected request %d", requestIndex+1)
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(responses[requestIndex]))
		requestIndex++
	}))
	defer server.Close()

	client, err := NewHTTPClient(HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       server.URL,
	}, StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create client: %v", err)
	}
	collections := NewCollections(client, "test_")
	users := collections.Collection("users")

	updateResult, err := users.UpdateOne(
		context.Background(),
		bson.M{"status": "pending"},
		bson.M{"$set": bson.M{"status": "active"}},
	)
	if err != nil || updateResult.ModifiedCount != 1 {
		t.Fatalf("unexpected update result %#v, error %v", updateResult, err)
	}

	count, err := users.CountDocuments(context.Background(), bson.M{"status": "active"})
	if err != nil || count != 3 {
		t.Fatalf("expected count 3, got %d, error %v", count, err)
	}

	cursor, err := users.Aggregate(context.Background(), mongo.Pipeline{
		bson.D{{Key: "$group", Value: bson.M{"_id": "$status", "total": bson.M{"$sum": 1}}}},
	})
	if err != nil {
		t.Fatalf("aggregate: %v", err)
	}
	var stats []struct {
		Total int `bson:"total"`
	}
	if err := cursor.All(context.Background(), &stats); err != nil || len(stats) != 1 || stats[0].Total != 3 {
		t.Fatalf("unexpected aggregate result %#v, error %v", stats, err)
	}

	if err := EnsureCoreIndexes(context.Background(), collections); err != nil {
		t.Fatalf("ensure indexes: %v", err)
	}
	if requestIndex != len(responses) {
		t.Fatalf("expected %d requests, got %d", len(responses), requestIndex)
	}
}

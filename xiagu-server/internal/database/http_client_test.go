package database

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestHTTPClientRunCommands(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		if request.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", request.Method)
		}
		if request.URL.Path != "/v1/database/instances/%28default%29/databases/%28default%29/commands" &&
			request.URL.Path != "/v1/database/instances/(default)/databases/(default)/commands" {
			t.Errorf("unexpected request path %q", request.URL.Path)
		}
		if got := request.Header.Get("Authorization"); got != "Bearer test-api-key" {
			t.Errorf("unexpected authorization header %q", got)
		}

		var body map[string]any
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		commands, ok := body["commands"].([]any)
		if !ok || len(commands) != 1 {
			t.Fatalf("expected one command, got %#v", body["commands"])
		}

		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(
			`{"requestId":"request-1","list":[[{"_id":{"$oid":"507f1f77bcf86cd799439011"},"name":"test"}]]}`,
		))
	}))
	defer server.Close()

	client, err := NewHTTPClient(
		HTTPClientConfig{
			EnvironmentID: "test-env",
			BaseURL:       server.URL,
			Timeout:       time.Second,
		},
		StaticToken("test-api-key"),
	)
	if err != nil {
		t.Fatalf("create client: %v", err)
	}

	results, err := client.RunCommands(
		context.Background(),
		[]any{bson.M{"find": "test_users", "limit": 1}},
		"",
	)
	if err != nil {
		t.Fatalf("run commands: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected one result, got %d", len(results))
	}

	var documents []struct {
		ID   primitive.ObjectID `bson:"_id"`
		Name string             `bson:"name"`
	}
	if err := unmarshalExtendedJSON(results[0], &documents); err != nil {
		t.Fatalf("decode documents: %v", err)
	}
	if documents[0].ID.Hex() != "507f1f77bcf86cd799439011" {
		t.Fatalf("unexpected object ID %s", documents[0].ID.Hex())
	}
}

func TestHTTPClientMapsDatabaseErrorsWithoutLeakingCredential(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		writer.WriteHeader(http.StatusConflict)
		_, _ = writer.Write([]byte(
			`{"code":"DATABASE_DUPLICATE_WRITE","message":"duplicate"}`,
		))
	}))
	defer server.Close()

	const secret = "sensitive-api-key"
	client, err := NewHTTPClient(
		HTTPClientConfig{
			EnvironmentID: "test-env",
			BaseURL:       server.URL,
		},
		StaticToken(secret),
	)
	if err != nil {
		t.Fatalf("create client: %v", err)
	}

	_, err = client.RunCommands(
		context.Background(),
		[]any{bson.M{"insert": "users", "documents": []any{bson.M{}}}},
		"",
	)
	if !errors.Is(err, ErrDuplicateWrite) {
		t.Fatalf("expected duplicate write error, got %v", err)
	}
	if strings.Contains(err.Error(), secret) {
		t.Fatal("database error must not expose API key")
	}
}

func TestNewHTTPClientRejectsInvalidConfiguration(t *testing.T) {
	if _, err := NewHTTPClient(
		HTTPClientConfig{},
		StaticToken("token"),
	); err == nil {
		t.Fatal("expected missing environment ID error")
	}
}

func TestAPIErrorIncludesSafeRequestID(t *testing.T) {
	err := (&APIError{
		StatusCode: http.StatusBadRequest,
		Code:       "DATABASE_REQUEST_FAILED",
		RequestID:  "request-123",
	}).Error()
	if !strings.Contains(err, "DATABASE_REQUEST_FAILED") ||
		!strings.Contains(err, "request-123") {
		t.Fatalf("unexpected API error: %q", err)
	}
}

func TestMapAPIErrorRecognizesCloudBaseE11000(t *testing.T) {
	err := mapAPIError(&APIError{
		Code: "DATABASE_REQUEST_FAILED",
		Message: "write command error: E11000 duplicate key error " +
			"collection: test_checkin_guards",
	})
	if !errors.Is(err, ErrDuplicateWrite) {
		t.Fatalf("expected duplicate write, got %v", err)
	}

	generic := mapAPIError(&APIError{
		Code:    "DATABASE_REQUEST_FAILED",
		Message: "unrelated database failure",
	})
	if errors.Is(generic, ErrDuplicateWrite) {
		t.Fatal("generic database failure must not be classified as duplicate")
	}
}

func TestHTTPClientTransactionCommitsAndPropagatesID(t *testing.T) {
	var actions []string
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		actions = append(actions, request.URL.Path)
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/transactions"):
			writer.WriteHeader(http.StatusCreated)
			_, _ = writer.Write([]byte(`{"transactionId":"tx-123"}`))
		case strings.HasSuffix(request.URL.Path, "/commands"):
			var body map[string]any
			if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
				t.Fatalf("decode command: %v", err)
			}
			if body["transactionId"] != "tx-123" {
				t.Fatalf("unexpected transaction ID: %#v", body)
			}
			_, _ = writer.Write([]byte(`{"list":[[{"n":{"$numberInt":"1"}}]]}`))
		case strings.HasSuffix(request.URL.Path, "/commit"):
			writer.WriteHeader(http.StatusNoContent)
		default:
			t.Fatalf("unexpected transaction request %s", request.URL.Path)
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
	collections := NewCollections(client, "test_")
	err = collections.WithTransaction(context.Background(), func(ctx context.Context) error {
		_, err := collections.Collection("users").UpdateOne(
			ctx,
			bson.M{"openid": "openid-1"},
			bson.M{"$set": bson.M{"status": "active"}},
		)
		return err
	})
	if err != nil {
		t.Fatalf("run transaction: %v", err)
	}
	if len(actions) != 3 || !strings.HasSuffix(actions[2], "/commit") {
		t.Fatalf("unexpected transaction actions %#v", actions)
	}
}

func TestHTTPClientTransactionRollsBackOnOperationError(t *testing.T) {
	rolledBack := false
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		if strings.HasSuffix(request.URL.Path, "/transactions") {
			writer.WriteHeader(http.StatusCreated)
			_, _ = writer.Write([]byte(`{"transactionId":"tx-rollback"}`))
			return
		}
		if strings.HasSuffix(request.URL.Path, "/rollback") {
			rolledBack = true
			writer.WriteHeader(http.StatusNoContent)
			return
		}
		t.Fatalf("unexpected request %s", request.URL.Path)
	}))
	defer server.Close()

	client, err := NewHTTPClient(HTTPClientConfig{
		EnvironmentID: "test-env",
		BaseURL:       server.URL,
	}, StaticToken("test-key"))
	if err != nil {
		t.Fatalf("create client: %v", err)
	}
	expected := errors.New("business rule failed")
	err = client.WithTransaction(context.Background(), func(context.Context) error {
		return expected
	})
	if !errors.Is(err, expected) || !rolledBack {
		t.Fatalf("expected rollback and original error, got %v", err)
	}
}

func TestHTTPClientTransactionRetriesConflictsWithBackoff(t *testing.T) {
	transactions := 0
	commands := 0
	committed := false
	server := httptest.NewServer(http.HandlerFunc(func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(request.URL.Path, "/transactions"):
			transactions++
			writer.WriteHeader(http.StatusCreated)
			_, _ = fmt.Fprintf(writer, `{"transactionId":"tx-%d"}`, transactions)
		case strings.HasSuffix(request.URL.Path, "/commands"):
			commands++
			if commands <= 4 {
				_, _ = writer.Write([]byte(
					`{"code":"DATABASE_TRANSACTION_CONFLICT","message":"hot document"}`,
				))
				return
			}
			_, _ = writer.Write([]byte(
				`{"list":[[{"n":{"$numberInt":"1"},"nModified":{"$numberInt":"1"}}]]}`,
			))
		case strings.HasSuffix(request.URL.Path, "/rollback"):
			writer.WriteHeader(http.StatusNoContent)
		case strings.HasSuffix(request.URL.Path, "/commit"):
			committed = true
			writer.WriteHeader(http.StatusNoContent)
		default:
			t.Fatalf("unexpected request %s", request.URL.Path)
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
	collections := NewCollections(client, "test_")
	err = collections.WithTransaction(context.Background(), func(ctx context.Context) error {
		_, updateErr := collections.Collection("ai_usage").UpdateOne(
			ctx,
			bson.M{"_id": "hot-bucket"},
			bson.M{"$inc": bson.M{"count": 1}},
		)
		return updateErr
	})
	if err != nil {
		t.Fatalf("retry transaction: %v", err)
	}
	if transactions != 5 || commands != 5 || !committed {
		t.Fatalf(
			"unexpected retry result transactions=%d commands=%d committed=%t",
			transactions,
			commands,
			committed,
		)
	}
}

func TestTransactionRetryStopsWhenContextIsCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := waitForTransactionRetry(ctx, 0); !errors.Is(err, context.Canceled) {
		t.Fatalf("expected context cancellation, got %v", err)
	}
}

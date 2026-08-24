package app

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/middleware"
)

func TestHealthEndpoint(t *testing.T) {
	engine := BuildEngine(gin.TestMode)

	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	request.Header.Set(middleware.RequestIDHeader, "health-test-request")
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}

	var response healthResponse
	if err := json.NewDecoder(recorder.Body).Decode(&response); err != nil {
		t.Fatalf("decode health response: %v", err)
	}

	if response.Status != "ok" {
		t.Fatalf("expected health status %q, got %q", "ok", response.Status)
	}

	if response.Service != "xiagu-server" {
		t.Fatalf("expected service %q, got %q", "xiagu-server", response.Service)
	}

	if response.Environment != gin.TestMode {
		t.Fatalf("expected environment %q, got %q", gin.TestMode, response.Environment)
	}

	if response.RequestID != "health-test-request" {
		t.Fatalf(
			"expected request ID %q, got %q",
			"health-test-request",
			response.RequestID,
		)
	}

	if got := recorder.Header().Get(middleware.RequestIDHeader); got != "health-test-request" {
		t.Fatalf("expected response header request ID %q, got %q", "health-test-request", got)
	}

}

package app

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/middleware"
)

func TestReadinessEndpointReturnsReady(t *testing.T) {
	engine := BuildEngine(gin.TestMode)

	checkCalled := false
	RegisterReadiness(engine, func(ctx context.Context) error {
		checkCalled = true
		return nil
	})

	request := httptest.NewRequest(http.MethodGet, "/ready", nil)
	request.Header.Set(
		middleware.RequestIDHeader,
		"ready-test-request",
	)
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusOK,
			recorder.Code,
		)
	}

	if !checkCalled {
		t.Fatal("expected readiness check to be called")
	}

	expectedBody := `{"status":"ready","database":"ok","request_id":"ready-test-request"}`
	if recorder.Body.String() != expectedBody {
		t.Fatalf(
			"expected response body %q, got %q",
			expectedBody,
			recorder.Body.String(),
		)
	}
}

func TestReadinessEndpointReturnsUnavailable(t *testing.T) {
	engine := BuildEngine(gin.TestMode)

	RegisterReadiness(engine, func(ctx context.Context) error {
		return errors.New(
			"sensitive-cloudbase-api-key",
		)
	})

	request := httptest.NewRequest(http.MethodGet, "/ready", nil)
	request.Header.Set(
		middleware.RequestIDHeader,
		"unavailable-test-request",
	)
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusServiceUnavailable,
			recorder.Code,
		)
	}

	expectedBody := `{"status":"unavailable","database":"unavailable","request_id":"unavailable-test-request"}`
	if recorder.Body.String() != expectedBody {
		t.Fatalf(
			"expected response body %q, got %q",
			expectedBody,
			recorder.Body.String(),
		)
	}

	if recorder.Body.String() == "" {
		t.Fatal("expected readiness response body")
	}

	if recorder.Body.String() != expectedBody {
		t.Fatal("readiness response must not expose database errors")
	}
}

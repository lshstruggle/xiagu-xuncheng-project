package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequestIDPreservesIncomingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	engine := gin.New()
	engine.Use(RequestID())
	engine.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, GetRequestID(c))
	})

	request := httptest.NewRequest(http.MethodGet, "/test", nil)
	request.Header.Set(RequestIDHeader, "existing-request-id")
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, request)

	if got := recorder.Header().Get(RequestIDHeader); got != "existing-request-id" {
		t.Fatalf("expected response request ID %q, got %q", "existing-request-id", got)
	}

	if got := recorder.Body.String(); got != "existing-request-id" {
		t.Fatalf("expected context request ID %q, got %q", "existing-request-id", got)
	}
}

func TestRequestIDGeneratesMissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	engine := gin.New()
	engine.Use(RequestID())
	engine.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, GetRequestID(c))
	})

	request := httptest.NewRequest(http.MethodGet, "/test", nil)
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, request)

	responseRequestID := recorder.Header().Get(RequestIDHeader)
	if responseRequestID == "" {
		t.Fatal("expected generated response request ID")
	}

	if got := recorder.Body.String(); got != responseRequestID {
		t.Fatalf("expected context request ID %q, got %q", responseRequestID, got)
	}
}

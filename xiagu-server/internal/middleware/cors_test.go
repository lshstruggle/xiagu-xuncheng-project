package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCORSAllowsConfiguredOrigin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(CORS([]string{"http://localhost:5173"}))
	engine.GET("/test", func(c *gin.Context) { c.Status(http.StatusOK) })

	request := httptest.NewRequest(http.MethodGet, "/test", nil)
	request.Header.Set("Origin", "http://localhost:5173")
	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected allowed request, got %d", recorder.Code)
	}
	if recorder.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Fatal("expected configured origin in response")
	}
}

func TestCORSRejectsUnknownBrowserOriginButAllowsNonBrowserRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(CORS([]string{"https://admin.example.com"}))
	engine.GET("/test", func(c *gin.Context) { c.Status(http.StatusOK) })

	blocked := httptest.NewRequest(http.MethodGet, "/test", nil)
	blocked.Header.Set("Origin", "https://attacker.example.com")
	blockedRecorder := httptest.NewRecorder()
	engine.ServeHTTP(blockedRecorder, blocked)
	if blockedRecorder.Code != http.StatusForbidden {
		t.Fatalf("expected forbidden origin, got %d", blockedRecorder.Code)
	}

	miniProgram := httptest.NewRequest(http.MethodGet, "/test", nil)
	miniProgramRecorder := httptest.NewRecorder()
	engine.ServeHTTP(miniProgramRecorder, miniProgram)
	if miniProgramRecorder.Code != http.StatusOK {
		t.Fatalf("expected request without Origin to pass, got %d", miniProgramRecorder.Code)
	}
}

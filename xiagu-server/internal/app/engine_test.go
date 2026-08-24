package app

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestBuildEngineRecoversFromPanic(t *testing.T) {
	engine := BuildEngine(gin.TestMode)

	engine.GET("/panic", func(c *gin.Context) {
		panic("test panic")
	})

	request := httptest.NewRequest(http.MethodGet, "/panic", nil)
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusInternalServerError,
			recorder.Code,
		)
	}
}

func TestBuildEngineSetsMode(t *testing.T) {
	BuildEngine(gin.TestMode)

	if got := gin.Mode(); got != gin.TestMode {
		t.Fatalf("expected Gin mode %q, got %q", gin.TestMode, got)
	}
}

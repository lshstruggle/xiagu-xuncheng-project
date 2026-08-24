package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/config"
	"xiagu-server/pkg/auth"
)

const middlewareTestSecret = "middleware-secret-with-at-least-32-bytes"

func buildAuthTestEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)

	config.C = &config.Config{
		JWT: config.JWTConfig{
			Secret: middlewareTestSecret,
		},
	}

	engine := gin.New()
	engine.GET("/protected", Auth(userStatusStub{status: "active"}), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	return engine
}

func TestAuthRejectsDebugToken(t *testing.T) {
	engine := buildAuthTestEngine()
	request := httptest.NewRequest(
		http.MethodGet,
		"/protected",
		nil,
	)
	request.Header.Set(
		"Authorization",
		"Bearer test_token_for_debug",
	)

	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusUnauthorized,
			recorder.Code,
		)
	}
}

func TestAuthRejectsMalformedAuthorization(t *testing.T) {
	engine := buildAuthTestEngine()
	request := httptest.NewRequest(
		http.MethodGet,
		"/protected",
		nil,
	)
	request.Header.Set("Authorization", "invalid-token")

	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusUnauthorized,
			recorder.Code,
		)
	}
}

func TestAuthAcceptsValidJWT(t *testing.T) {
	engine := buildAuthTestEngine()

	token, err := auth.GenerateJWT(
		"user-id",
		"openid",
		middlewareTestSecret,
		1,
	)
	if err != nil {
		t.Fatalf("generate JWT: %v", err)
	}

	request := httptest.NewRequest(
		http.MethodGet,
		"/protected",
		nil,
	)
	request.Header.Set("Authorization", "Bearer "+token)

	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusNoContent,
			recorder.Code,
		)
	}
}

type userStatusStub struct {
	status string
	err    error
}

func (s userStatusStub) GetStatusByID(
	ctx context.Context,
	userID string,
) (string, error) {
	return s.status, s.err
}

func TestAuthRejectsBannedUser(t *testing.T) {
	engine := buildAuthTestEngine()

	token, err := auth.GenerateJWT(
		"user-id",
		"openid",
		middlewareTestSecret,
		1,
	)
	if err != nil {
		t.Fatalf("generate JWT: %v", err)
	}

	engine = gin.New()
	engine.GET(
		"/protected",
		Auth(userStatusStub{status: "banned"}),
		func(c *gin.Context) {
			c.Status(http.StatusNoContent)
		},
	)

	request := httptest.NewRequest(
		http.MethodGet,
		"/protected",
		nil,
	)
	request.Header.Set("Authorization", "Bearer "+token)

	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusForbidden,
			recorder.Code,
		)
	}
}

func TestAuthReturnsUnavailableWhenStatusLookupFails(
	t *testing.T,
) {
	engine := buildAuthTestEngine()

	token, err := auth.GenerateJWT(
		"user-id",
		"openid",
		middlewareTestSecret,
		1,
	)
	if err != nil {
		t.Fatalf("generate JWT: %v", err)
	}

	engine = gin.New()
	engine.GET(
		"/protected",
		Auth(userStatusStub{
			err: errors.New("database unavailable"),
		}),
		func(c *gin.Context) {
			c.Status(http.StatusNoContent)
		},
	)

	request := httptest.NewRequest(
		http.MethodGet,
		"/protected",
		nil,
	)
	request.Header.Set("Authorization", "Bearer "+token)

	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf(
			"expected status %d, got %d",
			http.StatusServiceUnavailable,
			recorder.Code,
		)
	}
}

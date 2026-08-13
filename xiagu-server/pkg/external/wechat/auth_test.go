package wechat

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCode2SessionReturnsOpenID(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(func(
			writer http.ResponseWriter,
			request *http.Request,
		) {
			query := request.URL.Query()

			if query.Get("appid") != "app-id" {
				t.Errorf("unexpected appid")
			}
			if query.Get("secret") != "app-secret" {
				t.Errorf("unexpected app secret")
			}
			if query.Get("js_code") != "login-code" {
				t.Errorf("unexpected login code")
			}

			writer.Header().Set(
				"Content-Type",
				"application/json",
			)
			_, _ = writer.Write([]byte(
				`{"openid":"openid-001","session_key":"session-key"}`,
			))
		}),
	)
	defer server.Close()

	auth := NewAuth("app-id", "app-secret")
	auth.endpoint = server.URL
	auth.client = server.Client()

	result, err := auth.Code2Session(
		context.Background(),
		"login-code",
	)
	if err != nil {
		t.Fatalf("code2session: %v", err)
	}

	if result.OpenID != "openid-001" {
		t.Fatalf(
			"expected openid %q, got %q",
			"openid-001",
			result.OpenID,
		)
	}
}

func TestCode2SessionRejectsWeChatError(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(func(
			writer http.ResponseWriter,
			request *http.Request,
		) {
			_, _ = writer.Write([]byte(
				`{"errcode":40029,"errmsg":"invalid code"}`,
			))
		}),
	)
	defer server.Close()

	auth := NewAuth("app-id", "super-secret")
	auth.endpoint = server.URL
	auth.client = server.Client()

	_, err := auth.Code2Session(
		context.Background(),
		"invalid-code",
	)
	if err == nil {
		t.Fatal("expected WeChat API error")
	}

	if strings.Contains(err.Error(), "super-secret") {
		t.Fatal("error must not expose AppSecret")
	}
}

func TestCode2SessionRejectsInvalidJSON(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(func(
			writer http.ResponseWriter,
			request *http.Request,
		) {
			_, _ = writer.Write([]byte(`invalid-json`))
		}),
	)
	defer server.Close()

	auth := NewAuth("app-id", "app-secret")
	auth.endpoint = server.URL
	auth.client = server.Client()

	if _, err := auth.Code2Session(
		context.Background(),
		"login-code",
	); err == nil {
		t.Fatal("expected JSON decoding error")
	}
}

func TestCode2SessionRejectsEmptyOpenID(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(func(
			writer http.ResponseWriter,
			request *http.Request,
		) {
			_, _ = writer.Write([]byte(`{"errcode":0}`))
		}),
	)
	defer server.Close()

	auth := NewAuth("app-id", "app-secret")
	auth.endpoint = server.URL
	auth.client = server.Client()

	if _, err := auth.Code2Session(
		context.Background(),
		"login-code",
	); err == nil {
		t.Fatal("expected empty openid error")
	}
}

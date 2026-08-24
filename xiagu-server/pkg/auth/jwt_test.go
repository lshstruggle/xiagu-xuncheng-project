package auth

import (
	"testing"
)

const testJWTSecret = "test-secret-with-at-least-32-bytes"

func TestGenerateAndParseJWT(t *testing.T) {
	token, err := GenerateJWT(
		"user-id",
		"openid",
		testJWTSecret,
		1,
	)
	if err != nil {
		t.Fatalf("generate JWT: %v", err)
	}

	claims, err := ParseJWT(token, testJWTSecret)
	if err != nil {
		t.Fatalf("parse JWT: %v", err)
	}

	if claims.UserID != "user-id" {
		t.Fatalf("expected user ID %q, got %q", "user-id", claims.UserID)
	}

	if claims.OpenID != "openid" {
		t.Fatalf("expected openid %q, got %q", "openid", claims.OpenID)
	}
}

func TestParseJWTRejectsExpiredToken(t *testing.T) {
	token, err := GenerateJWT(
		"user-id",
		"openid",
		testJWTSecret,
		-1,
	)
	if err != nil {
		t.Fatalf("generate expired JWT: %v", err)
	}

	if _, err := ParseJWT(token, testJWTSecret); err == nil {
		t.Fatal("expected expired JWT to be rejected")
	}
}

func TestParseJWTRejectsWrongSecret(t *testing.T) {
	token, err := GenerateJWT(
		"user-id",
		"openid",
		testJWTSecret,
		1,
	)
	if err != nil {
		t.Fatalf("generate JWT: %v", err)
	}

	if _, err := ParseJWT(
		token,
		"different-secret-with-at-least-32-bytes",
	); err == nil {
		t.Fatal("expected JWT signed with another secret to be rejected")
	}
}

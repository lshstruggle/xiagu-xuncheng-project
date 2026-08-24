package util

import "testing"

const adminTestSecret = "admin-test-secret-with-at-least-32-bytes"

func TestGenerateAndParseAdminToken(t *testing.T) {
	token, err := GenerateAdminToken(
		"admin-id",
		"admin",
		"super_admin",
		adminTestSecret,
	)
	if err != nil {
		t.Fatalf("generate admin token: %v", err)
	}

	claims, err := ParseAdminToken(
		token,
		adminTestSecret,
	)
	if err != nil {
		t.Fatalf("parse admin token: %v", err)
	}

	if claims.AdminID != "admin-id" {
		t.Fatalf(
			"expected admin ID %q, got %q",
			"admin-id",
			claims.AdminID,
		)
	}

	if claims.Role != "super_admin" {
		t.Fatalf(
			"expected role %q, got %q",
			"super_admin",
			claims.Role,
		)
	}
}

func TestParseAdminTokenRejectsWrongSecret(t *testing.T) {
	token, err := GenerateAdminToken(
		"admin-id",
		"admin",
		"super_admin",
		adminTestSecret,
	)
	if err != nil {
		t.Fatalf("generate admin token: %v", err)
	}

	_, err = ParseAdminToken(
		token,
		"different-admin-secret-at-least-32-bytes",
	)
	if err == nil {
		t.Fatal("expected wrong secret to be rejected")
	}
}

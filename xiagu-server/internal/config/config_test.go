package config

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"
)

func TestLoadOverridesFileWithCloudEnvironment(t *testing.T) {
	configPath := filepath.Join(t.TempDir(), "config.yaml")

	configData := []byte(`
server:
  port: 8080
  mode: debug

cloudbase_database:
  environment_id: local-environment
  api_key: local-api-key
`)

	if err := os.WriteFile(configPath, configData, 0o600); err != nil {
		t.Fatalf("write temporary config: %v", err)
	}

	t.Setenv("SERVER_MODE", "release")
	t.Setenv("CLOUDBASE_ENV_ID", "cloud-environment")
	t.Setenv("CLOUDBASE_API_KEY", "cloud-api-key")

	if err := Load(configPath); err != nil {
		t.Fatalf("load config: %v", err)
	}

	if C.Server.Mode != "release" {
		t.Fatalf("expected server mode %q, got %q", "release", C.Server.Mode)
	}

	if C.CloudBaseDatabase.EnvironmentID != "cloud-environment" {
		t.Fatalf(
			"expected CloudBase environment ID %q, got %q",
			"cloud-environment",
			C.CloudBaseDatabase.EnvironmentID,
		)
	}
	if C.CloudBaseDatabase.APIKey != "cloud-api-key" {
		t.Fatal("expected CloudBase API key from environment")
	}
}

func TestLoadFromCloudEnvironmentWithoutConfigFile(t *testing.T) {
	t.Setenv("SERVER_MODE", "release")
	t.Setenv("CLOUDBASE_ENV_ID", "cloud-environment")
	t.Setenv("CLOUDBASE_API_KEY", "cloud-api-key")

	if err := Load(""); err != nil {
		t.Fatalf("load environment-only config: %v", err)
	}

	if C.Server.Mode != "release" {
		t.Fatalf("expected server mode %q, got %q", "release", C.Server.Mode)
	}

	if C.CloudBaseDatabase.EnvironmentID != "cloud-environment" {
		t.Fatalf("unexpected environment ID %q", C.CloudBaseDatabase.EnvironmentID)
	}
}

func TestLoadCloudEnvironmentAndServerlessDefaults(t *testing.T) {
	t.Setenv("SERVER_MODE", "release")
	t.Setenv("CLOUDBASE_ENV_ID", "cloud-environment")
	t.Setenv("CLOUDBASE_API_KEY", "cloud-api-key")
	t.Setenv("WECHAT_APP_ID", "wechat-app-id")
	t.Setenv("WECHAT_APP_SECRET", "wechat-app-secret")
	t.Setenv("JWT_SECRET", "test-jwt-secret")
	t.Setenv("YUANQI_BASE_URL", "https://yuanqi.example/v1/chat")
	t.Setenv("YUANQI_TOKEN", "yuanqi-token")
	t.Setenv("YUANQI_ASSISTANT_ID", "assistant-id")

	if err := Load(""); err != nil {
		t.Fatalf("load CloudBase config: %v", err)
	}

	if C.WeChat.AppID != "wechat-app-id" {
		t.Fatalf("expected WeChat AppID %q, got %q", "wechat-app-id", C.WeChat.AppID)
	}

	if C.WeChat.AppSecret != "wechat-app-secret" {
		t.Fatalf(
			"expected WeChat AppSecret %q, got %q",
			"wechat-app-secret",
			C.WeChat.AppSecret,
		)
	}

	if C.JWT.Secret != "test-jwt-secret" {
		t.Fatalf("expected JWT secret from environment")
	}

	if C.Yuanqi.AssistantID != "assistant-id" {
		t.Fatalf(
			"expected Yuanqi assistant ID %q, got %q",
			"assistant-id",
			C.Yuanqi.AssistantID,
		)
	}

	if C.Yuanqi.BaseURL != "https://yuanqi.example/v1/chat" {
		t.Fatalf("expected Yuanqi base URL %q, got %q", "https://yuanqi.example/v1/chat", C.Yuanqi.BaseURL)
	}
	if C.Yuanqi.Token != "yuanqi-token" {
		t.Fatal("expected Yuanqi token from environment")
	}

	if C.Server.Port != 9000 {
		t.Fatalf("expected default server port %d, got %d", 9000, C.Server.Port)
	}

	if C.CloudBaseDatabase.Timeout != 10*time.Second {
		t.Fatalf(
			"expected CloudBase database timeout %s, got %s",
			10*time.Second,
			C.CloudBaseDatabase.Timeout,
		)
	}
	if C.CloudBaseDatabase.Instance != "(default)" || C.CloudBaseDatabase.Database != "(default)" {
		t.Fatal("expected default CloudBase instance and database")
	}

	if C.JWT.ExpireHours != 168 {
		t.Fatalf(
			"expected default JWT expiration %d, got %d",
			168,
			C.JWT.ExpireHours,
		)
	}

	if C.Yuanqi.Timeout != 15*time.Second {
		t.Fatalf(
			"expected Yuanqi timeout %s, got %s",
			15*time.Second,
			C.Yuanqi.Timeout,
		)
	}

	if C.Yuanqi.MaxRetries != 2 {
		t.Fatalf(
			"expected Yuanqi max retries %d, got %d",
			2,
			C.Yuanqi.MaxRetries,
		)
	}
}

func TestLoadCloudSpecificFields(t *testing.T) {
	t.Setenv("CLOUDBASE_COLLECTION_PREFIX", "test_")
	t.Setenv(
		"ALLOWED_ADMIN_ORIGINS",
		"https://admin.example.com,https://staging-admin.example.com",
	)

	if err := Load(""); err != nil {
		t.Fatalf("load CloudBase-specific config: %v", err)
	}

	if C.CloudBaseDatabase.CollectionPrefix != "test_" {
		t.Fatalf(
			"expected collection prefix %q, got %q",
			"test_",
			C.CloudBaseDatabase.CollectionPrefix,
		)
	}

	expectedOrigins := []string{
		"https://admin.example.com",
		"https://staging-admin.example.com",
	}

	if !reflect.DeepEqual(C.Server.AllowedAdminOrigins, expectedOrigins) {
		t.Fatalf(
			"expected allowed admin origins %#v, got %#v",
			expectedOrigins,
			C.Server.AllowedAdminOrigins,
		)
	}
}

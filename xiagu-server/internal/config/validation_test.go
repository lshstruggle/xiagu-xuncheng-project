package config

import (
	"strings"
	"testing"
	"time"
)

func validConfigForValidation() *Config {
	return &Config{
		Server: ServerConfig{
			Port:                9000,
			Mode:                "release",
			AllowedAdminOrigins: []string{"https://admin.example.com"},
		},
		CloudBaseDatabase: CloudBaseDatabaseConfig{
			EnvironmentID: "cloud-environment",
			APIKey:        "cloud-api-key",
			Instance:      "(default)",
			Database:      "(default)",
			Timeout:       10 * time.Second,
		},
		WeChat: WeChatConfig{
			AppID:     "wechat-app-id",
			AppSecret: "wechat-app-secret",
		},
		JWT: JWTConfig{
			Secret:      strings.Repeat("x", 32),
			ExpireHours: 168,
		},
		Yuanqi: YuanqiConfig{
			BaseURL:     "https://yuanqi.example/v1/chat",
			AssistantID: "assistant-id",
			Timeout:     15 * time.Second,
			MaxRetries:  2,
		},
	}
}

func TestValidateRejectsMissingRequiredValues(t *testing.T) {
	tests := []struct {
		name       string
		expected   string
		clearValue func(*Config)
	}{
		{
			name:     "CloudBase environment ID",
			expected: "cloudbase_database.environment_id",
			clearValue: func(cfg *Config) {
				cfg.CloudBaseDatabase.EnvironmentID = ""
			},
		},
		{
			name:     "CloudBase API key",
			expected: "cloudbase_database.api_key",
			clearValue: func(cfg *Config) {
				cfg.CloudBaseDatabase.APIKey = ""
			},
		},
		{
			name:     "WeChat AppID",
			expected: "wechat.app_id",
			clearValue: func(cfg *Config) {
				cfg.WeChat.AppID = ""
			},
		},
		{
			name:     "WeChat AppSecret",
			expected: "wechat.app_secret",
			clearValue: func(cfg *Config) {
				cfg.WeChat.AppSecret = ""
			},
		},
		{
			name:     "JWT secret",
			expected: "jwt.secret",
			clearValue: func(cfg *Config) {
				cfg.JWT.Secret = ""
			},
		},
		{
			name:     "release admin origins",
			expected: "server.allowed_admin_origins",
			clearValue: func(cfg *Config) {
				cfg.Server.AllowedAdminOrigins = nil
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cfg := validConfigForValidation()
			test.clearValue(cfg)

			err := cfg.Validate()
			if err == nil {
				t.Fatalf("expected validation error containing %q", test.expected)
			}

			if !strings.Contains(err.Error(), test.expected) {
				t.Fatalf(
					"expected error containing %q, got %q",
					test.expected,
					err.Error(),
				)
			}
		})
	}
}

func TestValidateRejectsInvalidValues(t *testing.T) {
	tests := []struct {
		name        string
		expected    string
		changeValue func(*Config)
	}{
		{
			name:     "invalid server mode",
			expected: "server.mode",
			changeValue: func(cfg *Config) {
				cfg.Server.Mode = "production"
			},
		},
		{
			name:     "invalid server port",
			expected: "server.port",
			changeValue: func(cfg *Config) {
				cfg.Server.Port = 0
			},
		},
		{
			name:     "invalid CloudBase database timeout",
			expected: "cloudbase_database.timeout",
			changeValue: func(cfg *Config) {
				cfg.CloudBaseDatabase.Timeout = 0
			},
		},
		{
			name:     "short JWT secret",
			expected: "jwt.secret",
			changeValue: func(cfg *Config) {
				cfg.JWT.Secret = "too-short"
			},
		},
		{
			name:     "invalid JWT expiration",
			expected: "jwt.expire_hours",
			changeValue: func(cfg *Config) {
				cfg.JWT.ExpireHours = 0
			},
		},
		{
			name:     "invalid Yuanqi timeout",
			expected: "yuanqi.timeout",
			changeValue: func(cfg *Config) {
				cfg.Yuanqi.Timeout = 0
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cfg := validConfigForValidation()
			test.changeValue(cfg)

			err := cfg.Validate()
			if err == nil {
				t.Fatalf("expected validation error containing %q", test.expected)
			}

			if !strings.Contains(err.Error(), test.expected) {
				t.Fatalf(
					"expected error containing %q, got %q",
					test.expected,
					err.Error(),
				)
			}
		})
	}
}

func TestValidateAcceptsValidConfig(t *testing.T) {
	cfg := validConfigForValidation()

	if err := cfg.Validate(); err != nil {
		t.Fatalf("expected valid config, got %v", err)
	}
}

func TestValidateAcceptsMissingOptionalYuanqiCredentials(t *testing.T) {
	cfg := validConfigForValidation()
	cfg.Yuanqi.BaseURL = ""
	cfg.Yuanqi.AssistantID = ""

	if err := cfg.Validate(); err != nil {
		t.Fatalf("expected Yuanqi credentials to be optional, got %v", err)
	}
}

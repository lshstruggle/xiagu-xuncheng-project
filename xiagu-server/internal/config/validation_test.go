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
		MongoDB: MongoConfig{
			URI:            "mongodb://cloudbase.example:27017",
			Database:       "cloudbase_database",
			MaxPoolSize:    10,
			MinPoolSize:    0,
			ConnectTimeout: 10 * time.Second,
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
			Token:       "yuanqi-token",
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
			name:     "MongoDB URI",
			expected: "mongodb.uri",
			clearValue: func(cfg *Config) {
				cfg.MongoDB.URI = ""
			},
		},
		{
			name:     "MongoDB database",
			expected: "mongodb.database",
			clearValue: func(cfg *Config) {
				cfg.MongoDB.Database = ""
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
			name:     "Yuanqi base URL",
			expected: "yuanqi.base_url",
			clearValue: func(cfg *Config) {
				cfg.Yuanqi.BaseURL = ""
			},
		},
		{
			name:     "Yuanqi token",
			expected: "yuanqi.token",
			clearValue: func(cfg *Config) {
				cfg.Yuanqi.Token = ""
			},
		},
		{
			name:     "Yuanqi assistant ID",
			expected: "yuanqi.assistant_id",
			clearValue: func(cfg *Config) {
				cfg.Yuanqi.AssistantID = ""
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
			name:     "zero MongoDB max pool",
			expected: "mongodb.max_pool_size",
			changeValue: func(cfg *Config) {
				cfg.MongoDB.MaxPoolSize = 0
			},
		},
		{
			name:     "MongoDB min pool exceeds max",
			expected: "mongodb.min_pool_size",
			changeValue: func(cfg *Config) {
				cfg.MongoDB.MinPoolSize = cfg.MongoDB.MaxPoolSize + 1
			},
		},
		{
			name:     "invalid MongoDB timeout",
			expected: "mongodb.connect_timeout",
			changeValue: func(cfg *Config) {
				cfg.MongoDB.ConnectTimeout = 0
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

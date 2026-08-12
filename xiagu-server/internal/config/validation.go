package config

import (
	"errors"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
)

// Validation 检查启动所需的关键配置，但不会输出敏感配置值。
func (c *Config) Validate() error {
	if c == nil {
		return errors.New("config is required")
	}

	requiredValues := []struct {
		name  string
		value string
	}{
		{name: "mongodb.uri", value: c.MongoDB.URI},
		{name: "mongodb.database", value: c.MongoDB.Database},
		{name: "wechat.app_id", value: c.WeChat.AppID},
		{name: "wechat.app_secret", value: c.WeChat.AppSecret},
		{name: "jwt.secret", value: c.JWT.Secret},
		{name: "yuanqi.base_url", value: c.Yuanqi.BaseURL},
		{name: "yuanqi.token", value: c.Yuanqi.Token},
		{name: "yuanqi.assistant_id", value: c.Yuanqi.AssistantID},
	}

	for _, required := range requiredValues {
		if strings.TrimSpace(required.value) == "" {
			return fmt.Errorf("%s is required", required.name)
		}
	}

	switch c.Server.Mode {
	case gin.DebugMode, gin.ReleaseMode, gin.TestMode:
		// 有效模式
	default:
		return fmt.Errorf(
			"server.mode must be one of %q, %q, %q",
			gin.DebugMode,
			gin.ReleaseMode,
			gin.TestMode,
		)
	}

	if c.Server.Port < 1 || c.Server.Port > 65535 {
		return errors.New("server.port must be between 1 and 65535")
	}

	if c.MongoDB.MaxPoolSize == 0 {
		return errors.New("mongodb.max_pool_size must be greater than 0")
	}

	if c.MongoDB.MinPoolSize > c.MongoDB.MaxPoolSize {
		return errors.New(
			"mongodb.min_pool_size must not exceed mongodb.max_pool_size",
		)
	}

	if c.MongoDB.ConnectTimeout <= 0 {
		return errors.New("mongodb.connect_timeout must be greater than 0")
	}

	if len(c.JWT.Secret) < 32 {
		return errors.New("jwt.secret must be at least 32 bytes")
	}

	if c.JWT.ExpireHours <= 0 {
		return errors.New("jwt.expire_hours must be greater than 0")
	}

	if c.Yuanqi.Timeout <= 0 {
		return errors.New("yuanqi.timeout must be greater than 0")
	}

	if c.Server.Mode == gin.ReleaseMode && !containsNonEmptyValue(c.Server.AllowedAdminOrigins) {
		return errors.New("server.allowed_admin_origins is required in release mode")
	}

	return nil
}

func containsNonEmptyValue(values []string) bool {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return true
		}
	}

	return false
}

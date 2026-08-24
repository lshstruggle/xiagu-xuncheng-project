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
		{name: "cloudbase_database.environment_id", value: c.CloudBaseDatabase.EnvironmentID},
		{name: "cloudbase_database.api_key", value: c.CloudBaseDatabase.APIKey},
		{name: "cloudbase_database.instance", value: c.CloudBaseDatabase.Instance},
		{name: "cloudbase_database.database", value: c.CloudBaseDatabase.Database},
		{name: "wechat.app_id", value: c.WeChat.AppID},
		{name: "wechat.app_secret", value: c.WeChat.AppSecret},
		{name: "jwt.secret", value: c.JWT.Secret},
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

	if c.CloudBaseDatabase.Timeout <= 0 {
		return errors.New("cloudbase_database.timeout must be greater than 0")
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
	if c.TTS.Enabled {
		if strings.TrimSpace(c.TTS.BaseURL) == "" || strings.TrimSpace(c.TTS.SharedSecret) == "" {
			return errors.New("tts.base_url and tts.shared_secret are required when tts.enabled")
		}
		if c.TTS.Timeout <= 0 {
			return errors.New("tts.timeout must be greater than 0")
		}
		if c.TTS.MaxSegmentRunes < 1 || c.TTS.MaxSegmentRunes > 35 {
			return errors.New("tts.max_segment_runes must be between 1 and 35")
		}
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

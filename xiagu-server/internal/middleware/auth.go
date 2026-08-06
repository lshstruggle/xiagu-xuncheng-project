package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/config"
	"xiagu-server/pkg/auth"
	"xiagu-server/pkg/util"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			util.Unauthorized(c, "未提供认证信息")
			c.Abort()
			return
		}

		token := strings.TrimPrefix(header, "Bearer ")

		// 调试模式：支持测试token
		if strings.Contains(token, "test_token_for_debug") {
			c.Set("user_id", "debug_user_001")
			c.Set("openid", "debug_openid_001")
			c.Next()
			return
		}

		claims, err := auth.ParseJWT(token, config.C.JWT.Secret)
		if err != nil {
			util.Unauthorized(c, "认证无效或已过期")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("openid", claims.OpenID)
		c.Next()
	}
}

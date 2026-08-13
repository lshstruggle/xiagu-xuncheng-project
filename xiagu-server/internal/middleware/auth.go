package middleware

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/config"
	"xiagu-server/pkg/auth"
	"xiagu-server/pkg/util"
)

type UserStatusReader interface {
	GetStatusByID(ctx context.Context, userID string) (string, error)
}

func Auth(users UserStatusReader) gin.HandlerFunc {
	return func(c *gin.Context) {
		parts := strings.Fields(c.GetHeader("Authorization"))
		if len(parts) != 2 ||
			!strings.EqualFold(parts[0], "Bearer") ||
			parts[1] == "" {
			util.Unauthorized(c, "未提供有效认证信息")
			c.Abort()
			return
		}

		claims, err := auth.ParseJWT(
			parts[1],
			config.C.JWT.Secret,
		)
		if err != nil ||
			claims.UserID == "" ||
			claims.OpenID == "" {
			util.Unauthorized(c, "认证无效或已过期")
			c.Abort()
			return
		}

		status, err := users.GetStatusByID(c.Request.Context(), claims.UserID)
		if err != nil {
			util.ResponseError(c, 503, "认证服务暂不可用")
			c.Abort()
			return
		}

		if status == "banned" {
			util.Forbidden(c, "用户已被封禁")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("openid", claims.OpenID)
		c.Next()
	}
}

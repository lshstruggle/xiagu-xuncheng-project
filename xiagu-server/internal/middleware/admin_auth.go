package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"xiagu-server/pkg/util"
)

// AdminAuth 管理员认证中间件
func AdminAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			util.ResponseError(c, http.StatusUnauthorized, "缺少认证信息")
			c.Abort()
			return
		}

		// Bearer token
		parts := strings.Fields(c.GetHeader("Authorization"))
		if len(parts) != 2 ||
			!strings.EqualFold(parts[0], "Bearer") ||
			parts[1] == "" {
			util.ResponseError(
				c,
				http.StatusUnauthorized,
				"缺少有效认证信息",
			)
			c.Abort()
			return
		}

		claims, err := util.ParseAdminToken(parts[1], secret)
		if err != nil {
			util.ResponseError(c, http.StatusUnauthorized, "Token无效或已过期")
			c.Abort()
			return
		}

		// 将管理员信息存入上下文
		c.Set("admin_id", claims.AdminID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

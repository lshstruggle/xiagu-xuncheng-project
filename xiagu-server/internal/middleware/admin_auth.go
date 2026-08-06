package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"xiagu-server/pkg/util"
)

// AdminAuth 管理员认证中间件
func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			util.ResponseError(c, http.StatusUnauthorized, "缺少认证信息")
			c.Abort()
			return
		}

		// Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			util.ResponseError(c, http.StatusUnauthorized, "认证格式错误")
			c.Abort()
			return
		}

		claims, err := util.ParseAdminToken(parts[1])
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

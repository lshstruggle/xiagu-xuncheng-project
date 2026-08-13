package app

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/middleware"
)

type ReadinessCheck func(context.Context) error

type readinessResponse struct {
	Status    string `json:"status"`
	Database  string `json:"database"`
	RequestID string `json:"request_id"`
}

// RegisterReadiness 注册依赖就绪探测。
// 检查失败时只返回标准状态，不向客户端暴露数据库错误细节。
func RegisterReadiness(
	engine *gin.Engine,
	check ReadinessCheck,
) {
	engine.GET("/ready", func(c *gin.Context) {
		response := readinessResponse{
			Status:    "ready",
			Database:  "ok",
			RequestID: middleware.GetRequestID(c),
		}

		if err := check(c.Request.Context()); err != nil {
			response.Status = "unavailable"
			response.Database = "unavailable"

			c.JSON(http.StatusServiceUnavailable, response)
			return
		}

		c.JSON(http.StatusOK, response)
	})
}

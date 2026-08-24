package app

import (
	"github.com/gin-gonic/gin"

	"xiagu-server/internal/middleware"
)

// BuildEngine 创建包含通用中间件的 Gin Engine。
// 它不连接数据库、不注册业务路由，也不监听网络端口。
func BuildEngine(mode string, allowedOrigins ...string) *gin.Engine {
	gin.SetMode(mode)

	engine := gin.New()
	engine.Use(
		gin.Recovery(),
		middleware.RequestID(),
		middleware.CORS(allowedOrigins),
	)

	registerHealth(engine, mode)

	return engine
}

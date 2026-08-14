package app

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/middleware"
)

// BuildVersion is injected by deploy/cloudbase/build.sh. The development
// default keeps local builds simple while allowing operators to verify which
// artifact a CloudBase instance is actually serving.
var BuildVersion = "dev"

type healthResponse struct {
	Status       string `json:"status"`
	Service      string `json:"service"`
	Environment  string `json:"environment"`
	BuildVersion string `json:"build_version"`
	RequestID    string `json:"request_id"`
}

func registerHealth(engine *gin.Engine, environment string) {
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, healthResponse{
			Status:       "ok",
			Service:      "xiagu-server",
			Environment:  environment,
			BuildVersion: BuildVersion,
			RequestID:    middleware.GetRequestID(c),
		})
	})
}

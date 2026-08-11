package app

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/middleware"
)

type healthResponse struct {
	Status      string `json:"status"`
	Service     string `json:"service"`
	Environment string `json:"environment"`
	RequestID   string `json:"request_id"`
}

func registerHealth(engine *gin.Engine, environment string) {
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, healthResponse{
			Status:      "ok",
			Service:     "xiagu-server",
			Environment: environment,
			RequestID:   middleware.GetRequestID(c),
		})
	})
}

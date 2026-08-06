package handler

import (
	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type TTSHandler struct {
	svcs *service.Services
}

func (h *TTSHandler) Synthesize(c *gin.Context) {
	var req struct {
		Text string `json:"text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "text必填")
		return
	}

	audioData, err := h.svcs.TTS.Synthesize(c.Request.Context(), req.Text)
	if err != nil {
		util.ServerError(c, "语音合成失败")
		return
	}

	c.Data(200, "audio/wav", audioData)
}

func (h *TTSHandler) HealthCheck(c *gin.Context) {
	err := h.svcs.TTS.HealthCheck(c.Request.Context())
	if err != nil {
		c.JSON(503, gin.H{"status": "unavailable", "error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "ok"})
}

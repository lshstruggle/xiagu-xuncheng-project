package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"xiagu-server/internal/service"
	"xiagu-server/pkg/logger"
	"xiagu-server/pkg/util"
)

// Segment proxies a ticket-bound sentence to the private TTS gateway.
func (h *TTSHandler) Segment(c *gin.Context) {
	var req service.TTSSegmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "参数错误")
		return
	}
	result, err := h.svcs.TTS.SynthesizeSegment(c.Request.Context(), c.GetString("user_id"), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidTTSTicket) {
			util.Forbidden(c, "语音票据无效或已过期")
			return
		}
		// TTS faults must not reveal gateway details or become a chat failure.
		logger.Log.Warnf("[TTS] 分句代理失败: %v", err)
		util.ResponseError(c, http.StatusServiceUnavailable, "语音服务暂时不可用")
		return
	}
	c.Header("Content-Type", "audio/wav")
	if result.Cache != "" {
		c.Header("X-TTS-Cache", result.Cache)
	}
	c.Data(http.StatusOK, "audio/wav", result.Audio)
}

type TTSHandler struct{ svcs *service.Services }

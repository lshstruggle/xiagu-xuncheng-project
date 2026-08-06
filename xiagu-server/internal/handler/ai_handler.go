package handler

import (
	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type AIHandler struct {
	svcs *service.Services
}

func (h *AIHandler) Chat(c *gin.Context) {
	userID := c.GetString("user_id")

	var req service.AIChatReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "参数错误")
		return
	}

	if req.Message == "" || req.HeroID == "" {
		util.BadRequest(c, "message和hero_id必填")
		return
	}

	if len([]rune(req.Message)) > 500 {
		util.BadRequest(c, "消息过长，最多500字")
		return
	}

	result, err := h.svcs.AI.Chat(c.Request.Context(), userID, &req)
	if err != nil {
		util.ServerError(c, err.Error())
		return
	}
	util.OK(c, result)
}

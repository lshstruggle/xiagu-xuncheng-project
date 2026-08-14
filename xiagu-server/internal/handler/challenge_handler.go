package handler

import (
	"github.com/gin-gonic/gin"

	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type ChallengeHandler struct{ service *service.ChallengeService }

func NewChallengeHandler(challengeService *service.ChallengeService) *ChallengeHandler {
	return &ChallengeHandler{service: challengeService}
}

func (h *ChallengeHandler) ListProgress(c *gin.Context) {
	progress, err := h.service.ListProgress(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		util.ServerError(c, "读取挑战进度失败")
		return
	}
	util.OK(c, progress)
}

func (h *ChallengeHandler) CompleteBoss(c *gin.Context) {
	var request service.BossCompletionRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		util.BadRequest(c, "挑战参数无效")
		return
	}
	response, err := h.service.CompleteBoss(
		c.Request.Context(),
		c.GetString("user_id"),
		request,
	)
	if err != nil {
		if util.AppError(c, err) {
			return
		}
		util.ServerError(c, "提交挑战结果失败")
		return
	}
	util.OK(c, response)
}

package handler

import (
	"github.com/gin-gonic/gin"

	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type AchievementHandler struct{ service *service.AchievementService }

func NewAchievementHandler(achievementService *service.AchievementService) *AchievementHandler {
	return &AchievementHandler{service: achievementService}
}

func (h *AchievementHandler) Get(c *gin.Context) {
	result, err := h.service.Get(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		util.ServerError(c, "读取成就进度失败")
		return
	}
	util.OK(c, result)
}

package handler

import (
	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type CheckinHandler struct {
	svcs *service.Services
}

func (h *CheckinHandler) DoCheckin(c *gin.Context) {
	userID := c.GetString("user_id")

	var req service.CheckinReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "参数错误")
		return
	}
	if req.POIID == "" || req.HeroID == "" {
		util.BadRequest(c, "poi_id和hero_id必填")
		return
	}

	result, err := h.svcs.Checkin.DoCheckin(c.Request.Context(), userID, &req)
	if err != nil {
		if util.AppError(c, err) {
			return
		}
		util.ServerError(c, err.Error())
		return
	}
	util.OK(c, result)
}

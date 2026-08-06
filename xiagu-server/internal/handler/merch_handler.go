package handler

import (
	"github.com/gin-gonic/gin"
	"xiagu-server/internal/model"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type MerchHandler struct {
	svc *service.MerchService
}

func NewMerchHandler(svc *service.MerchService) *MerchHandler {
	return &MerchHandler{svc: svc}
}

// SubmitOrder 提交实体周边订单
func (h *MerchHandler) SubmitOrder(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		HeroID  string `json:"hero_id" binding:"required"`
		Name    string `json:"name" binding:"required"`
		Phone   string `json:"phone" binding:"required"`
		Address string `json:"address" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "请填写完整的收货信息")
		return
	}

	order := &model.MerchOrder{
		HeroID:  req.HeroID,
		Name:    req.Name,
		Phone:   req.Phone,
		Address: req.Address,
	}

	if err := h.svc.SubmitOrder(c.Request.Context(), userID, order); err != nil {
		util.ServerError(c, err.Error())
		return
	}

	util.OK(c, gin.H{
		"success":  true,
		"order_id": "mock_order_" + req.HeroID,
	})
}

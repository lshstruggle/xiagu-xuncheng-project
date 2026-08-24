package handler

import (
	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type ShopHandler struct {
	svc *service.ShopService
}

func NewShopHandler(svc *service.ShopService) *ShopHandler {
	return &ShopHandler{svc: svc}
}

// GetItems 获取商品列表
func (h *ShopHandler) GetItems(c *gin.Context) {
	items, err := h.svc.GetItems(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		util.ServerError(c, "读取商城商品失败")
		return
	}
	util.OK(c, items)
}

// ExchangeItem 兑换商品
func (h *ShopHandler) ExchangeItem(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		ItemID string `json:"item_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "item_id必填")
		return
	}

	heroFrag, skinFrag, err := h.svc.ExchangeItem(c.Request.Context(), userID, req.ItemID)
	if err != nil {
		if util.AppError(c, err) {
			return
		}
		util.ServerError(c, "兑换商品失败")
		return
	}

	util.OK(c, gin.H{
		"success":        true,
		"hero_fragments": heroFrag,
		"skin_fragments": skinFrag,
	})
}

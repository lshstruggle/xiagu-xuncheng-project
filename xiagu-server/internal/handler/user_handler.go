package handler

import (
	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type UserHandler struct {
	svcs *service.Services
}

func (h *UserHandler) Login(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "code必填")
		return
	}

	// 调试模式：特定code直接返回测试token
	if req.Code == "debug_login_code" {
		util.OK(c, gin.H{
			"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjI3Yjc0YjY1ZTU4ZDYzNDcwMDAwMDAxIiwib3BlbmlkIjoiZGVidWdfb3BlbmlkXzAwMSIsImV4cCI6MTg4ODg4ODg4OH0.test",
			"user": gin.H{
				"id":       "627b74b65e58d63470000001",
				"nickname": "测试召唤师",
				"avatar_url": "https://game.gtimg.cn/images/yxzj/img201606/heroimg/131/131.jpg",
				"selected_hero": "li_bai",
				"total_checkins": 0,
				"badges": []string{},
				"explored_cities": []string{"CD"},
			},
		})
		return
	}

	result, err := h.svcs.User.Login(c.Request.Context(), req.Code)
	if err != nil {
		util.ServerError(c, err.Error())
		return
	}
	util.OK(c, result)
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	user, err := h.svcs.User.GetProfile(c.Request.Context(), userID)
	if err != nil {
		util.NotFound(c, "用户不存在")
		return
	}
	util.OK(c, user)
}

func (h *UserHandler) GetAssets(c *gin.Context) {
	userID := c.GetString("user_id")
	heroFrag, skinFrag, err := h.svcs.User.GetAssets(c.Request.Context(), userID)
	if err != nil {
		util.ServerError(c, err.Error())
		return
	}
	util.OK(c, gin.H{
		"hero_fragments": heroFrag,
		"skin_fragments": skinFrag,
	})
}

func (h *UserHandler) SelectHero(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		HeroID string `json:"hero_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "hero_id必填")
		return
	}
	if err := h.svcs.User.SelectHero(c.Request.Context(), userID, req.HeroID); err != nil {
		util.ServerError(c, err.Error())
		return
	}
	util.OK(c, nil)
}

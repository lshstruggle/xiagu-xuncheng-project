package handler

import (
	"errors"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"

	"github.com/gin-gonic/gin"
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

	result, err := h.svcs.User.Login(c.Request.Context(), req.Code)
	if errors.Is(err, service.ErrUserBanned) {
		util.Forbidden(c, "用户已被封禁")
		return
	}
	if err != nil {
		util.ServerError(c, "登录失败")
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

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		Nickname string `json:"nickname" binding:"required"`
		Avatar   string `json:"avatar" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "昵称和头像不能为空")
		return
	}

	user, err := h.svcs.User.UpdateProfile(
		c.Request.Context(),
		userID,
		req.Nickname,
		req.Avatar,
	)
	if errors.Is(err, service.ErrInvalidUserProfile) {
		util.BadRequest(c, "昵称或头像格式不正确")
		return
	}
	if err != nil {
		util.ServerError(c, "保存用户资料失败")
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

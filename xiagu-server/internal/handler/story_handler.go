package handler

import (
	"github.com/gin-gonic/gin"

	"xiagu-server/internal/middleware"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/logger"
	"xiagu-server/pkg/util"
)

type StoryHandler struct {
	service *service.StoryService
}

func NewStoryHandler(storyService *service.StoryService) *StoryHandler {
	return &StoryHandler{service: storyService}
}

func (h *StoryHandler) GetDefinition(c *gin.Context) {
	definition, err := h.service.GetDefinition(c.Request.Context(), c.Param("story_id"))
	if h.writeError(c, err) {
		return
	}
	util.OK(c, definition)
}

func (h *StoryHandler) GetProgress(c *gin.Context) {
	progress, err := h.service.GetProgress(
		c.Request.Context(),
		c.GetString("user_id"),
		c.Param("story_id"),
		c.Query("mode"),
	)
	if h.writeError(c, err) {
		return
	}
	util.OK(c, progress)
}

func (h *StoryHandler) Start(c *gin.Context) {
	var request struct {
		HeroID string `json:"hero_id"`
		Mode   string `json:"mode"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		util.BadRequest(c, "参数错误")
		return
	}
	progress, err := h.service.Start(
		c.Request.Context(),
		c.GetString("user_id"),
		c.Param("story_id"),
		request.HeroID,
		request.Mode,
	)
	if h.writeError(c, err) {
		return
	}
	util.OK(c, progress)
}

func (h *StoryHandler) Advance(c *gin.Context) {
	var request service.StoryAdvanceRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		util.BadRequest(c, "参数错误")
		return
	}
	progress, err := h.service.Advance(
		c.Request.Context(),
		c.GetString("user_id"),
		c.Param("story_id"),
		request,
	)
	if h.writeError(c, err) {
		return
	}
	util.OK(c, progress)
}

func (h *StoryHandler) Pause(c *gin.Context) {
	h.setStatus(c, "paused")
}

func (h *StoryHandler) Resume(c *gin.Context) {
	h.setStatus(c, "ongoing")
}

func (h *StoryHandler) setStatus(c *gin.Context, status string) {
	var request struct {
		Mode     string `json:"mode"`
		Revision int64  `json:"revision"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		util.BadRequest(c, "参数错误")
		return
	}
	progress, err := h.service.SetStatus(
		c.Request.Context(),
		c.GetString("user_id"),
		c.Param("story_id"),
		request.Mode,
		status,
		request.Revision,
	)
	if h.writeError(c, err) {
		return
	}
	util.OK(c, progress)
}

func (h *StoryHandler) Reset(c *gin.Context) {
	var request struct {
		Mode string `json:"mode"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		util.BadRequest(c, "参数错误")
		return
	}
	if err := h.service.Reset(
		c.Request.Context(),
		c.GetString("user_id"),
		c.Param("story_id"),
		request.Mode,
	); h.writeError(c, err) {
		return
	}
	util.OK(c, gin.H{"success": true})
}

func (h *StoryHandler) writeError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	if util.AppError(c, err) {
		return true
	}
	logger.Error(
		"story request failed request_id=%s story_id=%s error=%v",
		middleware.GetRequestID(c),
		c.Param("story_id"),
		err,
	)
	util.ServerError(c, "剧情服务暂时不可用")
	return true
}

package handler

import (
	"github.com/gin-gonic/gin"

	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type RouteProgressHandler struct{ service *service.RouteProgressService }

func NewRouteProgressHandler(routeService *service.RouteProgressService) *RouteProgressHandler {
	return &RouteProgressHandler{service: routeService}
}

func (h *RouteProgressHandler) Complete(c *gin.Context) {
	var request struct {
		RouteCode string `json:"route_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		util.BadRequest(c, "route_code必填")
		return
	}
	response, err := h.service.Complete(c.Request.Context(), c.GetString("user_id"), request.RouteCode)
	if err != nil {
		if util.AppError(c, err) {
			return
		}
		util.ServerError(c, "提交路线完成状态失败")
		return
	}
	util.OK(c, response)
}

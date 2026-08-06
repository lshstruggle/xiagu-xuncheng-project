package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type POIHandler struct {
	svcs *service.Services
}

func (h *POIHandler) GetList(c *gin.Context) {
	cityCode := c.Query("city_code")
	if cityCode == "" {
		util.BadRequest(c, "city_code必填")
		return
	}
	pois, err := h.svcs.POI.GetByCity(c.Request.Context(), cityCode)
	if err != nil {
		util.ServerError(c, err.Error())
		return
	}
	util.OK(c, pois)
}

func (h *POIHandler) GetNearby(c *gin.Context) {
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lng, _ := strconv.ParseFloat(c.Query("lng"), 64)
	cityCode := c.Query("city_code")

	if lat == 0 || lng == 0 {
		util.BadRequest(c, "lat和lng必填")
		return
	}

	pois, err := h.svcs.POI.GetNearby(c.Request.Context(), lng, lat, cityCode)
	if err != nil {
		util.ServerError(c, err.Error())
		return
	}
	util.OK(c, pois)
}

func (h *POIHandler) GetDetail(c *gin.Context) {
	id := c.Param("id")
	poi, err := h.svcs.POI.GetDetail(c.Request.Context(), id)
	if err != nil {
		util.NotFound(c, "POI不存在")
		return
	}
	util.OK(c, poi)
}

func (h *POIHandler) GetRoutes(c *gin.Context) {
	cityCode := c.Query("city_code")
	routes, err := h.svcs.POI.GetRoutes(c.Request.Context(), cityCode)
	if err != nil {
		util.ServerError(c, err.Error())
		return
	}
	util.OK(c, routes)
}

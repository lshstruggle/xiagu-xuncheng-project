package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
)

// EasterEggHandler 彩蛋处理器
type EasterEggHandler struct {
	easterEggService *service.EasterEggService
}

// NewEasterEggHandler 创建彩蛋处理器
func NewEasterEggHandler(easterEggService *service.EasterEggService) *EasterEggHandler {
	return &EasterEggHandler{
		easterEggService: easterEggService,
	}
}

// GetEasterEggs 获取所有彩蛋
// @Summary 获取所有彩蛋
// @Description 获取城市中所有可用的彩蛋数据
// @Tags 彩蛋
// @Accept json
// @Produce json
// @Param city_id query string false "城市ID"
// @Success 200 {object} map[string]interface{}"彩蛋列表"
// @Router /api/v1/easter-eggs [get]
func (h *EasterEggHandler) GetEasterEggs(c *gin.Context) {
	cityID := c.DefaultQuery("city_id", "chengdu")

	eggs, err := h.easterEggService.GetEasterEggs(c.Request.Context(), cityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取彩蛋失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": eggs,
		"total": len(eggs),
	})
}

// GetEasterEggByID 根据ID获取彩蛋
// @Summary 获取单个彩蛋详情
// @Description 根据彩蛋ID获取详细信息
// @Tags 彩蛋
// @Accept json
// @Produce json
// @Param id path string true "彩蛋ID"
// @Success 200 {object} map[string]interface{}"彩蛋详情"
// @Router /api/v1/easter-eggs/{id} [get]
func (h *EasterEggHandler) GetEasterEggByID(c *gin.Context) {
	id := c.Param("id")

	egg, err := h.easterEggService.GetEasterEggByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "彩蛋不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": egg,
	})
}

// GetNearbyEasterEggs 获取附近的彩蛋
// @Summary 获取附近的彩蛋
// @Description 根据用户位置获取附近的彩蛋
// @Tags 彩蛋
// @Accept json
// @Produce json
// @Param lat query number true "纬度"
// @Param lng query number true "经度"
// @Param radius query number false "搜索半径(米),默认500"
// @Success 200 {object} map[string]interface{}"附近彩蛋列表"
// @Router /api/v1/easter-eggs/nearby [get]
func (h *EasterEggHandler) GetNearbyEasterEggs(c *gin.Context) {
	var req struct {
		Lat    float64 `form:"lat" binding:"required"`
		Lng    float64 `form:"lng" binding:"required"`
		Radius int     `form:"radius,default=500"`
	}

	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "参数错误: " + err.Error(),
		})
		return
	}

	eggs, err := h.easterEggService.GetNearbyEasterEggs(
		c.Request.Context(),
		req.Lat,
		req.Lng,
		req.Radius,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "查询失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  eggs,
		"total": len(eggs),
	})
}

// CollectEasterEgg 收集彩蛋
// @Summary 收集彩蛋
// @Description 用户收集指定彩蛋
// @Tags 彩蛋
// @Accept json
// @Produce json
// @Param request body CollectEasterEggRequest true "收集请求"
// @Success 200 {object} map[string]interface{}"收集结果"
// @Router /api/v1/easter-eggs/collect [post]
func (h *EasterEggHandler) CollectEasterEgg(c *gin.Context) {
	var req struct {
		EasterEggID string `json:"easter_egg_id" binding:"required"`
		UserID      string `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "参数错误: " + err.Error(),
		})
		return
	}

	result, err := h.easterEggService.CollectEasterEgg(
		c.Request.Context(),
		req.UserID,
		req.EasterEggID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "收集失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "彩蛋收集成功",
	})
}

// GetUserEasterEggCollection 获取用户彩蛋收集记录
// @Summary 获取用户彩蛋收集记录
// @Description 获取指定用户已收集的所有彩蛋
// @Tags 彩蛋
// @Accept json
// @Produce json
// @Param user_id path string true "用户ID"
// @Success 200 {object} map[string]interface{}"收集记录"
// @Router /api/v1/users/{user_id}/easter-eggs [get]
func (h *EasterEggHandler) GetUserEasterEggCollection(c *gin.Context) {
	userID := c.Param("user_id")

	collections, err := h.easterEggService.GetUserCollection(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取记录失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": collections,
	})
}

package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"xiagu-server/internal/model"
	"xiagu-server/pkg/util"
)

// AdminHandler 管理员接口处理器
type AdminHandler struct {
	// 后续注入service
}

// NewAdminHandler 创建处理器
func NewAdminHandler() *AdminHandler {
	return &AdminHandler{}
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Remember bool   `json:"remember"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token string         `json:"token"`
	User  model.AdminUser `json:"user"`
}

// Login 管理员登录
func (h *AdminHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	// TODO: 从数据库查询管理员
	// 临时使用硬编码管理员账号
	if req.Username != "admin" {
		util.ResponseError(c, http.StatusUnauthorized, "用户不存在")
		return
	}

	// 验证密码（默认密码 admin123）
	// 生产环境使用 bcrypt，开发环境临时用明文
	if req.Password != "admin123" {
		util.ResponseError(c, http.StatusUnauthorized, "密码错误")
		return
	}

	// 生成JWT
	token, err := util.GenerateAdminToken("admin_id_001", req.Username)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "生成Token失败")
		return
	}

	user := model.AdminUser{
		ID:          primitive.NewObjectID(),
		Username:    "admin",
		Nickname:    "超级管理员",
		Role:        "super_admin",
		LastLoginAt: time.Now(),
	}

	util.ResponseSuccess(c, LoginResponse{
		Token: token,
		User:  user,
	})
}

// Logout 管理员登出
func (h *AdminHandler) Logout(c *gin.Context) {
	// TODO: 将token加入黑名单
	util.ResponseSuccess(c, nil)
}

// GetProfile 获取管理员信息
func (h *AdminHandler) GetProfile(c *gin.Context) {
	// 从JWT获取管理员ID
	adminID, _ := c.Get("admin_id")
	username, _ := c.Get("username")

	user := model.AdminUser{
		ID:       primitive.NewObjectID(),
		Username: username.(string),
		Nickname: "超级管理员",
		Role:     "super_admin",
		Avatar:   "",
	}

	_ = adminID

	util.ResponseSuccess(c, user)
}

// GetDashboardStats 获取数据看板统计
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	// TODO: 从数据库查询真实数据
	stats := model.DashboardStats{
		TodayActiveUsers: 1234,
		TodayCheckins:    567,
		TotalUsers:       12345,
		CouponUsageRate:  23.5,
		Trends: []model.TrendData{
			{Date: "2026-04-02", Checkins: 450, NewUsers: 89},
			{Date: "2026-04-03", Checkins: 520, NewUsers: 102},
			{Date: "2026-04-04", Checkins: 480, NewUsers: 95},
			{Date: "2026-04-05", Checkins: 600, NewUsers: 120},
			{Date: "2026-04-06", Checkins: 550, NewUsers: 110},
			{Date: "2026-04-07", Checkins: 620, NewUsers: 135},
			{Date: "2026-04-08", Checkins: 567, NewUsers: 118},
		},
		HotPois: []model.HotPOIData{
			{POIID: "poi_1", POIName: "武侯祠", Count: 234},
			{POIID: "poi_2", POIName: "宽窄巷子", Count: 189},
			{POIID: "poi_3", POIName: "春熙路", Count: 156},
			{POIID: "poi_4", POIName: "太古里", Count: 134},
			{POIID: "poi_5", POIName: "锦里", Count: 98},
		},
	}

	util.ResponseSuccess(c, stats)
}

// GetTrends 获取趋势数据
func (h *AdminHandler) GetTrends(c *gin.Context) {
	days := 7
	// TODO: 查询数据库
	trends := []model.TrendData{
		{Date: "2026-04-02", Checkins: 450, NewUsers: 89},
		{Date: "2026-04-03", Checkins: 520, NewUsers: 102},
		{Date: "2026-04-04", Checkins: 480, NewUsers: 95},
		{Date: "2026-04-05", Checkins: 600, NewUsers: 120},
		{Date: "2026-04-06", Checkins: 550, NewUsers: 110},
		{Date: "2026-04-07", Checkins: 620, NewUsers: 135},
		{Date: "2026-04-08", Checkins: 567, NewUsers: 118},
	}

	_ = days
	util.ResponseSuccess(c, trends)
}

// GetHotPois 获取热门POI
func (h *AdminHandler) GetHotPois(c *gin.Context) {
	hotPois := []model.HotPOIData{
		{POIID: "poi_1", POIName: "武侯祠", Count: 234},
		{POIID: "poi_2", POIName: "宽窄巷子", Count: 189},
		{POIID: "poi_3", POIName: "春熙路", Count: 156},
		{POIID: "poi_4", POIName: "太古里", Count: 134},
		{POIID: "poi_5", POIName: "锦里", Count: 98},
	}

	util.ResponseSuccess(c, hotPois)
}

// UploadImage 上传图片
func (h *AdminHandler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "获取文件失败")
		return
	}

	// TODO: 上传到云存储
	_ = file

	util.ResponseSuccess(c, gin.H{
		"url": "https://example.com/uploaded/image.jpg",
	})
}

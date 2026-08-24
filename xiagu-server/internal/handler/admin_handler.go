package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
	"xiagu-server/pkg/util"
)

// AdminHandler 管理员接口处理器
type AdminHandler struct {
	collection *database.Collection
	jwtSecret  string
}

// NewAdminHandler 创建处理器
func NewAdminHandler(collections *database.Collections,
	jwtSecret string) *AdminHandler {
	return &AdminHandler{
		collection: collections.Collection("admins"),
		jwtSecret:  jwtSecret,
	}
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Remember bool   `json:"remember"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token string          `json:"token"`
	User  model.AdminUser `json:"user"`
}

// Login 管理员登录
func (h *AdminHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	var admin model.AdminUser
	err := h.collection.FindOne(
		c.Request.Context(),
		bson.M{
			"username": req.Username,
			"status":   "active",
		},
	).Decode(&admin)

	if errors.Is(err, database.ErrDocumentNotFound) {
		util.ResponseError(
			c,
			http.StatusUnauthorized,
			"用户名或密码错误",
		)
		return
	}
	if err != nil {
		util.ResponseError(
			c,
			http.StatusServiceUnavailable,
			"认证服务暂不可用",
		)
		return
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(admin.PasswordHash),
		[]byte(req.Password),
	)
	if err != nil {
		util.ResponseError(
			c,
			http.StatusUnauthorized,
			"用户名或密码错误",
		)
		return
	}

	token, err := util.GenerateAdminToken(
		admin.ID.Hex(),
		admin.Username,
		admin.Role,
		h.jwtSecret,
	)
	if err != nil {
		util.ResponseError(
			c,
			http.StatusInternalServerError,
			"生成Token失败",
		)
		return
	}

	now := time.Now()
	admin.LastLoginAt = now

	_, err = h.collection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": admin.ID},
		bson.M{"$set": bson.M{
			"last_login_at": now,
		}},
	)
	if err != nil {
		util.ResponseError(
			c,
			http.StatusInternalServerError,
			"更新登录状态失败",
		)
		return
	}

	util.ResponseSuccess(c, LoginResponse{
		Token: token,
		User:  admin,
	})
}

// Logout 管理员登出
func (h *AdminHandler) Logout(c *gin.Context) {
	// TODO: 将token加入黑名单
	util.ResponseSuccess(c, nil)
}

// GetProfile 获取管理员信息
func (h *AdminHandler) GetProfile(c *gin.Context) {
	adminID := c.GetString("admin_id")

	objectID, err := primitive.ObjectIDFromHex(adminID)
	if err != nil {
		util.ResponseError(
			c,
			http.StatusUnauthorized,
			"管理员身份无效",
		)
		return
	}

	var admin model.AdminUser
	err = h.collection.FindOne(
		c.Request.Context(),
		bson.M{
			"_id":    objectID,
			"status": "active",
		},
	).Decode(&admin)
	if err != nil {
		util.ResponseError(
			c,
			http.StatusUnauthorized,
			"管理员不存在或已停用",
		)
		return
	}

	util.ResponseSuccess(c, admin)
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

package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/model"
	"xiagu-server/pkg/util"
)

// UserAdminHandler 用户管理接口
type UserAdminHandler struct {
	db *mongo.Database
}

// NewUserAdminHandler 创建处理器
func NewUserAdminHandler(db *mongo.Database) *UserAdminHandler {
	return &UserAdminHandler{db: db}
}

// GetUserList 获取用户列表
func (h *UserAdminHandler) GetUserList(c *gin.Context) {
	page := 1
	pageSize := 20

	filter := bson.M{}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if heroID := c.Query("hero_id"); heroID != "" {
		filter["current_hero_id"] = heroID
	}
	if keyword := c.Query("keyword"); keyword != "" {
		filter["$or"] = bson.A{
			bson.M{"nickname": bson.M{"$regex": keyword, "$options": "i"}},
			bson.M{"openid": bson.M{"$regex": keyword, "$options": "i"}},
		}
	}

	coll := h.db.Collection("users")

	// 查询总数
	total, _ := coll.CountDocuments(c, filter)

	// 查询数据
	opts := options.Find().
		SetSkip(int64((page - 1) * pageSize)).
		SetLimit(int64(pageSize)).
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := coll.Find(c, filter, opts)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "查询失败")
		return
	}
	defer cursor.Close(c)

	var users []model.User
	if err := cursor.All(c, &users); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, gin.H{
		"list":     users,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetUserDetail 获取用户详情
func (h *UserAdminHandler) GetUserDetail(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var user model.User
	err = h.db.Collection("users").FindOne(c, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		util.ResponseError(c, http.StatusNotFound, "用户不存在")
		return
	}

	util.ResponseSuccess(c, user)
}

// BanUser 封禁用户
func (h *UserAdminHandler) BanUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	_, err = h.db.Collection("users").UpdateOne(
		c,
		bson.M{"_id": objectID},
		bson.M{"$set": bson.M{
			"status":      "banned",
			"ban_reason":  req.Reason,
			"banned_at":   primitive.NewDateTimeFromTime(time.Now()),
		}},
	)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "封禁失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

// UnbanUser 解封用户
func (h *UserAdminHandler) UnbanUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	_, err = h.db.Collection("users").UpdateOne(
		c,
		bson.M{"_id": objectID},
		bson.M{"$set": bson.M{
			"status":     "active",
			"ban_reason": "",
		}},
	)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解封失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

// GetUserCoupons 获取用户的优惠券
func (h *UserAdminHandler) GetUserCoupons(c *gin.Context) {
	id := c.Param("id")

	coll := h.db.Collection("user_coupons")
	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := coll.Find(c, bson.M{"user_id": id}, opts)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "查询失败")
		return
	}
	defer cursor.Close(c)

	var coupons []bson.M
	if err := cursor.All(c, &coupons); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, coupons)
}

// GetUserCheckins 获取用户的打卡记录
func (h *UserAdminHandler) GetUserCheckins(c *gin.Context) {
	id := c.Param("id")

	coll := h.db.Collection("checkins")
	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(50)

	cursor, err := coll.Find(c, bson.M{"user_id": id}, opts)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "查询失败")
		return
	}
	defer cursor.Close(c)

	var checkins []bson.M
	if err := cursor.All(c, &checkins); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, checkins)
}

// GetUserStats 获取用户统计
func (h *UserAdminHandler) GetUserStats(c *gin.Context) {
	coll := h.db.Collection("users")

	// 总用户数
	total, _ := coll.CountDocuments(c, bson.M{})

	// 今日新增
	today := time.Now().Truncate(24 * time.Hour)
	todayNew, _ := coll.CountDocuments(c, bson.M{
		"created_at": bson.M{"$gte": today},
	})

	// 活跃用户（7天内登录）
	weekAgo := time.Now().AddDate(0, 0, -7)
	active, _ := coll.CountDocuments(c, bson.M{
		"last_login_at": bson.M{"$gte": weekAgo},
	})

	// 封禁用户
	banned, _ := coll.CountDocuments(c, bson.M{
		"status": "banned",
	})

	util.ResponseSuccess(c, gin.H{
		"total":     total,
		"today_new": todayNew,
		"active":    active,
		"banned":    banned,
	})
}

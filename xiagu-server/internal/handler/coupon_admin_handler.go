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

// CouponAdminHandler 优惠券管理接口
type CouponAdminHandler struct {
	db *mongo.Database
}

// NewCouponAdminHandler 创建处理器
func NewCouponAdminHandler(db *mongo.Database) *CouponAdminHandler {
	return &CouponAdminHandler{db: db}
}

// GetCouponList 获取优惠券列表
func (h *CouponAdminHandler) GetCouponList(c *gin.Context) {
	page := 1
	pageSize := 20

	filter := bson.M{}
	if couponType := c.Query("type"); couponType != "" {
		filter["type"] = couponType
	}
	if subType := c.Query("sub_type"); subType != "" {
		filter["sub_type"] = subType
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if merchantID := c.Query("merchant_id"); merchantID != "" {
		filter["merchant_id"] = merchantID
	}
	if keyword := c.Query("keyword"); keyword != "" {
		filter["$or"] = bson.A{
			bson.M{"name": bson.M{"$regex": keyword, "$options": "i"}},
			bson.M{"description": bson.M{"$regex": keyword, "$options": "i"}},
		}
	}

	coll := h.db.Collection("coupon_definitions")

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

	var coupons []model.CouponDefinition
	if err := cursor.All(c, &coupons); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, gin.H{
		"list":     coupons,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetCouponDetail 获取优惠券详情
func (h *CouponAdminHandler) GetCouponDetail(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var coupon model.CouponDefinition
	err = h.db.Collection("coupon_definitions").FindOne(c, bson.M{"_id": objectID}).Decode(&coupon)
	if err != nil {
		util.ResponseError(c, http.StatusNotFound, "优惠券不存在")
		return
	}

	util.ResponseSuccess(c, coupon)
}

// CreateCoupon 创建优惠券
func (h *CouponAdminHandler) CreateCoupon(c *gin.Context) {
	var coupon model.CouponDefinition
	if err := c.ShouldBindJSON(&coupon); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	coupon.ID = primitive.NewObjectID()
	coupon.Status = "active"
	coupon.IssuedCount = 0
	coupon.UsedCount = 0
	coupon.CreatedAt = time.Now()
	coupon.UpdatedAt = time.Now()

	_, err := h.db.Collection("coupon_definitions").InsertOne(c, coupon)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "创建失败")
		return
	}

	util.ResponseSuccess(c, coupon)
}

// UpdateCoupon 更新优惠券
func (h *CouponAdminHandler) UpdateCoupon(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var update bson.M
	if err := c.ShouldBindJSON(&update); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	// 删除不能更新的字段
	delete(update, "_id")
	delete(update, "id")
	delete(update, "created_at")
	delete(update, "issued_count")
	delete(update, "used_count")
	update["updated_at"] = time.Now()

	_, err = h.db.Collection("coupon_definitions").UpdateOne(
		c,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
	)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "更新失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

// DeleteCoupon 删除优惠券
func (h *CouponAdminHandler) DeleteCoupon(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	_, err = h.db.Collection("coupon_definitions").DeleteOne(c, bson.M{"_id": objectID})
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "删除失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

// GetCouponStats 获取优惠券统计
func (h *CouponAdminHandler) GetCouponStats(c *gin.Context) {
	coll := h.db.Collection("coupon_definitions")

	// 总数量
	total, _ := coll.CountDocuments(c, bson.M{})

	// 活跃数量
	active, _ := coll.CountDocuments(c, bson.M{"status": "active"})

	// 已发放总数
	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.M{
			"_id":         nil,
			"totalIssued": bson.M{"$sum": "$issued_count"},
			"totalUsed":   bson.M{"$sum": "$used_count"},
		}}},
	}

	cursor, err := coll.Aggregate(c, pipeline)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "统计失败")
		return
	}
	defer cursor.Close(c)

	var stats struct {
		TotalIssued int64 `bson:"totalIssued"`
		TotalUsed   int64 `bson:"totalUsed"`
	}
	if cursor.Next(c) {
		cursor.Decode(&stats)
	}

	util.ResponseSuccess(c, gin.H{
		"total":        total,
		"active":       active,
		"total_issued": stats.TotalIssued,
		"total_used":   stats.TotalUsed,
	})
}

// IssueCouponToUser 给用户发放优惠券
func (h *CouponAdminHandler) IssueCouponToUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var req struct {
		UserID string `json:"user_id" binding:"required"`
		Count  int    `json:"count" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	// 查询优惠券定义
	var couponDef model.CouponDefinition
	err = h.db.Collection("coupon_definitions").FindOne(c, bson.M{"_id": objectID}).Decode(&couponDef)
	if err != nil {
		util.ResponseError(c, http.StatusNotFound, "优惠券不存在")
		return
	}

	// 检查库存
	if couponDef.TotalLimit > 0 && couponDef.IssuedCount+req.Count > couponDef.TotalLimit {
		util.ResponseError(c, http.StatusBadRequest, "优惠券库存不足")
		return
	}

	// 创建用户优惠券记录
	now := time.Now()
	expireAt := now.AddDate(0, 0, couponDef.ValidDays)

	userCoupons := make([]interface{}, req.Count)
	for i := 0; i < req.Count; i++ {
		userCoupons[i] = bson.M{
			"_id":          primitive.NewObjectID(),
			"user_id":      req.UserID,
			"coupon_def_id": id,
			"name":         couponDef.Name,
			"type":         couponDef.Type,
			"sub_type":     couponDef.SubType,
			"image":        couponDef.Image,
			"discount_type": couponDef.DiscountType,
			"discount_value": couponDef.DiscountValue,
			"min_amount":   couponDef.MinAmount,
			"merchant_id":  couponDef.MerchantID,
			"poi_ids":      couponDef.POIIDs,
			"status":       "unused",
			"created_at":   now,
			"expire_at":    expireAt,
		}
	}

	_, err = h.db.Collection("user_coupons").InsertMany(c, userCoupons)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "发放失败")
		return
	}

	// 更新已发放数量
	_, err = h.db.Collection("coupon_definitions").UpdateOne(
		c,
		bson.M{"_id": objectID},
		bson.M{"$inc": bson.M{"issued_count": req.Count}},
	)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "更新统计失败")
		return
	}

	util.ResponseSuccess(c, gin.H{"issued": req.Count})
}

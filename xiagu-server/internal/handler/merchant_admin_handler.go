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

// MerchantAdminHandler 商户管理接口
type MerchantAdminHandler struct {
	db *mongo.Database
}

// NewMerchantAdminHandler 创建处理器
func NewMerchantAdminHandler(db *mongo.Database) *MerchantAdminHandler {
	return &MerchantAdminHandler{db: db}
}

// GetMerchantList 获取商户列表
func (h *MerchantAdminHandler) GetMerchantList(c *gin.Context) {
	page := 1
	pageSize := 20

	filter := bson.M{}
	if category := c.Query("category"); category != "" {
		filter["category"] = category
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if keyword := c.Query("keyword"); keyword != "" {
		filter["$or"] = bson.A{
			bson.M{"name": bson.M{"$regex": keyword, "$options": "i"}},
			bson.M{"contact": bson.M{"$regex": keyword, "$options": "i"}},
			bson.M{"phone": bson.M{"$regex": keyword, "$options": "i"}},
		}
	}

	coll := h.db.Collection("merchants")

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

	var merchants []model.Merchant
	if err := cursor.All(c, &merchants); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, gin.H{
		"list":     merchants,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetAllMerchants 获取所有商户（下拉选择用）
func (h *MerchantAdminHandler) GetAllMerchants(c *gin.Context) {
	coll := h.db.Collection("merchants")

	opts := options.Find().
		SetProjection(bson.M{"_id": 1, "name": 1}).
		SetSort(bson.D{{Key: "name", Value: 1}})

	cursor, err := coll.Find(c, bson.M{"status": "active"}, opts)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "查询失败")
		return
	}
	defer cursor.Close(c)

	var merchants []model.Merchant
	if err := cursor.All(c, &merchants); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, merchants)
}

// GetMerchantDetail 获取商户详情
func (h *MerchantAdminHandler) GetMerchantDetail(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var merchant model.Merchant
	err = h.db.Collection("merchants").FindOne(c, bson.M{"_id": objectID}).Decode(&merchant)
	if err != nil {
		util.ResponseError(c, http.StatusNotFound, "商户不存在")
		return
	}

	util.ResponseSuccess(c, merchant)
}

// CreateMerchant 创建商户
func (h *MerchantAdminHandler) CreateMerchant(c *gin.Context) {
	var merchant model.Merchant
	if err := c.ShouldBindJSON(&merchant); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	merchant.ID = primitive.NewObjectID()
	merchant.Status = "active"
	merchant.CreatedAt = time.Now()
	merchant.UpdatedAt = time.Now()

	_, err := h.db.Collection("merchants").InsertOne(c, merchant)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "创建失败")
		return
	}

	util.ResponseSuccess(c, merchant)
}

// UpdateMerchant 更新商户
func (h *MerchantAdminHandler) UpdateMerchant(c *gin.Context) {
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
	update["updated_at"] = time.Now()

	_, err = h.db.Collection("merchants").UpdateOne(
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

// DeleteMerchant 删除商户
func (h *MerchantAdminHandler) DeleteMerchant(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	_, err = h.db.Collection("merchants").DeleteOne(c, bson.M{"_id": objectID})
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "删除失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

// GetMerchantRelatedPOIs 获取商户关联的POI
func (h *MerchantAdminHandler) GetMerchantRelatedPOIs(c *gin.Context) {
	id := c.Param("id")

	coll := h.db.Collection("pois")
	opts := options.Find().
		SetProjection(bson.M{"_id": 1, "name": 1, "type": 1})

	cursor, err := coll.Find(c, bson.M{"merchant_id": id}, opts)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "查询失败")
		return
	}
	defer cursor.Close(c)

	var pois []model.POI
	if err := cursor.All(c, &pois); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, pois)
}

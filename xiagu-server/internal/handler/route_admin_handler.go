package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/model"
	"xiagu-server/pkg/util"
)

// RouteAdminHandler 路线管理接口
type RouteAdminHandler struct {
	db *mongo.Database
}

// NewRouteAdminHandler 创建处理器
func NewRouteAdminHandler(db *mongo.Database) *RouteAdminHandler {
	return &RouteAdminHandler{db: db}
}

// GetRouteList 获取路线列表
func (h *RouteAdminHandler) GetRouteList(c *gin.Context) {
	page := 1
	pageSize := 20

	filter := bson.M{}
	if cityCode := c.Query("city_code"); cityCode != "" {
		filter["city_code"] = cityCode
	}
	if difficulty := c.Query("difficulty"); difficulty != "" {
		filter["difficulty"] = difficulty
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if keyword := c.Query("keyword"); keyword != "" {
		filter["$or"] = bson.A{
			bson.M{"name": bson.M{"$regex": keyword, "$options": "i"}},
			bson.M{"description": bson.M{"$regex": keyword, "$options": "i"}},
		}
	}

	coll := h.db.Collection("routes")

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

	var routes []model.Route
	if err := cursor.All(c, &routes); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, gin.H{
		"list":     routes,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetRouteDetail 获取路线详情
func (h *RouteAdminHandler) GetRouteDetail(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var route model.Route
	err = h.db.Collection("routes").FindOne(c, bson.M{"_id": objectID}).Decode(&route)
	if err != nil {
		util.ResponseError(c, http.StatusNotFound, "路线不存在")
		return
	}

	util.ResponseSuccess(c, route)
}

// CreateRoute 创建路线
func (h *RouteAdminHandler) CreateRoute(c *gin.Context) {
	var route model.Route
	if err := c.ShouldBindJSON(&route); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	route.ID = primitive.NewObjectID()
	route.Status = "active"

	_, err := h.db.Collection("routes").InsertOne(c, route)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "创建失败")
		return
	}

	util.ResponseSuccess(c, route)
}

// UpdateRoute 更新路线
func (h *RouteAdminHandler) UpdateRoute(c *gin.Context) {
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

	_, err = h.db.Collection("routes").UpdateOne(
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

// UpdateRoutePOISequence 更新路线POI顺序
func (h *RouteAdminHandler) UpdateRoutePOISequence(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var req struct {
		POISequence []string `json:"poi_sequence" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	_, err = h.db.Collection("routes").UpdateOne(
		c,
		bson.M{"_id": objectID},
		bson.M{"$set": bson.M{
			"poi_sequence": req.POISequence,
		}},
	)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "更新失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

// DeleteRoute 删除路线
func (h *RouteAdminHandler) DeleteRoute(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	_, err = h.db.Collection("routes").DeleteOne(c, bson.M{"_id": objectID})
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "删除失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

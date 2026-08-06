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

// POIAdminHandler POI管理接口
type POIAdminHandler struct {
	db *mongo.Database
}

// NewPOIAdminHandler 创建处理器
func NewPOIAdminHandler(db *mongo.Database) *POIAdminHandler {
	return &POIAdminHandler{db: db}
}

// GetPOIList 获取POI列表
func (h *POIAdminHandler) GetPOIList(c *gin.Context) {
	page := 1
	pageSize := 20

	filter := bson.M{}
	if cityCode := c.Query("city_code"); cityCode != "" {
		filter["city_code"] = cityCode
	}
	if poiType := c.Query("type"); poiType != "" {
		filter["type"] = poiType
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

	coll := h.db.Collection("pois")

	// 查询总数
	total, _ := coll.CountDocuments(c, filter)

	// 查询数据
	opts := options.Find().
		SetSkip(int64((page - 1) * pageSize)).
		SetLimit(int64(pageSize)).
		SetSort(bson.D{{Key: "priority", Value: -1}, {Key: "created_at", Value: -1}})

	cursor, err := coll.Find(c, filter, opts)
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

	util.ResponseSuccess(c, gin.H{
		"list":     pois,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetPOIDetail 获取POI详情
func (h *POIAdminHandler) GetPOIDetail(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var poi model.POI
	err = h.db.Collection("pois").FindOne(c, bson.M{"_id": objectID}).Decode(&poi)
	if err != nil {
		util.ResponseError(c, http.StatusNotFound, "POI不存在")
		return
	}

	util.ResponseSuccess(c, poi)
}

// CreatePOI 创建POI
func (h *POIAdminHandler) CreatePOI(c *gin.Context) {
	var poi model.POI
	if err := c.ShouldBindJSON(&poi); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	poi.ID = primitive.NewObjectID()
	poi.Status = "active"

	_, err := h.db.Collection("pois").InsertOne(c, poi)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "创建失败")
		return
	}

	util.ResponseSuccess(c, poi)
}

// UpdatePOI 更新POI
func (h *POIAdminHandler) UpdatePOI(c *gin.Context) {
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

	_, err = h.db.Collection("pois").UpdateOne(
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

// DeletePOI 删除POI
func (h *POIAdminHandler) DeletePOI(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	_, err = h.db.Collection("pois").DeleteOne(c, bson.M{"_id": objectID})
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "删除失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

// GetPOITypes 获取POI类型列表
func (h *POIAdminHandler) GetPOITypes(c *gin.Context) {
	types := []model.POITypeConfig{
		{ID: primitive.NewObjectID(), TypeCode: "blue_buff", TypeName: "蓝Buff", Color: "#1890ff", Description: "文化景点", IsActive: true, SortOrder: 1},
		{ID: primitive.NewObjectID(), TypeCode: "red_buff", TypeName: "红Buff", Color: "#ff4d4f", Description: "美食商户", IsActive: true, SortOrder: 2},
		{ID: primitive.NewObjectID(), TypeCode: "tower", TypeName: "防御塔", Color: "#faad14", Description: "城市地标", IsActive: true, SortOrder: 3},
		{ID: primitive.NewObjectID(), TypeCode: "spirit_lighthouse", TypeName: "荣耀灯塔", Color: "#722ed1", Description: "赛事场馆", IsActive: true, SortOrder: 4},
		{ID: primitive.NewObjectID(), TypeCode: "player_footprint", TypeName: "选手足迹", Color: "#52c41a", Description: "选手羁绊", IsActive: true, SortOrder: 5},
		{ID: primitive.NewObjectID(), TypeCode: "fountain", TypeName: "泉水", Color: "#13c2c2", Description: "酒店住宿", IsActive: true, SortOrder: 6},
	}

	util.ResponseSuccess(c, types)
}

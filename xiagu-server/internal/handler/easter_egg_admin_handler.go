package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
	"xiagu-server/pkg/util"
)

// EasterEggAdminHandler 彩蛋管理接口
type EasterEggAdminHandler struct {
	db *database.Collections
}

// NewEasterEggAdminHandler 创建处理器
func NewEasterEggAdminHandler(db *database.Collections) *EasterEggAdminHandler {
	return &EasterEggAdminHandler{db: db}
}

// GetEasterEggList 获取彩蛋列表
func (h *EasterEggAdminHandler) GetEasterEggList(c *gin.Context) {
	page := 1
	pageSize := 20

	filter := bson.M{}
	if eggType := c.Query("type"); eggType != "" {
		filter["type"] = eggType
	}
	if rarity := c.Query("rarity"); rarity != "" {
		filter["rarity"] = rarity
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

	coll := h.db.Collection("easter_eggs")

	// 查询总数
	total, _ := coll.CountDocuments(c, filter)

	// 查询数据
	opts := options.Find().
		SetSkip(int64((page - 1) * pageSize)).
		SetLimit(int64(pageSize)).
		SetSort(bson.D{{Key: "rarity", Value: -1}, {Key: "created_at", Value: -1}})

	cursor, err := coll.Find(c, filter, opts)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "查询失败")
		return
	}
	defer cursor.Close(c)

	var eggs []bson.M
	if err := cursor.All(c, &eggs); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, gin.H{
		"list":     eggs,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetEasterEggDetail 获取彩蛋详情
func (h *EasterEggAdminHandler) GetEasterEggDetail(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	var egg bson.M
	err = h.db.Collection("easter_eggs").FindOne(c, bson.M{"_id": objectID}).Decode(&egg)
	if err != nil {
		util.ResponseError(c, http.StatusNotFound, "彩蛋不存在")
		return
	}

	util.ResponseSuccess(c, egg)
}

// CreateEasterEgg 创建彩蛋
func (h *EasterEggAdminHandler) CreateEasterEgg(c *gin.Context) {
	var egg bson.M
	if err := c.ShouldBindJSON(&egg); err != nil {
		util.ResponseError(c, http.StatusBadRequest, "参数错误")
		return
	}

	egg["_id"] = primitive.NewObjectID()
	egg["status"] = "active"
	egg["created_at"] = time.Now()
	egg["updated_at"] = time.Now()

	_, err := h.db.Collection("easter_eggs").InsertOne(c, egg)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "创建失败")
		return
	}

	util.ResponseSuccess(c, egg)
}

// UpdateEasterEgg 更新彩蛋
func (h *EasterEggAdminHandler) UpdateEasterEgg(c *gin.Context) {
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

	_, err = h.db.Collection("easter_eggs").UpdateOne(
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

// DeleteEasterEgg 删除彩蛋
func (h *EasterEggAdminHandler) DeleteEasterEgg(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		util.ResponseError(c, http.StatusBadRequest, "ID格式错误")
		return
	}

	_, err = h.db.Collection("easter_eggs").DeleteOne(c, bson.M{"_id": objectID})
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "删除失败")
		return
	}

	util.ResponseSuccess(c, nil)
}

// GetEasterEggStats 获取彩蛋统计
func (h *EasterEggAdminHandler) GetEasterEggStats(c *gin.Context) {
	coll := h.db.Collection("easter_eggs")

	// 总数
	total, _ := coll.CountDocuments(c, bson.M{})

	// 按稀有度统计
	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.M{
			"_id":   "$rarity",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := coll.Aggregate(c, pipeline)
	if err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "统计失败")
		return
	}
	defer cursor.Close(c)

	var rarityStats []bson.M
	if err := cursor.All(c, &rarityStats); err != nil {
		util.ResponseError(c, http.StatusInternalServerError, "解析数据失败")
		return
	}

	util.ResponseSuccess(c, gin.H{
		"total":        total,
		"rarity_stats": rarityStats,
	})
}

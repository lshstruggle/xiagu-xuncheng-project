package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	ctx := context.Background()

	// 连接 MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	db := client.Database("xiagu")

	// 导入 POI 数据
	pois := getRealPOIs()
	poiColl := db.Collection("pois")

	// 清空旧数据
	poiColl.DeleteMany(ctx, bson.M{})

	// 插入新数据
	poiDocs := make([]interface{}, len(pois))
	for i, poi := range pois {
		poiDocs[i] = poi
	}
	if _, err := poiColl.InsertMany(ctx, poiDocs); err != nil {
		log.Fatal("导入 POI 失败:", err)
	}
	fmt.Printf("✅ 导入 %d 个 POI\n", len(pois))

	// 导入路线数据
	routes := getRealRoutes()
	routeColl := db.Collection("routes")

	// 清空旧数据
	routeColl.DeleteMany(ctx, bson.M{})

	// 插入新数据
	routeDocs := make([]interface{}, len(routes))
	for i, route := range routes {
		routeDocs[i] = route
	}
	if _, err := routeColl.InsertMany(ctx, routeDocs); err != nil {
		log.Fatal("导入路线失败:", err)
	}
	fmt.Printf("✅ 导入 %d 条路线\n", len(routes))

	fmt.Println("🎉 数据导入完成!")
}

func getRealPOIs() []interface{} {
	now := time.Now()
	pois := []interface{}{
		// 宽窄巷子路线 POIs
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "宽窄巷子",
			"type":           "tower",
			"category":       "文化景点",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0550, 30.6690}},
			"trigger_radius": 100,
			"description":    "由宽巷子、窄巷子、井巷子组成的清朝古街",
			"images":         []string{},
			"status":         "active",
			"priority":       100,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "成都院子酒店",
			"type":           "spirit_lighthouse",
			"category":       "酒店",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0480, 30.6755}},
			"trigger_radius": 80,
			"description":    "16座川西院落组成的非遗文化主题酒店",
			"images":         []string{},
			"status":         "active",
			"priority":       90,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "贺记蛋烘糕",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0770, 30.6740}},
			"trigger_radius": 50,
			"description":    "清朝传下来的成都传统小吃，外酥内软",
			"images":         []string{},
			"status":         "active",
			"priority":       80,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "洞子口张老二凉粉",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0760, 30.6755}},
			"trigger_radius": 50,
			"description":    "文殊院旁百年老店，甜水面五味俱全",
			"images":         []string{},
			"status":         "active",
			"priority":       80,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "文殊院",
			"type":           "spirit_lighthouse",
			"category":       "文化景点",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0760, 30.6750}},
			"trigger_radius": 100,
			"description":    "千年禅林，红墙银杏，盖碗茶文化体验地",
			"images":         []string{},
			"status":         "active",
			"priority":       95,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "明婷饭店",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0780, 30.6740}},
			"trigger_radius": 50,
			"description":    "老字号苍蝇馆子之王，味道霸道性价比高",
			"images":         []string{},
			"status":         "active",
			"priority":       85,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "陈麻婆豆腐",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0750, 30.6650}},
			"trigger_radius": 50,
			"description":    "始创于清朝同治年间的川菜代表名菜",
			"images":         []string{},
			"status":         "active",
			"priority":       85,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "乐山钵钵鸡",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0580, 30.6620}},
			"trigger_radius": 50,
			"description":    "冷串串浸在秘制红油中，麻辣鲜香",
			"images":         []string{},
			"status":         "active",
			"priority":       80,
			"created_at":     now,
			"updated_at":     now,
		},
		// 锦里古街路线 POIs
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "锦里古街",
			"type":           "red_buff",
			"category":       "文化景点",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0490, 30.6450}},
			"trigger_radius": 100,
			"description":    "三国文化主题街区，夜晚灯笼亮起仿佛穿越",
			"images":         []string{},
			"status":         "active",
			"priority":       100,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "武侯祠",
			"type":           "blue_buff",
			"category":       "文化景点",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0470, 30.6420}},
			"trigger_radius": 100,
			"description":    "中国唯一君臣合祀祠庙",
			"images":         []string{},
			"status":         "active",
			"priority":       100,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "杜甫草堂",
			"type":           "tower",
			"category":       "文化景点",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0550, 30.6245}},
			"trigger_radius": 100,
			"description":    "诗圣杜甫流寓成都故居",
			"images":         []string{},
			"status":         "active",
			"priority":       95,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "沈堂甜水面",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0550, 30.6350}},
			"trigger_radius": 50,
			"description":    "藏在居民楼下的神级摊子",
			"images":         []string{},
			"status":         "active",
			"priority":       80,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "AG电竞中心",
			"type":           "club",
			"category":       "电竞",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0300, 30.6500}},
			"trigger_radius": 80,
			"description":    "西南最大专业级XR数字电竞场馆",
			"images":         []string{},
			"status":         "active",
			"priority":       90,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "金沙遗址",
			"type":           "blue_buff",
			"category":       "文化景点",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0280, 30.6680}},
			"trigger_radius": 100,
			"description":    "古蜀文明的黄金密码",
			"images":         []string{},
			"status":         "active",
			"priority":       95,
			"created_at":     now,
			"updated_at":     now,
		},
		// 太古里路线 POIs
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "春熙路/太古里",
			"type":           "spirit_lighthouse",
			"category":       "商圈",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0820, 30.6560}},
			"trigger_radius": 120,
			"description":    "成都最繁华的时尚中心",
			"images":         []string{},
			"status":         "active",
			"priority":       100,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "吼堂老火锅",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0810, 30.6560}},
			"trigger_radius": 50,
			"description":    "复古网红火锅，地道牛油锅底",
			"images":         []string{},
			"status":         "active",
			"priority":       85,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "西月城潭豆花",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0820, 30.6580}},
			"trigger_radius": 50,
			"description":    "冰醉豆花解辣神器",
			"images":         []string{},
			"status":         "active",
			"priority":       80,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "量子光电竞中心",
			"type":           "arena",
			"category":       "电竞",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0900, 30.6600}},
			"trigger_radius": 80,
			"description":    "KPL西部主场",
			"images":         []string{},
			"status":         "active",
			"priority":       90,
			"created_at":     now,
			"updated_at":     now,
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "小妹蹄花",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": []float64{104.0890, 30.6480}},
			"trigger_radius": 50,
			"description":    "蹄花炖得软烂脱骨",
			"images":         []string{},
			"status":         "active",
			"priority":       80,
			"created_at":     now,
			"updated_at":     now,
		},
	}
	return pois
}

func getRealRoutes() []interface{} {
	now := time.Now()
	routes := []interface{}{
		bson.M{
			"_id":                    primitive.NewObjectID(),
			"city_code":              "CD",
			"name":                   "宽窄巷子探秘",
			"description":            "漫步千年古巷，穿越宽窄之间品味老成都的烟火与文艺",
			"duration":               "约2小时",
			"difficulty":             "easy",
			"distance":               2.3,
			"poi_sequence":           []string{},
			"tags":                   []string{"文化", "美食", "历史"},
			"spirit_lighthouse_count": 2,
			"player_footprint_count":  2,
			"recommended_heroes":     []string{"libai", "diaochan"},
			"cover_image":            "",
			"status":                 "active",
			"created_at":             now,
			"updated_at":             now,
		},
		bson.M{
			"_id":                    primitive.NewObjectID(),
			"city_code":              "CD",
			"name":                   "锦里古街漫游",
			"description":            "穿越三国风云，在锦里与武侯祠间寻找英雄足迹",
			"duration":               "约1.5小时",
			"difficulty":             "normal",
			"distance":               1.8,
			"poi_sequence":           []string{},
			"tags":                   []string{"三国", "文化", "电竞"},
			"spirit_lighthouse_count": 2,
			"player_footprint_count":  1,
			"recommended_heroes":     []string{"guanyu", "zhugeliang"},
			"cover_image":            "",
			"status":                 "active",
			"created_at":             now,
			"updated_at":             now,
		},
		bson.M{
			"_id":                    primitive.NewObjectID(),
			"city_code":              "CD",
			"name":                   "太古里巡礼",
			"description":            "成都最繁华的心脏地带，霓虹之下藏着最多的峡谷秘密",
			"duration":               "约1小时",
			"difficulty":             "hard",
			"distance":               1.2,
			"poi_sequence":           []string{},
			"tags":                   []string{"时尚", "美食", "电竞"},
			"spirit_lighthouse_count": 1,
			"player_footprint_count":  3,
			"recommended_heroes":     []string{"hanxin", "lanlingwang"},
			"cover_image":            "",
			"status":                 "active",
			"created_at":             now,
			"updated_at":             now,
		},
	}
	return routes
}

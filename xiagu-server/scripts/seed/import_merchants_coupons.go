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

	// 清空旧数据
	fmt.Println("清空商户和优惠券数据...")
	db.Collection("merchants").DeleteMany(ctx, bson.M{})
	db.Collection("coupon_definitions").DeleteMany(ctx, bson.M{})

	// 导入商户数据
	fmt.Println("导入商户数据...")
	merchants := []bson.M{
		{
			"_id":         primitive.NewObjectID(),
			"name":        "明婷饭店",
			"category":    "餐饮",
			"contact":     "明经理",
			"phone":       "028-88888888",
			"address":     "成都市金牛区外曹家巷",
			"open_time":   "11:00-21:00",
			"description": "成都本地人推荐的苍蝇馆子，地道川菜",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "吼堂老火锅",
			"category":    "餐饮",
			"contact":     "堂经理",
			"phone":       "028-88888889",
			"address":     "成都市锦江区东大街",
			"open_time":   "10:00-02:00",
			"description": "网红川味火锅，体验成都火锅文化",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "陈麻婆豆腐",
			"category":    "餐饮",
			"contact":     "陈经理",
			"phone":       "028-88888890",
			"address":     "成都市青羊区西御街",
			"open_time":   "11:00-21:00",
			"description": "百年老店，正宗麻婆豆腐发源地",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "成都院子酒店",
			"category":    "酒店",
			"contact":     "院经理",
			"phone":       "028-88888891",
			"address":     "成都市锦江区 courtyard",
			"open_time":   "24小时",
			"description": "精品四合院酒店，体验成都慢生活",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "背包十年青年旅舍",
			"category":    "酒店",
			"contact":     "包经理",
			"phone":       "028-88888892",
			"address":     "成都市武侯区",
			"open_time":   "24小时",
			"description": "网红青旅，背包客聚集地",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "武侯祠",
			"category":    "景点",
			"contact":     "武经理",
			"phone":       "028-88888893",
			"address":     "成都市武侯区武侯祠大街",
			"open_time":   "08:00-18:00",
			"description": "三国圣地，诸葛亮祠堂",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "金沙遗址博物馆",
			"category":    "景点",
			"contact":     "金经理",
			"phone":       "028-88888894",
			"address":     "成都市青羊区金沙遗址路",
			"open_time":   "09:00-18:00",
			"description": "古蜀文明遗址，太阳神鸟出土地",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "大熊猫基地",
			"category":    "景点",
			"contact":     "熊经理",
			"phone":       "028-88888895",
			"address":     "成都市成华区熊猫大道",
			"open_time":   "07:30-18:00",
			"description": "国宝大熊猫繁育研究基地",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "量子光电竞中心",
			"category":    "电竞",
			"contact":     "量经理",
			"phone":       "028-88888896",
			"address":     "成都市锦江区",
			"open_time":   "10:00-22:00",
			"description": "KPL官方比赛场馆",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
		{
			"_id":         primitive.NewObjectID(),
			"name":        "AG电竞中心",
			"category":    "电竞",
			"contact":     "A经理",
			"phone":       "028-88888897",
			"address":     "成都市武侯区",
			"open_time":   "10:00-22:00",
			"description": "AG超玩会主场馆",
			"logo":        "",
			"status":      "active",
			"created_at":  time.Now(),
			"updated_at":  time.Now(),
		},
	}

	merchantIDs := make(map[string]primitive.ObjectID)
	for _, m := range merchants {
		name := m["name"].(string)
		merchantIDs[name] = m["_id"].(primitive.ObjectID)
		_, err := db.Collection("merchants").InsertOne(ctx, m)
		if err != nil {
			log.Printf("插入商户 %s 失败: %v", name, err)
		} else {
			fmt.Printf("  ✓ 商户: %s\n", name)
		}
	}

	// 导入优惠券定义
	fmt.Println("\n导入优惠券定义...")
	now := time.Now()
	coupons := []bson.M{
		// 红Buff 优惠券
		{
			"_id":            primitive.NewObjectID(),
			"name":           "明婷饭店9折券",
			"type":           "coupon",
			"sub_type":       "red",
			"merchant_id":    merchantIDs["明婷饭店"].Hex(),
			"discount_type":  "discount",
			"discount_value": "9折",
			"min_amount":     100,
			"valid_days":     7,
			"usage_limit":    1,
			"total_limit":    1000,
			"issued_count":   0,
			"used_count":     0,
			"description":    "全单9折，堂食满100元可用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/红buff优惠卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"name":           "川味小食兑换券",
			"type":           "exchange",
			"sub_type":       "red",
			"merchant_id":    merchantIDs["明婷饭店"].Hex(),
			"discount_type":  "exchange",
			"discount_value": "免费兑换",
			"valid_days":     7,
			"usage_limit":    1,
			"total_limit":    500,
			"issued_count":   0,
			"used_count":     0,
			"description":    "免费兑换招牌凉菜一份，消费即可使用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/红buff兑换卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"name":           "吼堂火锅8.5折券",
			"type":           "coupon",
			"sub_type":       "red",
			"merchant_id":    merchantIDs["吼堂老火锅"].Hex(),
			"discount_type":  "discount",
			"discount_value": "8.5折",
			"min_amount":     200,
			"valid_days":     7,
			"usage_limit":    1,
			"total_limit":    1000,
			"issued_count":   0,
			"used_count":     0,
			"description":    "全单8.5折，堂食满200元可用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/红buff优惠卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"name":           "锅底升级体验券",
			"type":           "experience",
			"sub_type":       "red",
			"merchant_id":    merchantIDs["吼堂老火锅"].Hex(),
			"discount_type":  "exchange",
			"discount_value": "免费升级",
			"valid_days":     3,
			"usage_limit":    1,
			"total_limit":    500,
			"issued_count":   0,
			"used_count":     0,
			"description":    "免费升级特色锅底，任意消费可用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/红buff兑换卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"name":           "陈麻婆豆腐满减券",
			"type":           "coupon",
			"sub_type":       "red",
			"merchant_id":    merchantIDs["陈麻婆豆腐"].Hex(),
			"discount_type":  "amount",
			"discount_value": "满80减15",
			"min_amount":     80,
			"valid_days":     7,
			"usage_limit":    1,
			"total_limit":    800,
			"issued_count":   0,
			"used_count":     0,
			"description":    "满80减15，堂食可用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/红buff优惠卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		// 泉水住宿券
		{
			"_id":            primitive.NewObjectID(),
			"name":           "成都院子住宿9折券",
			"type":           "coupon",
			"sub_type":       "hotel",
			"merchant_id":    merchantIDs["成都院子酒店"].Hex(),
			"discount_type":  "discount",
			"discount_value": "9折",
			"min_amount":     0,
			"valid_days":     30,
			"usage_limit":    1,
			"total_limit":    500,
			"issued_count":   0,
			"used_count":     0,
			"description":    "房费9折，提前1天预订可用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/泉水住宿卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"name":           "背包十年青旅8折券",
			"type":           "coupon",
			"sub_type":       "hotel",
			"merchant_id":    merchantIDs["背包十年青年旅舍"].Hex(),
			"discount_type":  "discount",
			"discount_value": "8折",
			"min_amount":     0,
			"valid_days":     14,
			"usage_limit":    1,
			"total_limit":    500,
			"issued_count":   0,
			"used_count":     0,
			"description":    "床位8折，直接入住可用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/泉水住宿卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		// 蓝Buff 景点券
		{
			"_id":            primitive.NewObjectID(),
			"name":           "武侯祠门票8折券",
			"type":           "coupon",
			"sub_type":       "blue",
			"merchant_id":    merchantIDs["武侯祠"].Hex(),
			"discount_type":  "discount",
			"discount_value": "8折",
			"valid_days":     30,
			"usage_limit":    1,
			"total_limit":    2000,
			"issued_count":   0,
			"used_count":     0,
			"description":    "门票8折，下次入园使用",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"name":           "金沙文创兑换券",
			"type":           "exchange",
			"sub_type":       "blue",
			"merchant_id":    merchantIDs["金沙遗址博物馆"].Hex(),
			"discount_type":  "exchange",
			"discount_value": "免费兑换",
			"valid_days":     30,
			"usage_limit":    1,
			"total_limit":    1000,
			"issued_count":   0,
			"used_count":     0,
			"description":    "兑换太阳神鸟书签一枚，馆内文创店使用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/蓝buff兑换卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"name":           "熊猫文创兑换券",
			"type":           "exchange",
			"sub_type":       "blue",
			"merchant_id":    merchantIDs["大熊猫基地"].Hex(),
			"discount_type":  "exchange",
			"discount_value": "免费兑换",
			"valid_days":     30,
			"usage_limit":    1,
			"total_limit":    1500,
			"issued_count":   0,
			"used_count":     0,
			"description":    "兑换熊猫明信片一套，基地商店使用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/蓝buff兑换卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		// 电竞券
		{
			"_id":            primitive.NewObjectID(),
			"name":           "KPL周边兑换券",
			"type":           "exchange",
			"sub_type":       "esports",
			"merchant_id":    merchantIDs["量子光电竞中心"].Hex(),
			"discount_type":  "exchange",
			"discount_value": "免费兑换",
			"valid_days":     30,
			"usage_limit":    1,
			"total_limit":    500,
			"issued_count":   0,
			"used_count":     0,
			"description":    "兑换KPL限定徽章一枚，场馆商店使用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/蓝buff兑换卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"name":           "AG战队周边兑换券",
			"type":           "exchange",
			"sub_type":       "esports",
			"merchant_id":    merchantIDs["AG电竞中心"].Hex(),
			"discount_type":  "exchange",
			"discount_value": "免费兑换",
			"valid_days":     30,
			"usage_limit":    1,
			"total_limit":    500,
			"issued_count":   0,
			"used_count":     0,
			"description":    "兑换AG超玩会应援手环，场馆商店使用",
			"image":          "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/蓝buff兑换卷-removebg-preview.png",
			"status":         "active",
			"created_at":     now,
			"updated_at":     now,
		},
	}

	for _, c := range coupons {
		_, err := db.Collection("coupon_definitions").InsertOne(ctx, c)
		if err != nil {
			log.Printf("插入优惠券 %s 失败: %v", c["name"], err)
		} else {
			fmt.Printf("  ✓ 优惠券: %s\n", c["name"])
		}
	}

	fmt.Println("\n✅ 数据导入完成!")
}

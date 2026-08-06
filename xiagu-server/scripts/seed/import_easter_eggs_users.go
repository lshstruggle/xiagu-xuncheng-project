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

	db := client.Database("xiagu_xuncheng")

	// 导入彩蛋数据
	fmt.Println("导入彩蛋数据...")
	now := time.Now()
	easterEggs := []bson.M{
		{
			"_id":               primitive.NewObjectID(),
			"name":              "AG超玩会羁绊",
			"type":              "bond",
			"rarity":            "legendary",
			"trigger_condition": "与AG粉丝同时打卡",
			"longitude":         104.0625,
			"latitude":          30.6667,
			"description":       "在AG电竞中心与同为AG粉丝的玩家同时打卡，触发羁绊彩蛋",
			"reward":            "获得AG限定徽章+双倍羁绊值",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "李白醉酒诗",
			"type":              "checkin",
			"rarity":            "epic",
			"trigger_condition": "在杜甫草堂连续打卡3天",
			"longitude":         104.0285,
			"latitude":          30.6594,
			"description":       "在杜甫草堂连续打卡3天，触发李白醉酒诗彩蛋",
			"reward":            "获得李白限定皮肤+诗酒徽章",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "三顾茅庐",
			"type":              "collection",
			"rarity":            "epic",
			"trigger_condition": "集齐武侯祠所有书签",
			"longitude":         104.0443,
			"latitude":          30.6424,
			"description":       "集齐武侯祠所有书签，触发三顾茅庐彩蛋",
			"reward":            "获得诸葛亮限定皮肤+谋略徽章",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "熊猫守护者",
			"type":              "special",
			"rarity":            "rare",
			"trigger_condition": "在大熊猫基地拍照打卡",
			"longitude":         104.1463,
			"latitude":          30.7336,
			"description":       "在大熊猫基地拍照打卡，触发熊猫守护者彩蛋",
			"reward":            "获得熊猫限定徽章+竹子道具",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "金沙探秘",
			"type":              "checkin",
			"rarity":            "rare",
			"trigger_condition": "在金沙遗址博物馆打卡",
			"longitude":         104.0115,
			"latitude":          30.6828,
			"description":       "在金沙遗址博物馆打卡，触发金沙探秘彩蛋",
			"reward":            "获得太阳神鸟徽章+古蜀文化皮肤",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "宽窄守护者",
			"type":              "checkin",
			"rarity":            "common",
			"trigger_condition": "在宽窄巷子打卡",
			"longitude":         104.0556,
			"latitude":          30.6698,
			"description":       "在宽窄巷子打卡，触发宽窄守护者彩蛋",
			"reward":            "获得宽窄徽章+老成都皮肤",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
	}

	for _, egg := range easterEggs {
		_, err := db.Collection("easter_eggs").InsertOne(ctx, egg)
		if err != nil {
			log.Printf("插入彩蛋 %s 失败: %v", egg["name"], err)
		} else {
			fmt.Printf("  ✓ 彩蛋: %s\n", egg["name"])
		}
	}

	// 导入用户数据
	fmt.Println("\n导入用户数据...")
	users := []bson.M{
		{
			"_id":            primitive.NewObjectID(),
			"nickname":       "峡谷探险家",
			"avatar":         "",
			"current_hero_id": "li_bai",
			"hero_bonds": bson.M{
				"li_bai": bson.M{"bond_value": 850, "bond_level": 5},
				"zhugeliang": bson.M{"bond_value": 620, "bond_level": 4},
			},
			"badges":         []string{"三顾茅庐", "熊猫守护者"},
			"total_steps":    12580,
			"total_distance": 8540.5,
			"created_at":     now.AddDate(0, -2, 0),
			"last_login_at":  now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"nickname":       "成都吃货",
			"avatar":         "",
			"current_hero_id": "luban",
			"hero_bonds": bson.M{
				"luban": bson.M{"bond_value": 720, "bond_level": 4},
			},
			"badges":         []string{"宽窄守护者"},
			"total_steps":    8560,
			"total_distance": 5230.2,
			"created_at":     now.AddDate(0, -1, -15),
			"last_login_at":  now.AddDate(0, 0, -1),
		},
		{
			"_id":            primitive.NewObjectID(),
			"nickname":       "电竞少年",
			"avatar":         "",
			"current_hero_id": "li_bai",
			"hero_bonds": bson.M{
				"li_bai": bson.M{"bond_value": 450, "bond_level": 3},
				"zhugeliang": bson.M{"bond_value": 380, "bond_level": 2},
			},
			"badges":         []string{"AG超玩会羁绊"},
			"total_steps":    15230,
			"total_distance": 10250.8,
			"created_at":     now.AddDate(0, -3, 0),
			"last_login_at":  now,
		},
		{
			"_id":            primitive.NewObjectID(),
			"nickname":       "文化旅人",
			"avatar":         "",
			"current_hero_id": "zhugeliang",
			"hero_bonds": bson.M{
				"zhugeliang": bson.M{"bond_value": 920, "bond_level": 6},
			},
			"badges":         []string{"金沙探秘", "李白醉酒诗"},
			"total_steps":    22350,
			"total_distance": 15680.3,
			"created_at":     now.AddDate(0, -4, 0),
			"last_login_at":  now.AddDate(0, 0, -2),
		},
		{
			"_id":            primitive.NewObjectID(),
			"nickname":       "新手玩家",
			"avatar":         "",
			"current_hero_id": "li_bai",
			"hero_bonds": bson.M{
				"li_bai": bson.M{"bond_value": 120, "bond_level": 1},
			},
			"badges":         []string{},
			"total_steps":    1250,
			"total_distance": 850.0,
			"created_at":     now.AddDate(0, 0, -7),
			"last_login_at":  now,
		},
	}

	for _, user := range users {
		_, err := db.Collection("users").InsertOne(ctx, user)
		if err != nil {
			log.Printf("插入用户 %s 失败: %v", user["nickname"], err)
		} else {
			fmt.Printf("  ✓ 用户: %s\n", user["nickname"])
		}
	}

	fmt.Println("\n✅ 数据导入完成!")
}

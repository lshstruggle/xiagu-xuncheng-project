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
	coll := db.Collection("easter_eggs")

	// 删除所有索引（除了 _id）
	fmt.Println("删除旧索引...")
	indexes, _ := coll.Indexes().List(ctx)
	for indexes.Next(ctx) {
		var idx bson.M
		indexes.Decode(&idx)
		name, _ := idx["name"].(string)
		if name != "_id_" && name != "" {
			coll.Indexes().DropOne(ctx, name)
			fmt.Printf("  删除索引: %s\n", name)
		}
	}

	// 清空数据
	fmt.Println("清空彩蛋数据...")
	coll.DeleteMany(ctx, bson.M{})

	// 导入彩蛋数据
	fmt.Println("导入真实彩蛋数据...")
	now := time.Now()

	easterEggs := []bson.M{
		{
			"_id":               primitive.NewObjectID(),
			"name":              "啊——将军",
			"type":              "player_trace",
			"rarity":            "common",
			"longitude":         104.0790,
			"latitude":          30.6590,
			"trigger_condition": "宽窄巷子方向路口打卡",
			"description":       "几位以冷静著称的选手来这一带做直播任务，其中一位被掏耳朵时惊叫出声，与赛场形象形成巨大反差，成为经典表情包。",
			"reward":            "获得表情包书签+掏耳朵体验券",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "茶馆军师",
			"type":              "player_trace",
			"rarity":            "rare",
			"longitude":         104.0835,
			"latitude":          30.6555,
			"trigger_condition": "太古里东南侧茶馆附近打卡",
			"description":       "一位教练喜欢带选手来茶馆聊天，不看录像不谈战术，只谈心态。",
			"reward":            "获得盖碗茶书签+心态大师徽章",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "无名少年们的街",
			"type":              "player_trace",
			"rarity":            "epic",
			"longitude":         104.0817,
			"latitude":          30.6572,
			"trigger_condition": "春熙路步行街中心打卡",
			"description":       "几年前一群追梦少年从全国各地来到成都，训练结束后在这条街上做普通人。后来他们成为冠军。",
			"reward":            "获得少年合影书签+银龙军团徽章",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "银色灯海",
			"type":              "spirit_beacon",
			"rarity":            "legendary",
			"longitude":         104.0800,
			"latitude":          30.6548,
			"trigger_condition": "赛事场馆附近打卡",
			"description":       "银色应援灯海从看台蔓延到场外，决胜局年轻打野孤注一掷的切入赌赢了比赛。",
			"reward":            "获得赛事门票书签+孤注一掷徽章",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "心怀荣耀·AG精神图腾",
			"type":              "team_spirit",
			"rarity":            "epic",
			"longitude":         104.0650,
			"latitude":          30.6580,
			"trigger_condition": "首次打卡任意POI时触发",
			"description":       "2019年AG跌入谷底，2023年挑战者杯宣告回归。Cat历经五年从被喷上热搜到捧起冠军奖杯。",
			"reward":            "获得AG队徽书签+心怀荣耀徽章",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "一诺千金·少年成长记",
			"type":              "player_spirit",
			"rarity":            "rare",
			"longitude":         104.0823,
			"latitude":          30.6574,
			"trigger_condition": "春熙路/IFS商圈打卡时触发",
			"description":       "一诺从激进射手成长为团队核心，数千次训练赛的走位调整，见证了一个少年的蜕变。",
			"reward":            "获得一诺成长书签+少年成长徽章",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
		{
			"_id":               primitive.NewObjectID(),
			"name":              "意生意世·最强中野羁绊",
			"type":              "player_bond",
			"rarity":            "legendary",
			"longitude":         104.0700,
			"latitude":          30.6600,
			"trigger_condition": "两个用户1小时内先后打卡同一地点",
			"description":       "长生与钟意2023年立下誓言：成为联盟最强中野。2025春决共同捧起奖杯。",
			"reward":            "获得意生意世书签+最强中野徽章",
			"status":            "active",
			"created_at":        now,
			"updated_at":        now,
		},
	}

	for _, egg := range easterEggs {
		_, err := coll.InsertOne(ctx, egg)
		if err != nil {
			log.Printf("插入彩蛋 %s 失败: %v", egg["name"], err)
		} else {
			fmt.Printf("  ✓ 彩蛋: %s\n", egg["name"])
		}
	}

	fmt.Println("\n✅ 彩蛋数据导入完成!")
	fmt.Printf("共导入 %d 个彩蛋\n", len(easterEggs))
}

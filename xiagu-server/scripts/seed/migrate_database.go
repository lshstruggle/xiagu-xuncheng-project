package main

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/bson"
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

	sourceDB := client.Database("xiagu")
	targetDB := client.Database("xiagu_xuncheng")

	// 需要迁移的集合列表
	collections := []string{
		"pois",
		"routes",
		"merchants",
		"coupon_definitions",
		"user_coupons",
		"easter_eggs",
		"users",
		"checkins",
		"memory_tts",
	}

	fmt.Println("开始数据迁移: xiagu -> xiagu_xuncheng")
	fmt.Println("========================================")

	for _, collName := range collections {
		sourceColl := sourceDB.Collection(collName)
		targetColl := targetDB.Collection(collName)

		// 清空目标集合
		_, err := targetColl.DeleteMany(ctx, bson.M{})
		if err != nil {
			log.Printf("清空目标集合 %s 失败: %v", collName, err)
			continue
		}

		// 查询源数据
		cursor, err := sourceColl.Find(ctx, bson.M{})
		if err != nil {
			log.Printf("查询源集合 %s 失败: %v", collName, err)
			continue
		}

		// 读取所有文档
		var documents []bson.M
		if err := cursor.All(ctx, &documents); err != nil {
			log.Printf("解析源集合 %s 失败: %v", collName, err)
			cursor.Close(ctx)
			continue
		}
		cursor.Close(ctx)

		if len(documents) == 0 {
			fmt.Printf("  ⏭️  %s: 无数据\n", collName)
			continue
		}

		// 插入目标集合
		docs := make([]interface{}, len(documents))
		for i, doc := range documents {
			docs[i] = doc
		}

		_, err = targetColl.InsertMany(ctx, docs)
		if err != nil {
			log.Printf("插入目标集合 %s 失败: %v", collName, err)
			continue
		}

		fmt.Printf("  ✓ %s: 迁移 %d 条数据\n", collName, len(documents))
	}

	fmt.Println("\n✅ 数据迁移完成!")
	fmt.Println("\n注意: 请修改后端代码中的数据库名称:")
	fmt.Println("  xiagu-server/internal/config/config.go 或 main.go")
	fmt.Println("  将 'xiagu' 改为 'xiagu_xuncheng'")
}

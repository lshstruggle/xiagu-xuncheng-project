package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/model"
	"xiagu-server/internal/rewardconfig"
)

const MONGO_URI = "mongodb://localhost:27017"
const DB_NAME = "xiagu_xuncheng"

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(MONGO_URI))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	db := client.Database(DB_NAME)

	fmt.Println("╔══════════════════════════════════════╗")
	fmt.Println("║  峡谷寻城记 - 种子数据导入            ║")
	fmt.Println("╚══════════════════════════════════════╝")

	// 1. 创建索引
	createIndexes(ctx, db)

	// 2. 导入POI
	seedPOIs(ctx, db)

	// 3. 导入路线
	seedRoutes(ctx, db)

	fmt.Println("\n✅ 种子数据导入完成！")
}

func createIndexes(ctx context.Context, db *mongo.Database) {
	fmt.Println("\n[1/3] 创建索引...")

	// users
	db.Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "openid", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// pois - 地理空间索引（核心）
	db.Collection("pois").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "location", Value: "2dsphere"}}},
		{Keys: bson.D{
			{Key: "city_code", Value: 1},
			{Key: "type", Value: 1},
			{Key: "status", Value: 1},
		}},
	})

	// checkins
	db.Collection("checkins").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "user_id", Value: 1},
			{Key: "poi_id", Value: 1},
			{Key: "checkin_at", Value: -1},
		},
	})

	// ai_sessions - TTL索引
	db.Collection("ai_sessions").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "expires_at", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(0),
	})

	fmt.Println("  ✅ 索引创建完成")
}

func seedPOIs(ctx context.Context, db *mongo.Database) {
	fmt.Println("\n[2/3] 导入成都POI数据...")

	coll := db.Collection("pois")

	// 先清空
	coll.DeleteMany(ctx, bson.M{"city_code": "CD"})

	pois := []interface{}{
		// ===== 蓝Buff（文化景点）=====
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "武侯祠",
			"type":           "blue_buff",
			"category":       "历史文化",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0479, 30.6461}},
			"trigger_radius": 80,
			"description":    "中国唯一的君臣合祀祠庙，纪念诸葛亮与刘备的千古佳话。",
			"images":         bson.A{"wuhouci.jpg"},
			"hero_narrations": bson.M{
				"libai": "遥想诸葛丞相，运筹帷幄，何异于峡谷军师？此处柏森森，清幽宜人。",
			},
			"rewards":    bson.M{"bond_value": 20, "items": bson.A{bson.M{"type": "knowledge_card", "id": "kc_wuhouci", "name": "武侯祠历史卡"}}},
			"status":     "active",
			"priority":   90,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "杜甫草堂",
			"type":           "blue_buff",
			"category":       "历史文化",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0345, 30.6627}},
			"trigger_radius": 80,
			"description":    "唐代大诗人杜甫流寓成都时的故居，现为博物馆。",
			"images":         bson.A{"caotang.jpg"},
			"hero_narrations": bson.M{
				"libai": "杜子美虽非我知己，但其诗文厚重，令人敬佩。这草堂虽简，却是诗意栖居之所。",
			},
			"rewards":    bson.M{"bond_value": 20},
			"status":     "active",
			"priority":   85,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "宽窄巷子",
			"type":           "blue_buff",
			"category":       "历史街区",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0554, 30.6697}},
			"trigger_radius": 100,
			"description":    "清代少城兵丁遗留的古街道，由宽巷子、窄巷子、井巷子组成。",
			"images":         bson.A{"kuanzhai.jpg"},
			"hero_narrations": bson.M{
				"libai": "此处巷陌纵横，颇似峡谷草丛，宜伏击，亦宜品茗！",
			},
			"rewards":    bson.M{"bond_value": 15},
			"status":     "active",
			"priority":   95,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "金沙遗址博物馆",
			"type":           "blue_buff",
			"category":       "历史文化",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0136, 30.6825}},
			"trigger_radius": 80,
			"description":    "古蜀文明的重要考古遗址，太阳神鸟金饰的出土地。",
			"images":         bson.A{"jinsha.jpg"},
			"hero_narrations": bson.M{
				"libai": "太阳神鸟翱翔三千年，这等气魄，不输我峡谷青莲剑仙！",
			},
			"rewards":    bson.M{"bond_value": 25},
			"status":     "active",
			"priority":   80,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},

		// ===== 红Buff（美食/商户）=====
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "龙抄手总店",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0658, 30.6579}},
			"trigger_radius": 60,
			"description":    "成都百年老字号，招牌龙抄手皮薄馅嫩。",
			"images":         bson.A{"longchaoshou.jpg"},
			"hero_narrations": bson.M{
				"libai": "红buff已拿！这抄手皮薄如蝉翼，入口即化，痛快！",
			},
			"rewards":    bson.M{"bond_value": 10},
			"status":     "active",
			"priority":   70,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "小龙坎火锅",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0530, 30.6710}},
			"trigger_radius": 60,
			"description":    "成都本土火锅品牌，麻辣鲜香。",
			"images":         bson.A{"xiaolongkan.jpg"},
			"hero_narrations": bson.M{
				"libai": "锅沸如黄河之水天上来，辣得我都要舞剑助兴！哈哈哈！",
			},
			"rewards":    bson.M{"bond_value": 10},
			"status":     "active",
			"priority":   75,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "钟水饺",
			"type":           "red_buff",
			"category":       "美食",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0620, 30.6550}},
			"trigger_radius": 60,
			"description":    "成都名小吃，红油水饺麻辣鲜美。",
			"images":         bson.A{"zhongshuijiao.jpg"},
			"hero_narrations": bson.M{
				"libai": "好酒好肉之外，还需美食相佐。这水饺甚妙！",
			},
			"rewards":    bson.M{"bond_value": 10},
			"status":     "active",
			"priority":   65,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},

		// ===== 防御塔（地标挑战）=====
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "锦里古街牌坊",
			"type":           "tower",
			"category":       "地标",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0485, 30.6450}},
			"trigger_radius": 80,
			"description":    "锦里古街入口牌坊，成都最具代表性的文化地标之一。",
			"images":         bson.A{"jinli.jpg"},
			"hero_narrations": bson.M{
				"libai": "推塔！成都的高地，已被你我征服！此情此景，当浮一大白！",
			},
			"rewards":    bson.M{"bond_value": 30},
			"status":     "active",
			"priority":   88,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "春熙路太古里",
			"type":           "tower",
			"category":       "地标",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0817, 30.6571}},
			"trigger_radius": 100,
			"description":    "成都最繁华的商业中心，古今交融的城市地标。",
			"images":         bson.A{"chunxilu.jpg"},
			"hero_narrations": bson.M{
				"libai": "哈哈哈，又下一塔！这人间烟火，比峡谷还热闹！",
			},
			"rewards":    bson.M{"bond_value": 30},
			"status":     "active",
			"priority":   92,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},

		// ===== 荣耀灯塔（赛事精神）=====
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "成都大魔方",
			"type":           "spirit_lighthouse",
			"category":       "赛事场馆",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0668, 30.5728}},
			"trigger_radius": 100,
			"description":    "KPL总决赛举办场馆，见证了无数电竞传奇。",
			"images":         bson.A{"damofang.jpg"},
			"hero_narrations": bson.M{
				"libai": "前方那座建筑，两年前的秋天，总决赛就在这里上演。",
			},
			"rewards": bson.M{"bond_value": 50},
			"spirit_event": bson.M{
				"event_name":     "2023 KPL秋季赛总决赛",
				"year":           2023,
				"spirit_keyword": "逆风翻盘",
				"badge_id":       "badge_comeback",
				"hero_narration": bson.M{
					"libai": "前方那座建筑，两年前的秋天，总决赛就在这里上演。年轻的射手在最后一波选择了孤注一掷的切入，赌上了一切。他赢了。那一刻，这座城市的夜空，比长安的灯火还要璀璨。",
				},
				"easter_egg": bson.M{
					"question": "假如你是那场决赛的指挥，最后一波团战，你会选择正面开团还是偷家？",
					"options":  bson.A{"正面开团", "偷家"},
					"follow_up": bson.M{
						"正面开团": "有意思。当时的指挥也选择了正面硬刚。他说——'我的队友值得我赌这一把。'信任，才是最强的装备。",
						"偷家":   "另辟蹊径，也是一种胆识。不过那场比赛，他们选择了正面迎战。有时候，最难的路反而是最对的路。",
					},
				},
			},
			"status":     "active",
			"priority":   100,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},

		// ===== 选手足迹（选手羁绊）=====
		bson.M{
			"_id":            primitive.NewObjectID(),
			"city_code":      "CD",
			"name":           "AG超玩会·春熙路记忆",
			"type":           "player_footprint",
			"category":       "选手足迹",
			"location":       bson.M{"type": "Point", "coordinates": bson.A{104.0800, 30.6560}},
			"trigger_radius": 80,
			"description":    "AG超玩会早期训练基地附近。",
			"images":         bson.A{"ag_footprint.jpg"},
			"hero_narrations": bson.M{
				"libai": "这一带啊，我听说过一个故事...",
			},
			"rewards": bson.M{"bond_value": 30},
			"player_bond": bson.M{
				"team_name":    "AG超玩会",
				"era":          "2018-2019",
				"story":        "几年前，有五个少年挤在这附近的一间小屋子里，每天训练十几个小时。没有粉丝，没有灯光，只有彼此。",
				"quote":        "我们不是天才，我们只是没有退路。",
				"quote_source": "灵感来源于电竞赛事公开报道",
				"hero_narration": bson.M{
					"libai": "这一带啊…我听说过一个故事。几年前，有五个少年挤在这附近的一间小屋子里，每天训练十几个小时。没有粉丝，没有灯光，只有彼此。后来他们站上了最大的舞台，台下的欢呼震得我在峡谷都听到了。他们的队长后来说过一句话——'我们不是天才，我们只是没有退路。'……你尝尝这家店的担担面，据说他们以前常来。",
				},
				"bookmark_id": "bookmark_ag_chengdu",
			},
			"status":     "active",
			"priority":   98,
			"created_at": time.Now(),
			"updated_at": time.Now(),
		},
	}

	for _, document := range pois {
		poi := document.(bson.M)
		fragments, ok := rewardconfig.DefaultFragments(
			model.POIType(poi["type"].(string)),
		)
		if !ok {
			log.Fatalf("POI %q has unsupported type %q", poi["name"], poi["type"])
		}
		rewards, ok := poi["rewards"].(bson.M)
		if !ok {
			rewards = bson.M{}
			poi["rewards"] = rewards
		}
		rewards["fragments"] = fragments
	}

	result, err := coll.InsertMany(ctx, pois)
	if err != nil {
		log.Printf("POI导入错误: %v", err)
	} else {
		fmt.Printf("  ✅ 导入 %d 个POI\n", len(result.InsertedIDs))
	}

	// 打印POI概览
	fmt.Println("\n  POI概览:")
	for _, p := range pois {
		m := p.(bson.M)
		fmt.Printf("    [%s] %s (%s)\n", m["type"], m["name"], m["category"])
	}
}

func seedRoutes(ctx context.Context, db *mongo.Database) {
	fmt.Println("\n[3/3] 导入推荐路线...")

	coll := db.Collection("routes")
	coll.DeleteMany(ctx, bson.M{"city_code": "CD"})

	routes := []interface{}{
		bson.M{
			"_id":                     primitive.NewObjectID(),
			"city_code":               "CD",
			"name":                    "蜀道行·成都一日",
			"description":             "从武侯祠到春熙路，一天走遍成都精华景点",
			"duration":                "约6小时",
			"difficulty":              "normal",
			"distance":                12000,
			"poi_sequence":            bson.A{}, // 实际使用时填入POI ID
			"tags":                    bson.A{"历史文化", "美食", "地标"},
			"spirit_lighthouse_count": 1,
			"player_footprint_count":  1,
			"recommended_heroes":      bson.A{"libai"},
			"cover_image":             "route_chengdu_1.jpg",
			"status":                  "active",
		},
		bson.M{
			"_id":                     primitive.NewObjectID(),
			"city_code":               "CD",
			"name":                    "锦城美食探索",
			"description":             "成都美食打卡之旅，从早吃到晚",
			"duration":                "约4小时",
			"difficulty":              "easy",
			"distance":                6000,
			"poi_sequence":            bson.A{},
			"tags":                    bson.A{"美食"},
			"spirit_lighthouse_count": 0,
			"player_footprint_count":  0,
			"recommended_heroes":      bson.A{"libai"},
			"cover_image":             "route_chengdu_2.jpg",
			"status":                  "active",
		},
	}

	result, err := coll.InsertMany(ctx, routes)
	if err != nil {
		log.Printf("路线导入错误: %v", err)
	} else {
		fmt.Printf("  ✅ 导入 %d 条路线\n", len(result.InsertedIDs))
	}
}

// 辅助函数
func toJSON(v interface{}) string {
	b, _ := json.MarshalIndent(v, "", "  ")
	return string(b)
}

package main

import (
	"context"
	"flag"
	"log"
	"os"
	"slices"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"xiagu-server/internal/config"
	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
	"xiagu-server/internal/rewardconfig"
)

var poiCodes = map[string]string{
	"禅驿·锦官里": "cd_chanyi_jingguanli", "盈嘉･云曦天际S酒店": "cd_yingjia_yunxi",
	"栖牛·自助投影民宿": "cd_qiniu_homestay", "凡间精品民宿": "cd_fanjian_homestay",
	"果然24房": "cd_guoran_24", "背包十年青年旅舍": "cd_backpack_ten_years",
	"融舍·村里民宿": "cd_rongshe_homestay", "都江堰水利工程": "cd_dujiangyan",
	"青城山（前山）": "cd_qingchengshan", "成都大熊猫繁育研究基地": "cd_panda_base",
	"马路边边麻辣烫": "cd_malubianbian", "成都AG超玩会": "cd_ag_club",
	"凤凰山体育公园": "cd_fenghuangshan",
	"武侯祠":     "cd_wuhouci", "金沙遗址": "cd_jinsha", "量子光电竞中心": "cd_quantum_arena",
	"AG电竞中心": "cd_ag_center", "贺记蛋烘糕": "cd_heji", "洞子口张老二凉粉": "cd_zhanglaoer",
	"明婷饭店": "cd_mingting", "陈麻婆豆腐": "cd_chenmapo", "乐山钵钵鸡": "cd_boboji",
	"锦里古街": "cd_jinli", "沈堂甜水面": "cd_shentang", "吼堂老火锅": "cd_houtang",
	"西月城潭豆花": "cd_tandouhua", "小妹蹄花": "cd_xiaomei", "成都院子酒店": "cd_chengduyuanzi",
	"文殊院": "cd_wenshuyuan", "春熙路/太古里": "cd_chunxi_taikooli", "宽窄巷子": "cd_kuanzhai",
	"杜甫草堂": "cd_dufucaotang",
}

type frontendPOIDefinition struct {
	MarkerID    string
	Code        string
	Name        string
	Type        model.POIType
	Category    string
	Description string
	Latitude    float64
	Longitude   float64
	Radius      int
	BondValue   int
}

var missingFrontendPOIs = []frontendPOIDefinition{
	{"1", "cd_chanyi_jingguanli", "禅驿·锦官里", model.POIBlueBuff, "住宿", "融合东方禅意与现代设计的城市住宿空间", 30.6575, 104.0820, 80, 20},
	{"2", "cd_yingjia_yunxi", "盈嘉･云曦天际S酒店", model.POIBlueBuff, "住宿", "太古里商圈高空景观设计酒店", 30.6550, 104.0845, 80, 20},
	{"3", "cd_qiniu_homestay", "栖牛·自助投影民宿", model.POIBlueBuff, "住宿", "东安湖附近的影音主题自助民宿", 30.6245, 104.2185, 80, 20},
	{"4", "cd_fanjian_homestay", "凡间精品民宿", model.POIRedBuff, "住宿", "文殊院附近的精品民宿", 30.6745, 104.0650, 80, 15},
	{"5", "cd_guoran_24", "果然24房", model.POIRedBuff, "住宿", "东郊记忆内的工业复古主题酒店", 30.6715, 104.1025, 80, 15},
	{"7", "cd_backpack_ten_years", "背包十年青年旅舍", model.POISpiritLighthouse, "住宿", "面向年轻旅行者的城市青年旅舍", 30.6585, 104.0880, 100, 30},
	{"8", "cd_rongshe_homestay", "融舍·村里民宿", model.POISpiritLighthouse, "住宿", "融合成都市井烟火与现代慢生活的院落民宿", 30.6680, 104.0550, 100, 30},
	{"11", "cd_dujiangyan", "都江堰水利工程", model.POIBlueBuff, "历史文化", "延续两千余年的无坝引水水利工程", 30.9980, 103.6180, 100, 25},
	{"12", "cd_qingchengshan", "青城山（前山）", model.POIBlueBuff, "自然文化", "以青城天下幽著称的道教文化名山", 30.9080, 103.5620, 100, 25},
	{"13", "cd_panda_base", "成都大熊猫繁育研究基地", model.POIBlueBuff, "动物保护", "大熊猫科研保护与公众教育基地", 30.7350, 104.1470, 100, 25},
	{"23", "cd_malubianbian", "马路边边麻辣烫", model.POIRedBuff, "美食", "还原老成都街边风味的串串香店", 30.6480, 104.0880, 80, 15},
	{"29", "cd_ag_club", "成都AG超玩会", model.POIClub, "电竞俱乐部", "成都AG超玩会俱乐部城市文化点位", 30.5400, 104.0600, 100, 25},
	{"30", "cd_fenghuangshan", "凤凰山体育公园", model.POIArena, "电竞场馆", "王者荣耀世界冠军杯总决赛举办场馆", 30.7500, 104.0700, 100, 30},
}

type routeIdentity struct {
	Code     string
	POICodes []string
}

var routeIdentities = map[string]routeIdentity{
	"宽窄巷子探秘": {"cd_route_kuanzhai", []string{"cd_kuanzhai", "cd_chengduyuanzi", "cd_heji", "cd_zhanglaoer", "cd_wenshuyuan", "cd_mingting", "cd_chenmapo", "cd_boboji"}},
	"锦里古街漫游": {"cd_route_jinli", []string{"cd_jinli", "cd_wuhouci", "cd_dufucaotang", "cd_shentang", "cd_ag_center", "cd_jinsha"}},
	"太古里巡礼":  {"cd_route_taikooli", []string{"cd_chunxi_taikooli", "cd_houtang", "cd_tandouhua", "cd_quantum_arena", "cd_xiaomei"}},
}

func main() {
	dryRun := flag.Bool("dry-run", false, "show changes without writing")
	flag.Parse()
	path, err := config.ResolveRuntimeConfigPath(os.Getenv("CONFIG_PATH"), "configs/config.yaml")
	if err != nil {
		log.Fatal(err)
	}
	if err := config.Load(path); err != nil {
		log.Fatal(err)
	}
	cfg := config.C
	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: cfg.CloudBaseDatabase.EnvironmentID, Instance: cfg.CloudBaseDatabase.Instance,
		Database: cfg.CloudBaseDatabase.Database, BaseURL: cfg.CloudBaseDatabase.BaseURL,
		Timeout: cfg.CloudBaseDatabase.Timeout,
	}, database.StaticToken(cfg.CloudBaseDatabase.APIKey))
	if err != nil {
		log.Fatal(err)
	}
	collections := database.NewCollections(client, cfg.CloudBaseDatabase.CollectionPrefix)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	poiInserted := ensureMissingFrontendPOIs(ctx, collections.Collection("pois"), *dryRun)
	poiUpdated := backfillPOIs(ctx, collections.Collection("pois"), *dryRun)
	routeUpdated := backfillRoutes(ctx, collections.Collection("routes"), *dryRun)
	log.Printf("content identity backfill completed: inserted=%d pois=%d routes=%d dry_run=%t", poiInserted, poiUpdated, routeUpdated, *dryRun)
}

func ensureMissingFrontendPOIs(ctx context.Context, collection *database.Collection, dryRun bool) int {
	inserted := 0
	for _, definition := range missingFrontendPOIs {
		count, err := collection.CountDocuments(ctx, bson.M{"poi_code": definition.Code})
		if err != nil {
			log.Fatalf("check POI %q: %v", definition.Name, err)
		}
		if count > 0 {
			continue
		}
		fragments, ok := rewardconfig.DefaultFragments(definition.Type)
		if !ok {
			log.Fatalf("missing reward defaults for POI type %q", definition.Type)
		}
		log.Printf("insert missing frontend POI %q: marker_id=%s poi_code=%s", definition.Name, definition.MarkerID, definition.Code)
		inserted++
		if dryRun {
			continue
		}
		_, err = collection.InsertOne(ctx, &model.POI{
			ID: primitive.NewObjectID(), POICode: definition.Code, CityCode: "CD",
			Name: definition.Name, Type: definition.Type, Category: definition.Category,
			Location:      model.GeoPoint{Type: "Point", Coordinates: []float64{definition.Longitude, definition.Latitude}},
			TriggerRadius: definition.Radius, Description: definition.Description,
			Images: []string{}, HeroNarrations: map[string]string{},
			Rewards: &model.POIReward{BondValue: definition.BondValue, Items: []model.RewardItem{}, Fragments: &fragments},
			Status:  "active", CreatedAt: time.Now(), UpdatedAt: time.Now(),
		})
		if err != nil {
			log.Fatalf("insert POI %q: %v", definition.Name, err)
		}
	}
	return inserted
}

func backfillPOIs(ctx context.Context, collection *database.Collection, dryRun bool) int {
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		log.Fatalf("list POIs: %v", err)
	}
	defer cursor.Close(ctx)
	var pois []model.POI
	if err := cursor.All(ctx, &pois); err != nil {
		log.Fatalf("decode POIs: %v", err)
	}
	updated := 0
	for _, poi := range pois {
		code, ok := poiCodes[poi.Name]
		if !ok {
			log.Fatalf("missing stable code for POI %q", poi.Name)
		}
		if poi.POICode == code {
			continue
		}
		log.Printf("configure POI %q: poi_code=%s", poi.Name, code)
		if !dryRun {
			if _, err := collection.UpdateOne(ctx, bson.M{"_id": poi.ID}, bson.M{"$set": bson.M{"poi_code": code, "updated_at": time.Now()}}); err != nil {
				log.Fatal(err)
			}
		}
		updated++
	}
	return updated
}

func backfillRoutes(ctx context.Context, collection *database.Collection, dryRun bool) int {
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		log.Fatalf("list routes: %v", err)
	}
	defer cursor.Close(ctx)
	var routes []model.Route
	if err := cursor.All(ctx, &routes); err != nil {
		log.Fatalf("decode routes: %v", err)
	}
	updated := 0
	for _, route := range routes {
		identity, ok := routeIdentities[route.Name]
		if !ok {
			log.Fatalf("missing stable identity for route %q", route.Name)
		}
		if route.RouteCode == identity.Code && slices.Equal(route.POISequence, identity.POICodes) {
			continue
		}
		log.Printf("configure route %q: route_code=%s pois=%d", route.Name, identity.Code, len(identity.POICodes))
		if !dryRun {
			if _, err := collection.UpdateOne(ctx, bson.M{"_id": route.ID}, bson.M{"$set": bson.M{"route_code": identity.Code, "poi_sequence": identity.POICodes}}); err != nil {
				log.Fatal(err)
			}
		}
		updated++
	}
	return updated
}

package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

type POIRepo struct {
	coll *database.Collection
}

// legacyMapMarkerPOICodes keeps the already-published mini-program's numeric
// map marker IDs compatible with the server-authoritative POI records. New
// clients should send poi_code or the MongoDB object ID.
var legacyMapMarkerPOICodes = map[string]string{
	"1":  "cd_chanyi_jingguanli",
	"2":  "cd_yingjia_yunxi",
	"3":  "cd_qiniu_homestay",
	"4":  "cd_fanjian_homestay",
	"5":  "cd_guoran_24",
	"6":  "cd_chengduyuanzi",
	"7":  "cd_backpack_ten_years",
	"8":  "cd_rongshe_homestay",
	"9":  "cd_wuhouci",
	"10": "cd_jinsha",
	"11": "cd_dujiangyan",
	"12": "cd_qingchengshan",
	"13": "cd_panda_base",
	"14": "cd_mingting",
	"15": "cd_zhanglaoer",
	"16": "cd_chenmapo",
	"17": "cd_boboji",
	"18": "cd_houtang",
	"19": "cd_shentang",
	"20": "cd_tandouhua",
	"21": "cd_heji",
	"22": "cd_xiaomei",
	"23": "cd_malubianbian",
	"24": "cd_jinli",
	"25": "cd_dufucaotang",
	"26": "cd_kuanzhai",
	"27": "cd_wenshuyuan",
	"28": "cd_chunxi_taikooli",
	"29": "cd_ag_club",
	"30": "cd_fenghuangshan",
	"31": "cd_quantum_arena",
	"32": "cd_ag_center",
}

func (r *POIRepo) CountActive(ctx context.Context) (int64, error) {
	return r.coll.CountDocuments(ctx, bson.M{"status": "active"})
}

func NewPOIRepo(db *database.Collections) *POIRepo {
	return &POIRepo{coll: db.Collection("pois")}
}

func (r *POIRepo) GetByID(ctx context.Context, id string) (*model.POI, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	filter := bson.M{"_id": oid}
	if err != nil {
		poiCode := id
		if legacyCode, ok := legacyMapMarkerPOICodes[id]; ok {
			poiCode = legacyCode
		}
		filter = bson.M{"poi_code": poiCode}
	}
	var poi model.POI
	err = r.coll.FindOne(ctx, filter).Decode(&poi)
	return &poi, err
}

func (r *POIRepo) GetByCity(ctx context.Context, cityCode string) ([]*model.POI, error) {
	filter := bson.M{"city_code": cityCode, "status": "active"}
	opts := options.Find().SetSort(bson.D{{Key: "priority", Value: -1}})

	cursor, err := r.coll.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var pois []*model.POI
	return pois, cursor.All(ctx, &pois)
}

func (r *POIRepo) GetNearby(ctx context.Context, lng, lat float64, maxDistM int, cityCode string) ([]*model.POI, error) {
	filter := bson.M{
		"status": "active",
		"location": bson.M{
			"$nearSphere": bson.M{
				"$geometry": bson.M{
					"type":        "Point",
					"coordinates": bson.A{lng, lat},
				},
				"$maxDistance": maxDistM,
			},
		},
	}
	if cityCode != "" {
		filter["city_code"] = cityCode
	}

	cursor, err := r.coll.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var pois []*model.POI
	return pois, cursor.All(ctx, &pois)
}

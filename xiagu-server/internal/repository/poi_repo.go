package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

type POIRepo struct {
	coll *mongo.Collection
}

func NewPOIRepo(db *database.Collections) *POIRepo {
	return &POIRepo{coll: db.Collection("pois")}
}

func (r *POIRepo) GetByID(ctx context.Context, id string) (*model.POI, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var poi model.POI
	err = r.coll.FindOne(ctx, bson.M{"_id": oid}).Decode(&poi)
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

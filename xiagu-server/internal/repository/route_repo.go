package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"xiagu-server/internal/model"
)

type RouteRepo struct {
	coll *mongo.Collection
}

func NewRouteRepo(db *mongo.Database) *RouteRepo {
	return &RouteRepo{coll: db.Collection("routes")}
}

func (r *RouteRepo) GetByCity(ctx context.Context, cityCode string) ([]*model.Route, error) {
	cursor, err := r.coll.Find(ctx, bson.M{"city_code": cityCode, "status": "active"})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var routes []*model.Route
	return routes, cursor.All(ctx, &routes)
}

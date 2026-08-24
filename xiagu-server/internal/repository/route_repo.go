package repository

import (
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/bson"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

var ErrRouteNotFound = errors.New("route not found")

type RouteRepo struct {
	coll *database.Collection
}

func (r *RouteRepo) GetByCode(ctx context.Context, routeCode string) (*model.Route, error) {
	var route model.Route
	err := r.coll.FindOne(ctx, bson.M{"route_code": routeCode, "status": "active"}).Decode(&route)
	if errors.Is(err, database.ErrDocumentNotFound) {
		return nil, ErrRouteNotFound
	}
	return &route, err
}

func NewRouteRepo(db *database.Collections) *RouteRepo {
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

package service

import (
	"context"

	"xiagu-server/internal/config"
	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
)

type POIService struct {
	repos *repository.Repos
	cfg   *config.Config
}

func NewPOIService(repos *repository.Repos, cfg *config.Config) *POIService {
	return &POIService{repos: repos, cfg: cfg}
}

func (s *POIService) GetByCity(ctx context.Context, cityCode string) ([]*model.POI, error) {
	return s.repos.POI.GetByCity(ctx, cityCode)
}

func (s *POIService) GetNearby(ctx context.Context, lng, lat float64, cityCode string) ([]*model.POI, error) {
	return s.repos.POI.GetNearby(ctx, lng, lat, 5000, cityCode)
}

func (s *POIService) GetDetail(ctx context.Context, id string) (*model.POI, error) {
	return s.repos.POI.GetByID(ctx, id)
}

func (s *POIService) GetRoutes(ctx context.Context, cityCode string) ([]*model.Route, error) {
	return s.repos.Route.GetByCity(ctx, cityCode)
}

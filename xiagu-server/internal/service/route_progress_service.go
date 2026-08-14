package service

import (
	"context"
	"errors"

	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
)

type RouteCompletionResponse struct {
	Success      bool   `json:"success"`
	RouteCode    string `json:"route_code"`
	RequiredPOIs int    `json:"required_pois"`
}

type RouteProgressService struct{ repos *repository.Repos }

func NewRouteProgressService(repos *repository.Repos) *RouteProgressService {
	return &RouteProgressService{repos: repos}
}

func (s *RouteProgressService) Complete(
	ctx context.Context,
	userID string,
	routeCode string,
) (*RouteCompletionResponse, error) {
	route, err := s.repos.Route.GetByCode(ctx, routeCode)
	if errors.Is(err, repository.ErrRouteNotFound) {
		return nil, errcode.NotFound("路线不存在")
	}
	if err != nil {
		return nil, err
	}
	if len(route.POISequence) == 0 {
		return nil, errcode.Internal("路线尚未配置打卡顺序")
	}
	checkins, err := s.repos.Checkin.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	visited := map[string]struct{}{}
	for _, checkin := range checkins {
		code := checkin.POICode
		if code == "" && checkin.POIID != "" {
			poi, lookupErr := s.repos.POI.GetByID(ctx, checkin.POIID)
			if lookupErr != nil {
				continue
			}
			code = poi.POICode
		}
		if code != "" {
			visited[code] = struct{}{}
		}
	}
	if len(missingRequiredPOIs(route.POISequence, visited)) > 0 {
		return nil, errcode.Conflict("路线所需POI尚未全部打卡")
	}
	if err := s.repos.User.CompleteRoute(ctx, userID, route.RouteCode); err != nil {
		return nil, err
	}
	return &RouteCompletionResponse{
		Success: true, RouteCode: route.RouteCode, RequiredPOIs: len(route.POISequence),
	}, nil
}

func missingRequiredPOIs(required []string, visited map[string]struct{}) []string {
	missing := make([]string, 0)
	for _, code := range required {
		if _, ok := visited[code]; !ok {
			missing = append(missing, code)
		}
	}
	return missing
}

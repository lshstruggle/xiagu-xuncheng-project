package repository

import (
	"xiagu-server/internal/database"

	"github.com/redis/go-redis/v9"
)

type Repos struct {
	User    *UserRepo
	POI     *POIRepo
	Checkin *CheckinRepo
	Session *SessionRepo
	Route   *RouteRepo
	Cache   *CacheRepo
	DB      *database.Collections // 直接暴露DB以便服务层使用
}

func NewRepos(db *database.Collections, rdb *redis.Client) *Repos {
	return &Repos{
		User:    NewUserRepo(db),
		POI:     NewPOIRepo(db),
		Checkin: NewCheckinRepo(db),
		Session: NewSessionRepo(db),
		Route:   NewRouteRepo(db),
		Cache:   NewCacheRepo(rdb),
		DB:      db,
	}
}

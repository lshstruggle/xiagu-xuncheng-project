package repository

import (
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
)

type Repos struct {
	User    *UserRepo
	POI     *POIRepo
	Checkin *CheckinRepo
	Session *SessionRepo
	Route   *RouteRepo
	Cache   *CacheRepo
	DB      *mongo.Database // 直接暴露DB以便服务层使用
}

func NewRepos(db *mongo.Database, rdb *redis.Client) *Repos {
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

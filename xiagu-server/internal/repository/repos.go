package repository

import (
	"xiagu-server/internal/database"
)

type Repos struct {
	User    *UserRepo
	POI     *POIRepo
	Checkin *CheckinRepo
	Session *SessionRepo
	Route   *RouteRepo
	DB      *database.Collections // 直接暴露DB以便服务层使用
}

func NewRepos(db *database.Collections) *Repos {
	return &Repos{
		User:    NewUserRepo(db),
		POI:     NewPOIRepo(db),
		Checkin: NewCheckinRepo(db),
		Session: NewSessionRepo(db),
		Route:   NewRouteRepo(db),
		DB:      db,
	}
}

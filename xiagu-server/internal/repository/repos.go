package repository

import (
	"xiagu-server/internal/database"
)

type Repos struct {
	User        *UserRepo
	POI         *POIRepo
	Checkin     *CheckinRepo
	Session     *SessionRepo
	Route       *RouteRepo
	MerchOrder  *MerchOrderRepo
	AIUsage     *AIUsageRepo
	Story       *StoryRepo
	Challenge   *ChallengeRepo
	Achievement *AchievementRepo
	DB          *database.Collections // 直接暴露DB以便服务层使用
}

func NewRepos(db *database.Collections) *Repos {
	return &Repos{
		User:        NewUserRepo(db),
		POI:         NewPOIRepo(db),
		Checkin:     NewCheckinRepo(db),
		Session:     NewSessionRepo(db),
		Route:       NewRouteRepo(db),
		MerchOrder:  NewMerchOrderRepo(db),
		AIUsage:     NewAIUsageRepo(db),
		Story:       NewStoryRepo(db),
		Challenge:   NewChallengeRepo(db),
		Achievement: NewAchievementRepo(db),
		DB:          db,
	}
}

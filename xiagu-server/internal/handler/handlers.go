package handler

import (
	"xiagu-server/internal/database"
	"xiagu-server/internal/service"
)

type Handlers struct {
	User          *UserHandler
	AI            *AIHandler
	TTS           *TTSHandler
	Checkin       *CheckinHandler
	POI           *POIHandler
	EasterEgg     *EasterEggHandler
	MemoryTTS     *MemoryTTSHandler
	Shop          *ShopHandler
	Bond          *BondHandler
	Merch         *MerchHandler
	Story         *StoryHandler
	Challenge     *ChallengeHandler
	Achievement   *AchievementHandler
	RouteProgress *RouteProgressHandler
	DB            *database.Collections // 数据库实例，供admin使用
}

func NewHandlers(svcs *service.Services, db *database.Collections) *Handlers {
	return &Handlers{
		User:          &UserHandler{svcs: svcs},
		AI:            &AIHandler{svcs: svcs},
		TTS:           &TTSHandler{svcs: svcs},
		Checkin:       &CheckinHandler{svcs: svcs},
		POI:           &POIHandler{svcs: svcs},
		EasterEgg:     NewEasterEggHandler(svcs.EasterEgg),
		Shop:          NewShopHandler(svcs.Shop),
		Bond:          NewBondHandler(svcs),
		Merch:         NewMerchHandler(svcs.Merch),
		Story:         NewStoryHandler(svcs.Story),
		Challenge:     NewChallengeHandler(svcs.Challenge),
		Achievement:   NewAchievementHandler(svcs.Achievement),
		RouteProgress: NewRouteProgressHandler(svcs.RouteProgress),
		DB:            db,
	}
}

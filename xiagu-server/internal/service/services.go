package service

import (
	"xiagu-server/internal/config"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/external/sovits"
	"xiagu-server/pkg/external/wechat"
	"xiagu-server/pkg/external/yuanqi"
)

type Services struct {
	User          *UserService
	AI            *AIService
	Checkin       *CheckinService
	POI           *POIService
	EasterEgg     *EasterEggService
	Shop          *ShopService
	Merch         *MerchService
	Story         *StoryService
	Challenge     *ChallengeService
	Achievement   *AchievementService
	RouteProgress *RouteProgressService
	TTS           *TTSService
}

func NewServices(
	repos *repository.Repos,
	cfg *config.Config,
	yq *yuanqi.Client,
	wc *wechat.Auth,
	ttsClient *sovits.Client,
) (*Services, error) {
	tts := NewTTSService(cfg, ttsClient)
	return &Services{
		User:          NewUserService(repos, cfg, wc),
		TTS:           tts,
		AI:            NewAIService(repos, cfg, yq, tts),
		Checkin:       NewCheckinService(repos, cfg),
		POI:           NewPOIService(repos, cfg),
		EasterEgg:     NewEasterEggService(repos.DB),
		Shop:          NewShopService(repos),
		Merch:         NewMerchService(repos),
		Story:         NewStoryService(repos),
		Challenge:     NewChallengeService(repos),
		Achievement:   NewAchievementService(repos),
		RouteProgress: NewRouteProgressService(repos),
	}, nil
}

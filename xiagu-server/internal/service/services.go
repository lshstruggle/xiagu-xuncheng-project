package service

import (
	"xiagu-server/internal/config"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/external/wechat"
	"xiagu-server/pkg/external/yuanqi"
)

type Services struct {
	User      *UserService
	AI        *AIService
	Checkin   *CheckinService
	POI       *POIService
	EasterEgg *EasterEggService
	Shop      *ShopService
	Merch     *MerchService
}

func NewServices(
	repos *repository.Repos,
	cfg *config.Config,
	yq *yuanqi.Client,
	wc *wechat.Auth,
) (*Services, error) {

	return &Services{
		User:      NewUserService(repos, cfg, wc),
		AI:        NewAIService(repos, cfg, yq),
		Checkin:   NewCheckinService(repos, cfg),
		POI:       NewPOIService(repos, cfg),
		EasterEgg: NewEasterEggService(repos.DB),
		Shop:      NewShopService(repos),
		Merch:     NewMerchService(repos),
	}, nil
}

package service

import (
	"xiagu-server/internal/config"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/external/sovits"
	"xiagu-server/pkg/external/wechat"
	"xiagu-server/pkg/external/yuanqi"
)

type Services struct {
	User       *UserService
	AI         *AIService
	Checkin    *CheckinService
	POI        *POIService
	TTS        *TTSService
	EasterEgg  *EasterEggService
	MemoryTTS  *MemoryTTSService
	Shop       *ShopService
	Merch      *MerchService
}

func NewServices(
	repos *repository.Repos,
	cfg *config.Config,
	yq *yuanqi.Client,
	tts *sovits.Client,
	wc *wechat.Auth,
) (*Services, error) {
	// 初始化回忆模式语音服务（使用绝对路径）
	cacheDir := "/Users/lsh/服创代码/xiagu-server/tts_cache"
	memoryTTSSvc, err := NewMemoryTTSService(cacheDir)
	if err != nil {
		return nil, err
	}

	return &Services{
		User:       NewUserService(repos, cfg, wc),
		AI:         NewAIService(repos, cfg, yq, tts),
		Checkin:    NewCheckinService(repos, cfg),
		POI:        NewPOIService(repos, cfg),
		TTS:        NewTTSService(tts),
		EasterEgg:  NewEasterEggService(repos.DB),
		MemoryTTS:  memoryTTSSvc,
		Shop:       NewShopService(repos),
		Merch:      NewMerchService(repos),
	}, nil
}

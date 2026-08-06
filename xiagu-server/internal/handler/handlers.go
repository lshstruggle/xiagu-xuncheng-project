package handler

import (
	"go.mongodb.org/mongo-driver/mongo"
	"xiagu-server/internal/service"
)

type Handlers struct {
	User       *UserHandler
	AI         *AIHandler
	Checkin    *CheckinHandler
	POI        *POIHandler
	TTS        *TTSHandler
	EasterEgg  *EasterEggHandler
	MemoryTTS  *MemoryTTSHandler
	Shop       *ShopHandler
	Bond       *BondHandler
	Merch      *MerchHandler
	DB         *mongo.Database // 数据库实例，供admin使用
}

func NewHandlers(svcs *service.Services, db *mongo.Database) *Handlers {
	return &Handlers{
		User:       &UserHandler{svcs: svcs},
		AI:         &AIHandler{svcs: svcs},
		Checkin:    &CheckinHandler{svcs: svcs},
		POI:        &POIHandler{svcs: svcs},
		TTS:        &TTSHandler{svcs: svcs},
		EasterEgg:  NewEasterEggHandler(svcs.EasterEgg),
		MemoryTTS:  NewMemoryTTSHandler(svcs.MemoryTTS),
		Shop:       NewShopHandler(svcs.Shop),
		Bond:       NewBondHandler(svcs),
		Merch:      NewMerchHandler(svcs.Merch),
		DB:         db,
	}
}

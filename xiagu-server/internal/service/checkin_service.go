package service

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"xiagu-server/internal/config"
	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
	"xiagu-server/pkg/geo"
)

type CheckinService struct {
	repos *repository.Repos
	cfg   *config.Config
}

func NewCheckinService(repos *repository.Repos, cfg *config.Config) *CheckinService {
	return &CheckinService{repos: repos, cfg: cfg}
}

type CheckinReq struct {
	POIID   string  `json:"poi_id"`
	HeroID  string  `json:"hero_id"`
	UserLat float64 `json:"user_lat"`
	UserLng float64 `json:"user_lng"`
}

type AITrigger struct {
	Mode      string             `json:"mode"`
	Narration string             `json:"narration"`
	EasterEgg *model.EasterEggQA `json:"easter_egg,omitempty"`
}

type FragmentReward struct {
	HeroFragments int  `json:"hero_fragments"`
	SkinFragments int  `json:"skin_fragments"`
	IsFirstTime   bool `json:"is_first_time"`
}

type CheckinResp struct {
	Success         bool               `json:"success"`
	Rewards         []model.RewardItem `json:"rewards"`
	BondValueGained int                `json:"bond_value_gained"`
	SpiritBadgeID   string             `json:"spirit_badge_id,omitempty"`
	BondBookmarkID  string             `json:"bond_bookmark_id,omitempty"`
	AITrigger       *AITrigger         `json:"ai_trigger,omitempty"`
	Fragments       *FragmentReward    `json:"fragments,omitempty"`
	Message         string             `json:"message"`
}

// 碎片奖励配置表（按 POI Type 映射）
// 返回 [英雄碎片min, 英雄碎片max, 皮肤碎片min, 皮肤碎片max]
var fragmentMap = map[model.POIType][4]int{
	model.POIBlueBuff:         {2, 3, 1, 1},   // ★ 普通
	model.POIRedBuff:          {3, 5, 1, 2},   // ★★ 中等
	model.POITower:            {5, 8, 2, 3},   // ★★★ 高级
	model.POIPlayerFootprint:  {5, 8, 2, 3},   // ★★★ 特殊
	model.POISpiritLighthouse: {8, 15, 3, 5},  // ★★★★★ 稀有
}

// 计算随机碎片数量
func calcFragments(poiType model.POIType, isFirstTime bool) (hero, skin int) {
	rng, ok := fragmentMap[poiType]
	if !ok {
		rng = fragmentMap[model.POIBlueBuff]
	}
	hero = rng[0] + rand.Intn(rng[1]-rng[0]+1)
	skin = rng[2] + rand.Intn(rng[3]-rng[2]+1)

	if isFirstTime {
		hero *= 2
		skin *= 2
	}
	return
}

func (s *CheckinService) DoCheckin(ctx context.Context, userID string, req *CheckinReq) (*CheckinResp, error) {
	// 1. 获取POI
	poi, err := s.repos.POI.GetByID(ctx, req.POIID)
	if err != nil {
		return nil, errcode.NotFound("POI不存在")
	}
	if poi.Status != "active" {
		return nil, errcode.BadRequest("POI已关闭")
	}

	// 2. 距离校验
	poiLat := poi.Location.Coordinates[1]
	poiLng := poi.Location.Coordinates[0]
	distance := geo.Haversine(req.UserLat, req.UserLng, poiLat, poiLng)

	maxDist := float64(poi.TriggerRadius) * s.cfg.LBS.DistanceTolerance
	if distance > maxDist {
		return nil, errcode.BadRequest(fmt.Sprintf("距离太远（%.0f米），请靠近至%.0f米内", distance, maxDist))
	}

	// 3. 防重复
	cooldownSince := time.Now().Add(-time.Duration(s.cfg.LBS.CheckinCooldown) * time.Second)
	exists, _ := s.repos.Checkin.ExistsByUserPOI(ctx, userID, req.POIID, cooldownSince)
	if exists {
		return nil, errcode.Conflict("24小时内已打卡过")
	}

	// 4. 计算奖励
	rewards := make([]model.RewardItem, 0)
	bondValue := 0
	if poi.Rewards != nil {
		bondValue = poi.Rewards.BondValue
	}

	var spiritBadge, bondBookmark string
	var aiTrigger *AITrigger

	switch poi.Type {
	case model.POIBlueBuff:
		rewards = append(rewards, model.RewardItem{Type: "knowledge_card", ID: poi.ID.Hex(), Name: poi.Name + "知识卡"})
	case model.POIRedBuff:
		bondValue += 10
	case model.POITower:
		bondValue += 30
	case model.POISpiritLighthouse:
		if poi.SpiritEvent != nil {
			spiritBadge = poi.SpiritEvent.BadgeID
			rewards = append(rewards, model.RewardItem{Type: "spirit_badge", ID: spiritBadge, Name: poi.SpiritEvent.SpiritKeyword})
			bondValue += 50
			narration := poi.SpiritEvent.HeroNarration[req.HeroID]
			if narration == "" {
				narration = poi.SpiritEvent.EventName
			}
			aiTrigger = &AITrigger{Mode: "spirit", Narration: narration, EasterEgg: poi.SpiritEvent.EasterEgg}
		}
	case model.POIPlayerFootprint:
		if poi.PlayerBond != nil {
			bondBookmark = poi.PlayerBond.BookmarkID
			rewards = append(rewards, model.RewardItem{Type: "bond_bookmark", ID: bondBookmark, Name: poi.PlayerBond.TeamName + "羁绊书签"})
			bondValue += 30
			narration := poi.PlayerBond.HeroNarration[req.HeroID]
			if narration == "" {
				narration = poi.PlayerBond.Story
			}
			aiTrigger = &AITrigger{Mode: "bond", Narration: narration}
		}
	}

	// 5. 计算碎片奖励（按 POI 名称判断是否首次打卡）
	isFirstTime, _ := s.repos.Checkin.IsFirstTimeCheckinByName(ctx, userID, poi.Name)
	heroFrag, skinFrag := calcFragments(poi.Type, isFirstTime)

	// 6. 写打卡记录
	record := &model.Checkin{
		UserID:          userID,
		POIID:           req.POIID,
		POIName:         poi.Name,
		CityCode:        poi.CityCode,
		Location:        model.GeoPoint{Type: "Point", Coordinates: []float64{req.UserLng, req.UserLat}},
		POIType:         poi.Type,
		Rewards:         rewards,
		HeroFragments:   heroFrag,
		SkinFragments:   skinFrag,
		IsFirstTime:     isFirstTime,
		SpiritTriggered: spiritBadge != "",
		BondTriggered:   bondBookmark != "",
		CheckinAt:       time.Now(),
	}
	s.repos.Checkin.Create(ctx, record)

	// 7. 更新用户
	s.repos.User.UpdateAfterCheckin(ctx, userID, &repository.CheckinUpdate{
		CityCode:         poi.CityCode,
		POIID:            req.POIID,
		HeroID:           req.HeroID,
		BondValueInc:     bondValue,
		HeroFragmentInc:  heroFrag,
		SkinFragmentInc:  skinFrag,
		SpiritBadgeID:    spiritBadge,
		BondBookmarkID:   bondBookmark,
		SpiritLighthouse: poi.Type == model.POISpiritLighthouse,
		PlayerFootprint:  poi.Type == model.POIPlayerFootprint,
	})

	fragReward := &FragmentReward{
		HeroFragments: heroFrag,
		SkinFragments: skinFrag,
		IsFirstTime:   isFirstTime,
	}

	return &CheckinResp{
		Success: true, Rewards: rewards, BondValueGained: bondValue,
		SpiritBadgeID: spiritBadge, BondBookmarkID: bondBookmark,
		AITrigger: aiTrigger, Fragments: fragReward, Message: "打卡成功！",
	}, nil
}

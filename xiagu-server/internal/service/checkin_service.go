package service

import (
	"context"
	"errors"
	"fmt"
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

func normalizeHeroID(heroID string) string {
	if heroID == "li_bai" {
		return "libai"
	}
	return heroID
}

func configuredFragments(
	reward *model.POIReward,
	isFirstTime bool,
) (hero int, skin int, err error) {
	if reward == nil || reward.Fragments == nil {
		return 0, 0, errors.New("fragment reward is not configured")
	}

	config := reward.Fragments
	if config.HeroFragments < 0 || config.SkinFragments < 0 {
		return 0, 0, errors.New("fragment reward cannot be negative")
	}
	if config.FirstCheckinMultiplier < 1 {
		return 0, 0, errors.New("first check-in multiplier must be at least one")
	}

	multiplier := 1
	if isFirstTime {
		multiplier = config.FirstCheckinMultiplier
	}
	return config.HeroFragments * multiplier,
		config.SkinFragments * multiplier,
		nil
}

func configuredRewardItems(reward *model.POIReward) []model.RewardItem {
	if reward == nil || len(reward.Items) == 0 {
		return []model.RewardItem{}
	}
	return append([]model.RewardItem(nil), reward.Items...)
}

func appendRewardIfMissing(
	rewards []model.RewardItem,
	reward model.RewardItem,
) []model.RewardItem {
	for _, existing := range rewards {
		if existing.Type == reward.Type && existing.ID == reward.ID {
			return rewards
		}
	}
	return append(rewards, reward)
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
	if _, _, err := configuredFragments(poi.Rewards, false); err != nil {
		return nil, errcode.Internal("POI奖励配置错误")
	}
	canonicalPOIID := poi.ID.Hex()
	heroID := normalizeHeroID(req.HeroID)

	// 2. 距离校验
	poiLat := poi.Location.Coordinates[1]
	poiLng := poi.Location.Coordinates[0]
	distance := geo.Haversine(req.UserLat, req.UserLng, poiLat, poiLng)

	maxDist := float64(poi.TriggerRadius) * s.cfg.LBS.DistanceTolerance
	if distance > maxDist {
		return nil, errcode.BadRequest(fmt.Sprintf("距离太远（%.0f米），请靠近至%.0f米内", distance, maxDist))
	}

	// 4. 奖励金额和物品完全来自 POI 配置。
	rewards := configuredRewardItems(poi.Rewards)
	bondValue := poi.Rewards.BondValue

	var spiritBadge, bondBookmark string
	var aiTrigger *AITrigger

	switch poi.Type {
	case model.POISpiritLighthouse:
		if poi.SpiritEvent != nil {
			spiritBadge = poi.SpiritEvent.BadgeID
			if spiritBadge != "" {
				rewards = appendRewardIfMissing(rewards, model.RewardItem{
					Type: "spirit_badge",
					ID:   spiritBadge,
					Name: poi.SpiritEvent.SpiritKeyword,
				})
			}
			narration := poi.SpiritEvent.HeroNarration[heroID]
			if narration == "" {
				narration = poi.SpiritEvent.EventName
			}
			aiTrigger = &AITrigger{Mode: "spirit", Narration: narration, EasterEgg: poi.SpiritEvent.EasterEgg}
		}
	case model.POIPlayerFootprint:
		if poi.PlayerBond != nil {
			bondBookmark = poi.PlayerBond.BookmarkID
			if bondBookmark != "" {
				rewards = appendRewardIfMissing(rewards, model.RewardItem{
					Type: "bond_bookmark",
					ID:   bondBookmark,
					Name: poi.PlayerBond.TeamName + "羁绊书签",
				})
			}
			narration := poi.PlayerBond.HeroNarration[heroID]
			if narration == "" {
				narration = poi.PlayerBond.Story
			}
			aiTrigger = &AITrigger{Mode: "bond", Narration: narration}
		}
	}

	var isFirstTime bool
	var heroFrag, skinFrag int
	err = s.repos.Checkin.WithTransaction(ctx, func(transactionContext context.Context) error {
		cooldownSince := time.Now().Add(
			-time.Duration(s.cfg.LBS.CheckinCooldown) * time.Second,
		)
		isFirstTime, err = s.repos.Checkin.AcquireCooldownGuard(
			transactionContext,
			userID,
			canonicalPOIID,
			cooldownSince,
		)
		if errors.Is(err, repository.ErrCheckinCooldown) {
			return errcode.Conflict("24小时内已打卡过")
		}
		if err != nil {
			return fmt.Errorf("check check-in cooldown: %w", err)
		}

		heroFrag, skinFrag, err = configuredFragments(
			poi.Rewards,
			isFirstTime,
		)
		if err != nil {
			return fmt.Errorf("calculate configured fragments: %w", err)
		}

		record := &model.Checkin{
			UserID:          userID,
			POIID:           canonicalPOIID,
			POICode:         poi.POICode,
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
		if err := s.repos.Checkin.Create(transactionContext, record); err != nil {
			return fmt.Errorf("create check-in: %w", err)
		}

		if err := s.repos.User.UpdateAfterCheckin(
			transactionContext,
			userID,
			&repository.CheckinUpdate{
				CityCode:         poi.CityCode,
				POIID:            canonicalPOIID,
				HeroID:           heroID,
				BondValueInc:     bondValue,
				HeroFragmentInc:  heroFrag,
				SkinFragmentInc:  skinFrag,
				SpiritBadgeID:    spiritBadge,
				BondBookmarkID:   bondBookmark,
				SpiritLighthouse: poi.Type == model.POISpiritLighthouse,
				PlayerFootprint:  poi.Type == model.POIPlayerFootprint,
				RewardItems:      rewards,
			},
		); err != nil {
			return fmt.Errorf("apply check-in rewards: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

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

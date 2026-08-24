package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
	"xiagu-server/pkg/geo"
)

const (
	bossTriggerRadius = 200.0
	bossCooldown      = 15 * time.Minute
)

type BossDefinition struct {
	ID           string           `json:"id"`
	Name         string           `json:"name"`
	Latitude     float64          `json:"latitude"`
	Longitude    float64          `json:"longitude"`
	MaxHP        int              `json:"max_hp"`
	DamagePerHit int              `json:"damage_per_hit"`
	Reward       model.BossReward `json:"reward"`
}

var bossDefinitions = map[string]BossDefinition{
	"zhuzai": {
		ID: "zhuzai", Name: "峡谷主宰", Latitude: 30.669, Longitude: 104.054,
		MaxHP: 100, DamagePerHit: 25,
		Reward: model.BossReward{HeroFragments: 5, SkinFragments: 3, BondValue: 30,
			PosterID: "boss_zhuzai_poster", PosterURL: "cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/海报/主宰击败.png"},
	},
	"baojun": {
		ID: "baojun", Name: "峡谷暴君", Latitude: 30.642, Longitude: 104.047,
		MaxHP: 100, DamagePerHit: 25,
		Reward: model.BossReward{HeroFragments: 5, SkinFragments: 3, BondValue: 30,
			PosterID: "boss_baojun_poster", PosterURL: "cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/海报/暴君击败.png"},
	},
	"fengbolongwang": {
		ID: "fengbolongwang", Name: "风暴龙王", Latitude: 30.6565, Longitude: 104.082,
		MaxHP: 150, DamagePerHit: 20,
		Reward: model.BossReward{HeroFragments: 8, SkinFragments: 5, BondValue: 50,
			PosterID: "boss_longwang_poster", PosterURL: "cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/海报/风暴龙王击败.png"},
	},
}

type BossCompletionRequest struct {
	BossID  string  `json:"boss_id"`
	Mode    string  `json:"mode"`
	Score   int     `json:"score"`
	HeroID  string  `json:"hero_id"`
	UserLat float64 `json:"user_lat"`
	UserLng float64 `json:"user_lng"`
}

type BossCompletionResponse struct {
	Success       bool             `json:"success"`
	BossID        string           `json:"boss_id"`
	Reward        model.BossReward `json:"reward"`
	CooldownUntil time.Time        `json:"cooldown_until"`
}

type ChallengeService struct{ repos *repository.Repos }

func NewChallengeService(repos *repository.Repos) *ChallengeService {
	return &ChallengeService{repos: repos}
}

func (s *ChallengeService) ListProgress(
	ctx context.Context,
	userID string,
) ([]model.ChallengeProgress, error) {
	return s.repos.Challenge.ListByUser(ctx, userID)
}

func (s *ChallengeService) CompleteBoss(
	ctx context.Context,
	userID string,
	request BossCompletionRequest,
) (*BossCompletionResponse, error) {
	boss, exists := bossDefinitions[request.BossID]
	if !exists || request.HeroID == "" {
		return nil, errcode.BadRequest("Boss或英雄参数无效")
	}
	if request.Mode != "quiz" && request.Mode != "minigame" {
		return nil, errcode.BadRequest("挑战模式无效")
	}
	requiredScore := 1000
	if request.Mode == "quiz" {
		requiredScore = int(math.Ceil(float64(boss.MaxHP) / float64(boss.DamagePerHit)))
	}
	if request.Score < requiredScore {
		return nil, errcode.Conflict("挑战尚未完成")
	}
	if request.UserLat < -90 || request.UserLat > 90 ||
		request.UserLng < -180 || request.UserLng > 180 {
		return nil, errcode.BadRequest("位置参数无效")
	}
	if geo.Haversine(request.UserLat, request.UserLng, boss.Latitude, boss.Longitude) > bossTriggerRadius {
		return nil, errcode.BadRequest("距离Boss过远")
	}

	now := time.Now()
	cooldownUntil := now.Add(bossCooldown)
	progress := model.ChallengeProgress{
		UserID: userID, ChallengeType: "boss", ChallengeID: boss.ID,
		Mode: request.Mode, BestScore: request.Score,
		LastCompletedAt: now, CooldownUntil: cooldownUntil,
	}
	err := s.repos.Challenge.WithTransaction(ctx, func(transactionContext context.Context) error {
		if acquireErr := s.repos.Challenge.AcquireCompletion(
			transactionContext,
			progress,
			now,
		); acquireErr != nil {
			if errors.Is(acquireErr, repository.ErrChallengeCooldown) {
				return errcode.Conflict("Boss挑战冷却中")
			}
			return acquireErr
		}
		if rewardErr := s.repos.User.ApplyBossReward(
			transactionContext,
			userID,
			request.HeroID,
			boss.Reward,
		); rewardErr != nil {
			return fmt.Errorf("apply Boss reward: %w", rewardErr)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &BossCompletionResponse{
		Success: true, BossID: boss.ID, Reward: boss.Reward,
		CooldownUntil: cooldownUntil,
	}, nil
}

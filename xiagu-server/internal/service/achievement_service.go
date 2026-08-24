package service

import (
	"context"
	"time"

	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
)

type achievementDefinition struct {
	ID, Name, Description, Category, Icon, Metric string
	Score, Target                                 int
}

var achievementDefinitions = []achievementDefinition{
	{"first_checkin", "初出茅庐", "完成首次打卡", "checkin", "🏁", "checkins", 1, 1},
	{"checkin_5", "小有名气", "累计打卡5个POI", "checkin", "⭐", "checkins", 2, 5},
	{"checkin_15", "探索达人", "累计打卡15个POI", "checkin", "🌟", "checkins", 3, 15},
	{"checkin_all", "全图制霸", "打卡全部POI", "checkin", "👑", "all_pois", 5, 0},
	{"first_badge", "勋章猎人", "收集首枚勋章", "collection", "🎖️", "badges", 1, 1},
	{"all_spirit_badges", "精神传承者", "集齐全部精神徽章", "collection", "🔥", "spirit_badges", 3, 6},
	{"all_bookmarks", "峡谷编年史", "集齐全部羁绊书签", "collection", "📖", "bookmarks", 5, 10},
	{"first_route", "踏上征途", "完成首条路线", "route", "🗺️", "routes", 2, 1},
	{"all_routes", "成都通", "完成全部3条路线", "route", "🏆", "routes", 5, 3},
	{"first_share", "社交达人", "首次分享战报", "social", "📤", "shares", 1, 1},
	{"share_3", "峡谷宣传官", "累计分享3次", "social", "📣", "shares", 2, 3},
}

type AchievementResponse struct {
	Items       []model.AchievementProgress `json:"items"`
	EarnedScore int                         `json:"earned_score"`
	TotalScore  int                         `json:"total_score"`
}

type AchievementService struct{ repos *repository.Repos }

func NewAchievementService(repos *repository.Repos) *AchievementService {
	return &AchievementService{repos: repos}
}

func (s *AchievementService) Get(
	ctx context.Context,
	userID string,
) (*AchievementResponse, error) {
	user, err := s.repos.User.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	checkins, err := s.repos.Checkin.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	activePOIs, err := s.repos.POI.CountActive(ctx)
	if err != nil {
		return nil, err
	}
	uniquePOIs := map[string]struct{}{}
	for _, checkin := range checkins {
		uniquePOIs[checkin.POIID] = struct{}{}
	}
	metrics := map[string]int{
		"checkins": len(uniquePOIs), "badges": len(user.Badges),
		"spirit_badges": len(user.SpiritBadges), "bookmarks": len(user.BondBookmarks),
		"routes": len(user.CompletedRoutes), "shares": user.ShareCount,
	}

	response := &AchievementResponse{}
	for _, definition := range achievementDefinitions {
		target := definition.Target
		current := metrics[definition.Metric]
		if definition.Metric == "all_pois" {
			target = int(activePOIs)
			current = len(uniquePOIs)
		}
		unlocked := target > 0 && current >= target
		progress := model.AchievementProgress{
			ID: userID + ":" + definition.ID, UserID: userID,
			AchievementID: definition.ID, Name: definition.Name,
			Description: definition.Description, Category: definition.Category,
			Icon: definition.Icon, Score: definition.Score,
			Current: current, Target: target, Unlocked: unlocked,
		}
		if unlocked {
			now := time.Now()
			progress.UnlockedAt = &now
			response.EarnedScore += definition.Score
			if err := s.repos.Achievement.SaveUnlocked(ctx, progress); err != nil {
				return nil, err
			}
		}
		response.TotalScore += definition.Score
		response.Items = append(response.Items, progress)
	}
	return response, nil
}

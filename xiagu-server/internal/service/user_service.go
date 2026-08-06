package service

import (
	"context"
	"time"

	"xiagu-server/internal/config"
	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/auth"
	"xiagu-server/pkg/external/wechat"
)

type UserService struct {
	repos  *repository.Repos
	cfg    *config.Config
	wechat *wechat.Auth
}

func NewUserService(repos *repository.Repos, cfg *config.Config, wc *wechat.Auth) *UserService {
	return &UserService{repos: repos, cfg: cfg, wechat: wc}
}

type LoginResp struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

func (s *UserService) Login(ctx context.Context, code string) (*LoginResp, error) {
	// 1. 用code换取openid
	wxResp, err := s.wechat.Code2Session(ctx, code)
	if err != nil {
		return nil, err
	}

	// 2. 查找或创建用户
	user, err := s.repos.User.GetByOpenID(ctx, wxResp.OpenID)
	if err != nil {
		// 新用户
		user = &model.User{
			OpenID:         wxResp.OpenID,
			Nickname:       "召唤师",
			CurrentHeroID:  "libai",
			HeroBonds:      map[string]*model.HeroBond{},
			ExploredCities: map[string]*model.CityProgress{},
			Badges:         []string{},
			SpiritBadges:   []string{},
			BondBookmarks:  []string{},
			KnowledgeCards: []string{},
			Coupons:        []model.UserCoupon{},
		}
		if err := s.repos.User.Create(ctx, user); err != nil {
			return nil, err
		}
	}

	// 3. 生成JWT
	token, err := auth.GenerateJWT(user.ID.Hex(), wxResp.OpenID, s.cfg.JWT.Secret, s.cfg.JWT.ExpireHours)
	if err != nil {
		return nil, err
	}

	return &LoginResp{Token: token, User: user}, nil
}

func (s *UserService) GetProfile(ctx context.Context, userID string) (*model.User, error) {
	return s.repos.User.GetByID(ctx, userID)
}

func (s *UserService) GetAssets(ctx context.Context, userID string) (heroFrag, skinFrag int, err error) {
	user, err := s.repos.User.GetByID(ctx, userID)
	if err != nil {
		return 0, 0, err
	}
	return user.HeroFragments, user.SkinFragments, nil
}

func (s *UserService) SelectHero(ctx context.Context, userID, heroID string) error {
	// 初始化该英雄的羁绊数据（如果没有）
	user, err := s.repos.User.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	if user.HeroBonds == nil {
		user.HeroBonds = map[string]*model.HeroBond{}
	}
	if _, ok := user.HeroBonds[heroID]; !ok {
		user.HeroBonds[heroID] = &model.HeroBond{
			BondValue:  0,
			BondLevel:  1,
			UnlockDate: time.Now(),
		}
	}

	return s.repos.User.UpdateHero(ctx, userID, heroID)
}

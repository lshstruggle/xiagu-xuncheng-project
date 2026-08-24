package service

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"xiagu-server/internal/config"
	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/auth"
	"xiagu-server/pkg/external/wechat"
)

var ErrUserBanned = errors.New("user banned")
var ErrInvalidUserProfile = errors.New("invalid user profile")

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
	user, err := s.repos.User.FindOrCreateByOpenID(
		ctx,
		wxResp.OpenID,
	)
	if err != nil {
		return nil, err
	}

	if user.Status == "banned" {
		return nil, ErrUserBanned
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

func (s *UserService) UpdateProfile(
	ctx context.Context,
	userID string,
	nickname string,
	avatar string,
) (*model.User, error) {
	nickname = strings.TrimSpace(nickname)
	avatar = strings.TrimSpace(avatar)

	if err := validateUserProfile(nickname, avatar); err != nil {
		return nil, ErrInvalidUserProfile
	}

	if err := s.repos.User.UpdateProfile(ctx, userID, nickname, avatar); err != nil {
		return nil, err
	}
	return s.repos.User.GetByID(ctx, userID)
}

func validateUserProfile(nickname string, avatar string) error {
	if count := utf8.RuneCountInString(nickname); count < 1 || count > 20 {
		return ErrInvalidUserProfile
	}
	if len(avatar) > 2048 || !strings.HasPrefix(avatar, "cloud://") {
		return ErrInvalidUserProfile
	}
	return nil
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

package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
)

// 内存商品配置（后续可迁移到数据库）
var shopItems = []model.ShopItem{
	{ID: "h_gongsun", Name: "公孙离", Type: "hero", Cost: 58, ImgURL: "", HeroID: "gongsun"},
	{ID: "h_daqiao", Name: "大乔", Type: "hero", Cost: 58, ImgURL: "", HeroID: "daqiao"},
	{ID: "h_xiaoqiao", Name: "小乔", Type: "hero", Cost: 58, ImgURL: "", HeroID: "xiaoqiao"},
	{ID: "h_duoliya", Name: "朵莉亚", Type: "hero", Cost: 68, ImgURL: "", HeroID: "duoliya"},
	{ID: "h_wangzhaojun", Name: "王昭君", Type: "hero", Cost: 68, ImgURL: "", HeroID: "wangzhaojun"},
	{ID: "h_ailin", Name: "艾琳", Type: "hero", Cost: 68, ImgURL: "", HeroID: "ailin"},
	{ID: "h_huamulan", Name: "花木兰", Type: "hero", Cost: 78, ImgURL: "", HeroID: "huamulan"},
	{ID: "h_peiqinhu", Name: "裴擒虎", Type: "hero", Cost: 78, ImgURL: "", HeroID: "peiqinhu"},
	{ID: "h_kai", Name: "铠", Type: "hero", Cost: 88, ImgURL: "", HeroID: "kai"},
	{ID: "h_hanxin", Name: "韩信", Type: "hero", Cost: 88, ImgURL: "", HeroID: "hanxin"},
	{ID: "s_libai_01", Name: "凤求凰 (桌宠)", Type: "skin", Cost: 88, ImgURL: "", HeroID: "libai"},
}

type ShopService struct {
	repos *repository.Repos
}

func NewShopService(repos *repository.Repos) *ShopService {
	return &ShopService{repos: repos}
}

func (s *ShopService) GetItems(ctx context.Context, userID string) ([]model.ShopItem, error) {
	owned, err := s.repos.User.OwnedShopItems(ctx, userID)
	if err != nil {
		return nil, err
	}
	items := make([]model.ShopItem, len(shopItems))
	copy(items, shopItems)
	for index := range items {
		_, items[index].Owned = owned[items[index].ID]
	}
	return items, nil
}

func (s *ShopService) ExchangeItem(ctx context.Context, userID, itemID string) (heroFrag, skinFrag int, err error) {
	// 查找商品
	var item *model.ShopItem
	for _, it := range shopItems {
		if it.ID == itemID {
			item = &it
			break
		}
	}
	if item == nil {
		return 0, 0, errcode.NotFound("商品不存在")
	}

	heroFrag, skinFrag, err = s.repos.User.ExchangeShopItem(
		ctx,
		userID,
		repository.ShopExchange{
			ItemID:   item.ID,
			ItemType: item.Type,
			HeroID:   item.HeroID,
			Cost:     item.Cost,
		},
	)
	if errors.Is(err, repository.ErrItemAlreadyOwned) {
		return 0, 0, errcode.Conflict("已拥有该商品")
	}
	if errors.Is(err, repository.ErrInsufficientAssets) {
		return 0, 0, errcode.Conflict("碎片不足")
	}
	return heroFrag, skinFrag, err
}

type MerchService struct {
	repos *repository.Repos
}

func NewMerchService(repos *repository.Repos) *MerchService {
	return &MerchService{repos: repos}
}

func (s *MerchService) SubmitOrder(ctx context.Context, userID string, order *model.MerchOrder) error {
	order.Name = strings.TrimSpace(order.Name)
	order.Phone = strings.TrimSpace(order.Phone)
	order.Address = strings.TrimSpace(order.Address)
	if order.HeroID == "" || len([]rune(order.Name)) < 2 ||
		len([]rune(order.Address)) < 6 ||
		!chinaMobilePattern.MatchString(order.Phone) {
		return errcode.BadRequest("收货信息格式不正确")
	}

	user, err := s.repos.User.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	bond := user.HeroBonds[order.HeroID]
	if bond == nil || BondLevel(bond.BondValue) < 10 {
		return errcode.Conflict("该英雄羁绊尚未达到 Lv.10")
	}

	order.UserID = userID
	order.Status = "pending"
	order.CreatedAt = time.Now()
	if err := s.repos.MerchOrder.Create(ctx, order); err != nil {
		if errors.Is(err, repository.ErrMerchAlreadyClaimed) {
			return errcode.Conflict("该英雄周边已领取")
		}
		return err
	}
	return nil
}

var chinaMobilePattern = regexp.MustCompile(`^1[3-9][0-9]{9}$`)

// BondLevel is the single server-authoritative conversion used by both the
// profile response and merchandise eligibility.
func BondLevel(bondValue int) int {
	if bondValue < 0 {
		bondValue = 0
	}
	level := bondValue/200 + 1
	if level > 10 {
		return 10
	}
	return level
}

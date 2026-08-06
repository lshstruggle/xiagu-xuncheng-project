package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
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

func (s *ShopService) GetItems(ctx context.Context) []model.ShopItem {
	return shopItems
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
		return 0, 0, errors.New("商品不存在")
	}

	// 获取用户
	user, err := s.repos.User.GetByID(ctx, userID)
	if err != nil {
		return 0, 0, err
	}

	// 检查是否已拥有（简单逻辑：已选中的英雄视为已拥有）
	if item.Type == "hero" && user.CurrentHeroID == item.HeroID {
		return 0, 0, errors.New("已拥有该英雄")
	}

	// 检查碎片是否足够
	if item.Type == "hero" {
		if user.HeroFragments < item.Cost {
			return 0, 0, errors.New("英雄碎片不足")
		}
		if err := s.repos.User.UpdateFragments(ctx, userID, -item.Cost, 0); err != nil {
			return 0, 0, err
		}
		return user.HeroFragments - item.Cost, user.SkinFragments, nil
	}

	if user.SkinFragments < item.Cost {
		return 0, 0, errors.New("皮肤碎片不足")
	}
	if err := s.repos.User.UpdateFragments(ctx, userID, 0, -item.Cost); err != nil {
		return 0, 0, err
	}
	return user.HeroFragments, user.SkinFragments - item.Cost, nil
}

type MerchService struct {
	repos *repository.Repos
}

func NewMerchService(repos *repository.Repos) *MerchService {
	return &MerchService{repos: repos}
}

func (s *MerchService) SubmitOrder(ctx context.Context, userID string, order *model.MerchOrder) error {
	order.UserID = userID
	order.Status = "pending"
	order.CreatedAt = time.Now().Format("2006-01-02 15:04:05")

	// TODO: 接入数据库持久化，目前仅打印日志
	fmt.Printf("[MerchOrder] user=%s hero=%s name=%s phone=%s address=%s\n",
		order.UserID, order.HeroID, order.Name, order.Phone, order.Address)
	return nil
}

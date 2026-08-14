package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ShopItem 商城商品
// 目前为内存配置，后续可迁移到数据库或配置文件
type ShopItem struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Type   string `json:"type"` // hero | skin
	Cost   int    `json:"cost"`
	ImgURL string `json:"img_url"`
	HeroID string `json:"hero_id"` // 关联的英雄ID
	Owned  bool   `json:"is_owned"`
}

// UserInventory records server-authoritative ownership. A deterministic ID
// makes repeated and concurrent exchanges idempotent even before querying the
// compound index.
type UserInventory struct {
	ID         string    `bson:"_id" json:"id"`
	UserID     string    `bson:"user_id" json:"user_id"`
	ItemID     string    `bson:"item_id" json:"item_id"`
	ItemType   string    `bson:"item_type" json:"item_type"`
	HeroID     string    `bson:"hero_id" json:"hero_id"`
	AcquiredAt time.Time `bson:"acquired_at" json:"acquired_at"`
}

// MerchOrder 实体周边订单
type MerchOrder struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    string             `bson:"user_id" json:"user_id"`
	HeroID    string             `bson:"hero_id" json:"hero_id"`
	Name      string             `bson:"name" json:"name"`
	Phone     string             `bson:"phone" json:"phone"`
	Address   string             `bson:"address" json:"address"`
	Status    string             `bson:"status" json:"status"` // pending | shipped | completed
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

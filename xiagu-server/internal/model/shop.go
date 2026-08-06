package model

// ShopItem 商城商品
// 目前为内存配置，后续可迁移到数据库或配置文件
type ShopItem struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Type    string `json:"type"` // hero | skin
	Cost    int    `json:"cost"`
	ImgURL  string `json:"img_url"`
	HeroID  string `json:"hero_id"` // 关联的英雄ID
}

// MerchOrder 实体周边订单
type MerchOrder struct {
	ID        string `bson:"_id,omitempty" json:"id"`
	UserID    string `bson:"user_id" json:"user_id"`
	HeroID    string `bson:"hero_id" json:"hero_id"`
	Name      string `bson:"name" json:"name"`
	Phone     string `bson:"phone" json:"phone"`
	Address   string `bson:"address" json:"address"`
	Status    string `bson:"status" json:"status"` // pending | shipped | completed
	CreatedAt string `bson:"created_at" json:"created_at"`
}

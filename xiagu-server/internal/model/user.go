package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OpenID   string             `bson:"openid" json:"-"`
	Nickname string             `bson:"nickname" json:"nickname"`
	Avatar   string             `bson:"avatar" json:"avatar"`

	CurrentHeroID string `bson:"current_hero_id" json:"current_hero_id"`
	CurrentCity   string `bson:"current_city" json:"current_city"`

	HeroBonds      map[string]*HeroBond     `bson:"hero_bonds" json:"hero_bonds"`
	ExploredCities map[string]*CityProgress `bson:"explored_cities" json:"explored_cities"`

	Badges         []string     `bson:"badges" json:"badges"`
	SpiritBadges   []string     `bson:"spirit_badges" json:"spirit_badges"`
	BondBookmarks  []string     `bson:"bond_bookmarks" json:"bond_bookmarks"`
	KnowledgeCards []string     `bson:"knowledge_cards" json:"knowledge_cards"`
	Coupons        []UserCoupon `bson:"coupons" json:"coupons"`

	TotalSteps    int64   `bson:"total_steps" json:"total_steps"`
	TotalDistance float64 `bson:"total_distance" json:"total_distance"`

	HeroFragments int `bson:"hero_fragments" json:"hero_fragments"`
	SkinFragments int `bson:"skin_fragments" json:"skin_fragments"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

type HeroBond struct {
	BondValue  int       `bson:"bond_value" json:"bond_value"`
	BondLevel  int       `bson:"bond_level" json:"bond_level"`
	UnlockDate time.Time `bson:"unlock_date" json:"unlock_date"`
}

type CityProgress struct {
	FogProgress              float64  `bson:"fog_progress" json:"fog_progress"`
	POICheckedIn             []string `bson:"poi_checked_in" json:"poi_checked_in"`
	SpiritLighthousesVisited []string `bson:"spirit_lighthouses_visited" json:"spirit_lighthouses_visited"`
	PlayerFootprintsFound    []string `bson:"player_footprints_found" json:"player_footprints_found"`
	LastVisitDate            string   `bson:"last_visit_date" json:"last_visit_date"`
}

type UserCoupon struct {
	CouponID   string    `bson:"coupon_id" json:"coupon_id"`
	MerchantID string    `bson:"merchant_id" json:"merchant_id"`
	Title      string    `bson:"title" json:"title"`
	Status     string    `bson:"status" json:"status"`
	AcquiredAt time.Time `bson:"acquired_at" json:"acquired_at"`
	ExpireAt   time.Time `bson:"expire_at" json:"expire_at"`
}

package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type POIType string

const (
	POIBlueBuff         POIType = "blue_buff"
	POIRedBuff          POIType = "red_buff"
	POITower            POIType = "tower"
	POISpiritLighthouse POIType = "spirit_lighthouse"
	POIPlayerFootprint  POIType = "player_footprint"
)

type GeoPoint struct {
	Type        string    `bson:"type" json:"type"`
	Coordinates []float64 `bson:"coordinates" json:"coordinates"`
}

type POI struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CityCode      string             `bson:"city_code" json:"cityCode"`
	Name          string             `bson:"name" json:"name"`
	Type          POIType            `bson:"type" json:"type"`
	Category      string             `bson:"category" json:"category"`
	Location      GeoPoint           `bson:"location" json:"location"`
	TriggerRadius int                `bson:"trigger_radius" json:"triggerRadius"`
	Description   string             `bson:"description" json:"description"`
	Images        []string           `bson:"images" json:"images"`

	HeroNarrations map[string]string `bson:"hero_narrations" json:"heroNarrations"`
	Rewards        *POIReward        `bson:"rewards" json:"rewards"`

	SpiritEvent *SpiritEvent `bson:"spirit_event,omitempty" json:"spiritEvent,omitempty"`
	PlayerBond  *PlayerBond  `bson:"player_bond,omitempty" json:"playerBond,omitempty"`
	MerchantID  string       `bson:"merchant_id,omitempty" json:"merchantId,omitempty"`

	Status    string    `bson:"status" json:"status"`
	Priority  int       `bson:"priority" json:"priority"`
	CreatedAt time.Time `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time `bson:"updated_at" json:"updatedAt"`
}

type POIReward struct {
	BondValue int          `bson:"bond_value" json:"bondValue"`
	Items     []RewardItem `bson:"items,omitempty" json:"items,omitempty"`
}

type RewardItem struct {
	Type string `bson:"type" json:"type"`
	ID   string `bson:"id" json:"id"`
	Name string `bson:"name,omitempty" json:"name,omitempty"`
}

type SpiritEvent struct {
	EventName     string            `bson:"event_name" json:"eventName"`
	Year          int               `bson:"year" json:"year"`
	SpiritKeyword string            `bson:"spirit_keyword" json:"spiritKeyword"`
	BadgeID       string            `bson:"badge_id" json:"badgeId"`
	HeroNarration map[string]string `bson:"hero_narration" json:"heroNarration"`
	EasterEgg     *EasterEggQA      `bson:"easter_egg,omitempty" json:"easterEgg,omitempty"`
}

type EasterEggQA struct {
	Question string            `bson:"question" json:"question"`
	Options  []string          `bson:"options" json:"options"`
	FollowUp map[string]string `bson:"follow_up" json:"followUp"`
}

type PlayerBond struct {
	TeamName      string            `bson:"team_name" json:"teamName"`
	Era           string            `bson:"era" json:"era"`
	Story         string            `bson:"story" json:"story"`
	Quote         string            `bson:"quote" json:"quote"`
	QuoteSource   string            `bson:"quote_source" json:"quoteSource"`
	HeroNarration map[string]string `bson:"hero_narration" json:"heroNarration"`
	BookmarkID    string            `bson:"bookmark_id" json:"bookmarkId"`
}

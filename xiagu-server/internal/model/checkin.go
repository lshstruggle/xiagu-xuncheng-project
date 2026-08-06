package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Checkin struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          string             `bson:"user_id" json:"user_id"`
	POIID           string             `bson:"poi_id" json:"poi_id"`
	POIName         string             `bson:"poi_name" json:"poi_name"`
	CityCode        string             `bson:"city_code" json:"city_code"`
	Location        GeoPoint           `bson:"location" json:"location"`
	POIType         POIType            `bson:"poi_type" json:"poi_type"`
	Rewards         []RewardItem       `bson:"rewards" json:"rewards"`
	HeroFragments   int                `bson:"hero_fragments" json:"hero_fragments"`
	SkinFragments   int                `bson:"skin_fragments" json:"skin_fragments"`
	IsFirstTime     bool               `bson:"is_first_time" json:"is_first_time"`
	SpiritTriggered bool               `bson:"spirit_triggered" json:"spirit_triggered"`
	BondTriggered   bool               `bson:"bond_triggered" json:"bond_triggered"`
	CheckinAt       time.Time          `bson:"checkin_at" json:"checkin_at"`
}

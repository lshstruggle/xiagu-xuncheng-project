package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type Route struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CityCode    string             `bson:"city_code" json:"cityCode"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Duration    string             `bson:"duration" json:"duration"`
	Difficulty  string             `bson:"difficulty" json:"difficulty"`
	Distance    float64            `bson:"distance" json:"distance"`
	POISequence []string           `bson:"poi_sequence" json:"poiSequence"`

	Tags                  []string `bson:"tags" json:"tags"`
	SpiritLighthouseCount int      `bson:"spirit_lighthouse_count" json:"spiritLighthouseCount"`
	PlayerFootprintCount  int      `bson:"player_footprint_count" json:"playerFootprintCount"`

	RecommendedHeroes []string `bson:"recommended_heroes" json:"recommendedHeroes"`
	CoverImage        string   `bson:"cover_image" json:"coverImage"`
	Status            string   `bson:"status" json:"status"`
}

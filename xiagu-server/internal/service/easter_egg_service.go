package service

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EasterEgg 彩蛋模型
type EasterEgg struct {
	ID              string                 `json:"id" bson:"id"`
	CityID          string                 `json:"city_id" bson:"city_id"`
	Name            string                 `json:"name" bson:"name"`
	Type            string                 `json:"type" bson:"type"`
	Location        GeoJSON                `json:"location" bson:"location"`
	Rarity          string                 `json:"rarity" bson:"rarity"`
	RarityLabel     string                 `json:"rarity_label" bson:"rarity_label"`
	RarityColor     string                 `json:"rarity_color" bson:"rarity_color"`
	HeroNarrations  map[string]string      `json:"hero_narrations,omitempty" bson:"hero_narrations,omitempty"`
	Content         map[string]interface{} `json:"content,omitempty" bson:"content,omitempty"`
	EasterEggData   map[string]interface{} `json:"easter_egg,omitempty" bson:"easter_egg,omitempty"`
	BookmarkData    map[string]interface{} `json:"bookmark_data,omitempty" bson:"bookmark_data,omitempty"`
	FragmentID      string                 `json:"fragment_id,omitempty" bson:"fragment_id,omitempty"`
	FragmentContent string                 `json:"fragment_content,omitempty" bson:"fragment_content,omitempty"`
	IsActive        bool                   `json:"is_active" bson:"is_active"`
	CreatedAt       time.Time              `json:"created_at" bson:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at" bson:"updated_at"`
}

// GeoJSON 地理位置
type GeoJSON struct {
	Type        string    `json:"type" bson:"type"`
	Coordinates []float64 `json:"coordinates" bson:"coordinates"`
}

// UserEasterEggCollection 用户彩蛋收集记录
type UserEasterEggCollection struct {
	ID           string    `json:"id" bson:"_id,omitempty"`
	UserID       string    `json:"user_id" bson:"user_id"`
	EasterEggID  string    `json:"easter_egg_id" bson:"easter_egg_id"`
	EasterEggName string   `json:"easter_egg_name" bson:"easter_egg_name"`
	FragmentID   string    `json:"fragment_id" bson:"fragment_id"`
	Rarity       string    `json:"rarity" bson:"rarity"`
	CollectedAt  time.Time `json:"collected_at" bson:"collected_at"`
}

// EasterEggService 彩蛋服务
type EasterEggService struct {
	db                      *mongo.Database
	easterEggCollection     *mongo.Collection
	userCollectionCollection *mongo.Collection
}

// NewEasterEggService 创建彩蛋服务
func NewEasterEggService(db *mongo.Database) *EasterEggService {
	return &EasterEggService{
		db:                       db,
		easterEggCollection:      db.Collection("easter_eggs"),
		userCollectionCollection: db.Collection("user_easter_egg_collections"),
	}
}

// GetEasterEggs 获取所有彩蛋
func (s *EasterEggService) GetEasterEggs(ctx context.Context, cityID string) ([]EasterEgg, error) {
	filter := bson.M{
		"city_id":   cityID,
		"is_active": true,
	}

	opts := options.Find().SetSort(bson.M{"rarity": 1})

	cursor, err := s.easterEggCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var eggs []EasterEgg
	if err := cursor.All(ctx, &eggs); err != nil {
		return nil, err
	}

	return eggs, nil
}

// GetEasterEggByID 根据ID获取彩蛋
func (s *EasterEggService) GetEasterEggByID(ctx context.Context, id string) (*EasterEgg, error) {
	filter := bson.M{"id": id}

	var egg EasterEgg
	err := s.easterEggCollection.FindOne(ctx, filter).Decode(&egg)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("彩蛋不存在")
		}
		return nil, err
	}

	return &egg, nil
}

// GetNearbyEasterEggs 获取附近的彩蛋
func (s *EasterEggService) GetNearbyEasterEggs(ctx context.Context, lat, lng float64, radius int) ([]EasterEgg, error) {
	// 使用MongoDB的地理空间查询
	filter := bson.M{
		"location": bson.M{
			"$near": bson.M{
				"$geometry": bson.M{
					"type":        "Point",
					"coordinates": []float64{lng, lat},
				},
				"$maxDistance": radius,
			},
		},
		"is_active": true,
	}

	cursor, err := s.easterEggCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var eggs []EasterEgg
	if err := cursor.All(ctx, &eggs); err != nil {
		return nil, err
	}

	return eggs, nil
}

// CollectEasterEgg 收集彩蛋
func (s *EasterEggService) CollectEasterEgg(ctx context.Context, userID, easterEggID string) (*UserEasterEggCollection, error) {
	// 获取彩蛋信息
	egg, err := s.GetEasterEggByID(ctx, easterEggID)
	if err != nil {
		return nil, err
	}

	// 检查是否已收集
	existingFilter := bson.M{
		"user_id":      userID,
		"easter_egg_id": easterEggID,
	}
	var existing UserEasterEggCollection
	err = s.userCollectionCollection.FindOne(ctx, existingFilter).Decode(&existing)
	if err == nil {
		return nil, fmt.Errorf("该彩蛋已收集")
	}

	// 创建收集记录
	collection := &UserEasterEggCollection{
		UserID:        userID,
		EasterEggID:   easterEggID,
		EasterEggName: egg.Name,
		FragmentID:    egg.FragmentID,
		Rarity:        egg.Rarity,
		CollectedAt:   time.Now(),
	}

	_, err = s.userCollectionCollection.InsertOne(ctx, collection)
	if err != nil {
		return nil, err
	}

	return collection, nil
}

// GetUserCollection 获取用户收集记录
func (s *EasterEggService) GetUserCollection(ctx context.Context, userID string) ([]UserEasterEggCollection, error) {
	filter := bson.M{"user_id": userID}
	opts := options.Find().SetSort(bson.M{"collected_at": -1})

	cursor, err := s.userCollectionCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var collections []UserEasterEggCollection
	if err := cursor.All(ctx, &collections); err != nil {
		return nil, err
	}

	return collections, nil
}

// CheckUserHasCollected 检查用户是否已收集某彩蛋
func (s *EasterEggService) CheckUserHasCollected(ctx context.Context, userID, easterEggID string) (bool, error) {
	filter := bson.M{
		"user_id":       userID,
		"easter_egg_id": easterEggID,
	}

	var existing UserEasterEggCollection
	err := s.userCollectionCollection.FindOne(ctx, filter).Decode(&existing)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}

	return true, nil
}

package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AISession struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      string             `bson:"user_id" json:"user_id"`
	HeroID      string             `bson:"hero_id" json:"hero_id"`
	CityCode    string             `bson:"city_code" json:"city_code"`
	Messages    []ChatMessage      `bson:"messages" json:"messages"`
	CurrentMode string             `bson:"current_mode" json:"current_mode"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
	ExpiresAt   time.Time          `bson:"expires_at" json:"expires_at"`
}

type ChatMessage struct {
	Role      string    `bson:"role" json:"role"`
	Content   string    `bson:"content" json:"content"`
	Mode      string    `bson:"mode" json:"mode"`
	Timestamp time.Time `bson:"timestamp" json:"timestamp"`
}

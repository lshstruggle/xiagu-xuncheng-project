package model

import "time"

type AchievementProgress struct {
	ID            string     `bson:"_id" json:"id"`
	UserID        string     `bson:"user_id" json:"-"`
	AchievementID string     `bson:"achievement_id" json:"achievement_id"`
	Name          string     `bson:"name" json:"name"`
	Description   string     `bson:"description" json:"description"`
	Category      string     `bson:"category" json:"category"`
	Icon          string     `bson:"icon" json:"icon"`
	Score         int        `bson:"score" json:"score"`
	Current       int        `bson:"current" json:"current"`
	Target        int        `bson:"target" json:"target"`
	Unlocked      bool       `bson:"unlocked" json:"unlocked"`
	UnlockedAt    *time.Time `bson:"unlocked_at,omitempty" json:"unlocked_at,omitempty"`
}

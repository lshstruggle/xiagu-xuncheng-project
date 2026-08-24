package model

import "time"

type ChallengeProgress struct {
	ID              string    `bson:"_id" json:"id"`
	UserID          string    `bson:"user_id" json:"user_id"`
	ChallengeType   string    `bson:"challenge_type" json:"challenge_type"`
	ChallengeID     string    `bson:"challenge_id" json:"challenge_id"`
	Mode            string    `bson:"mode" json:"mode"`
	BestScore       int       `bson:"best_score" json:"best_score"`
	CompletedCount  int       `bson:"completed_count" json:"completed_count"`
	LastCompletedAt time.Time `bson:"last_completed_at" json:"last_completed_at"`
	CooldownUntil   time.Time `bson:"cooldown_until" json:"cooldown_until"`
}

type BossReward struct {
	HeroFragments int    `bson:"hero_fragments" json:"hero_fragments"`
	SkinFragments int    `bson:"skin_fragments" json:"skin_fragments"`
	BondValue     int    `bson:"bond_value" json:"bond_value"`
	PosterID      string `bson:"poster_id" json:"poster_id"`
	PosterURL     string `bson:"poster_url" json:"poster_url"`
}

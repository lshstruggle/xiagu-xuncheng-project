package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

type AchievementRepo struct{ coll *database.Collection }

func NewAchievementRepo(db *database.Collections) *AchievementRepo {
	return &AchievementRepo{coll: db.Collection("achievements")}
}

func (r *AchievementRepo) SaveUnlocked(
	ctx context.Context,
	progress model.AchievementProgress,
) error {
	now := time.Now()
	_, err := r.coll.UpdateOne(
		ctx,
		bson.M{"_id": progress.UserID + ":" + progress.AchievementID},
		bson.M{
			"$set": bson.M{
				"user_id": progress.UserID, "achievement_id": progress.AchievementID,
				"name": progress.Name, "description": progress.Description,
				"category": progress.Category, "icon": progress.Icon,
				"score": progress.Score, "current": progress.Current,
				"target": progress.Target, "unlocked": true,
			},
			"$setOnInsert": bson.M{"unlocked_at": now},
		},
		options.Update().SetUpsert(true),
	)
	return err
}

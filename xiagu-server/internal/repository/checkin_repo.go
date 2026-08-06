package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"xiagu-server/internal/model"
)

type CheckinRepo struct {
	coll *mongo.Collection
}

func NewCheckinRepo(db *mongo.Database) *CheckinRepo {
	return &CheckinRepo{coll: db.Collection("checkins")}
}

func (r *CheckinRepo) Create(ctx context.Context, c *model.Checkin) error {
	_, err := r.coll.InsertOne(ctx, c)
	return err
}

func (r *CheckinRepo) ExistsByUserPOI(ctx context.Context, userID, poiID string, since time.Time) (bool, error) {
	count, err := r.coll.CountDocuments(ctx, bson.M{
		"user_id":    userID,
		"poi_id":     poiID,
		"checkin_at": bson.M{"$gte": since},
	})
	return count > 0, err
}

// IsFirstTimeCheckinByName 按 POI 名称判断用户是否首次打卡（历史上从未打卡过该名称的 POI）
func (r *CheckinRepo) IsFirstTimeCheckinByName(ctx context.Context, userID, poiName string) (bool, error) {
	count, err := r.coll.CountDocuments(ctx, bson.M{
		"user_id":  userID,
		"poi_name": poiName,
	})
	return count == 0, err
}

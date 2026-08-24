package repository

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

var ErrCheckinCooldown = errors.New("check-in cooldown is active")

type CheckinRepo struct {
	coll        *database.Collection
	guardColl   *database.Collection
	collections *database.Collections
}

func NewCheckinRepo(db *database.Collections) *CheckinRepo {
	return &CheckinRepo{
		coll:        db.Collection("checkins"),
		guardColl:   db.Collection("checkin_guards"),
		collections: db,
	}
}

func (r *CheckinRepo) AcquireCooldownGuard(
	ctx context.Context,
	userID string,
	poiID string,
	since time.Time,
) (bool, error) {
	guardID := userID + ":" + poiID
	result, err := r.guardColl.UpdateOne(
		ctx,
		bson.M{
			"_id": guardID,
			"$or": bson.A{
				bson.M{"last_checkin_at": bson.M{"$lte": since}},
				bson.M{"last_checkin_at": bson.M{"$exists": false}},
			},
		},
		bson.M{"$set": bson.M{"last_checkin_at": time.Now()}},
		options.Update().SetUpsert(true),
	)
	if errors.Is(err, database.ErrDuplicateWrite) {
		return false, ErrCheckinCooldown
	}
	if err != nil {
		return false, err
	}
	if result.MatchedCount == 0 && result.UpsertedCount == 0 {
		return false, ErrCheckinCooldown
	}

	return result.UpsertedCount > 0, nil
}

func (r *CheckinRepo) WithTransaction(
	ctx context.Context,
	operation func(context.Context) error,
) error {
	return r.collections.WithTransaction(ctx, operation)
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

func (r *CheckinRepo) ListByUser(ctx context.Context, userID string) ([]model.Checkin, error) {
	cursor, err := r.coll.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var checkins []model.Checkin
	if err := cursor.All(ctx, &checkins); err != nil {
		return nil, err
	}
	return checkins, nil
}

package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

var ErrChallengeCooldown = errors.New("challenge is cooling down")

type ChallengeRepo struct {
	coll        *database.Collection
	collections *database.Collections
}

func NewChallengeRepo(db *database.Collections) *ChallengeRepo {
	return &ChallengeRepo{
		coll:        db.Collection("challenge_progress"),
		collections: db,
	}
}

func ChallengeProgressID(userID, challengeType, challengeID string) string {
	return userID + ":" + challengeType + ":" + challengeID
}

func (r *ChallengeRepo) ListByUser(
	ctx context.Context,
	userID string,
) ([]model.ChallengeProgress, error) {
	cursor, err := r.coll.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var progress []model.ChallengeProgress
	if err := cursor.All(ctx, &progress); err != nil {
		return nil, err
	}
	return progress, nil
}

func (r *ChallengeRepo) AcquireCompletion(
	ctx context.Context,
	progress model.ChallengeProgress,
	now time.Time,
) error {
	id := ChallengeProgressID(
		progress.UserID,
		progress.ChallengeType,
		progress.ChallengeID,
	)
	result, err := r.coll.UpdateOne(
		ctx,
		bson.M{
			"_id": id,
			"$or": []bson.M{
				{"cooldown_until": bson.M{"$lte": now}},
				{"cooldown_until": bson.M{"$exists": false}},
			},
		},
		bson.M{
			"$set": bson.M{
				"user_id":           progress.UserID,
				"challenge_type":    progress.ChallengeType,
				"challenge_id":      progress.ChallengeID,
				"mode":              progress.Mode,
				"last_completed_at": progress.LastCompletedAt,
				"cooldown_until":    progress.CooldownUntil,
			},
			"$inc": bson.M{"completed_count": 1},
			"$max": bson.M{"best_score": progress.BestScore},
		},
		options.Update().SetUpsert(true),
	)
	if errors.Is(err, database.ErrDuplicateWrite) {
		return ErrChallengeCooldown
	}
	if err != nil {
		return fmt.Errorf("acquire challenge completion: %w", err)
	}
	if result.MatchedCount == 0 && result.UpsertedCount == 0 {
		return ErrChallengeCooldown
	}
	return nil
}

func (r *ChallengeRepo) WithTransaction(
	ctx context.Context,
	operation func(context.Context) error,
) error {
	return r.collections.WithTransaction(ctx, operation)
}

package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
)

var ErrAIRateLimited = errors.New("AI request rate limited")

type AIUsageRepo struct {
	coll        *database.Collection
	collections *database.Collections
}

func NewAIUsageRepo(db *database.Collections) *AIUsageRepo {
	return &AIUsageRepo{
		coll:        db.Collection("ai_usage"),
		collections: db,
	}
}

func (r *AIUsageRepo) Consume(
	ctx context.Context,
	userID string,
	now time.Time,
	minuteLimit int64,
	dailyLimit int64,
) error {
	return r.collections.WithTransaction(ctx, func(transactionContext context.Context) error {
		minuteBucket := now.UTC().Format("200601021504")
		dayBucket := now.UTC().Format("20060102")
		if err := r.consumeBucket(
			transactionContext,
			userID+":minute:"+minuteBucket,
			userID,
			"minute",
			minuteLimit,
			now.Add(2*time.Minute),
		); err != nil {
			return err
		}
		return r.consumeBucket(
			transactionContext,
			userID+":day:"+dayBucket,
			userID,
			"day",
			dailyLimit,
			now.Add(48*time.Hour),
		)
	})
}

func (r *AIUsageRepo) consumeBucket(
	ctx context.Context,
	id string,
	userID string,
	period string,
	limit int64,
	expiresAt time.Time,
) error {
	// A conditional upsert performs the limit check and increment as one atomic
	// write. When an existing bucket has reached its limit, the filter no longer
	// matches and the attempted upsert collides with the deterministic _id; that
	// duplicate-key result is the expected rate-limit signal.
	result, err := r.coll.UpdateOne(
		ctx,
		bson.M{
			"_id":   id,
			"count": bson.M{"$lt": limit},
		},
		bson.M{
			"$inc": bson.M{"count": 1},
			"$setOnInsert": bson.M{
				"user_id":    userID,
				"period":     period,
				"expires_at": expiresAt,
			},
		},
		options.Update().SetUpsert(true),
	)
	if errors.Is(err, database.ErrDuplicateWrite) {
		return ErrAIRateLimited
	}
	if err != nil {
		return fmt.Errorf("consume AI usage: %w", err)
	}
	if result.MatchedCount == 0 && result.UpsertedCount == 0 {
		return ErrAIRateLimited
	}
	return nil
}

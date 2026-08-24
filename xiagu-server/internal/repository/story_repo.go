package repository

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

type StoryRepo struct {
	definitions *database.Collection
	progress    *database.Collection
	collections *database.Collections
}

func NewStoryRepo(db *database.Collections) *StoryRepo {
	return &StoryRepo{
		definitions: db.Collection("stories"),
		progress:    db.Collection("story_progress"),
		collections: db,
	}
}

func StoryProgressID(userID, storyID, mode string) string {
	return userID + ":" + storyID + ":" + mode
}

func (r *StoryRepo) GetDefinition(
	ctx context.Context,
	storyID string,
) (*model.StoryDefinition, error) {
	var definition model.StoryDefinition
	err := r.definitions.FindOne(ctx, bson.M{
		"_id":    storyID,
		"status": "active",
	}).Decode(&definition)
	if err != nil {
		return nil, err
	}
	return &definition, nil
}

func (r *StoryRepo) GetProgress(
	ctx context.Context,
	userID, storyID, mode string,
) (*model.StoryProgress, error) {
	var progress model.StoryProgress
	err := r.progress.FindOne(ctx, bson.M{
		"_id": StoryProgressID(userID, storyID, mode),
	}).Decode(&progress)
	if err != nil {
		return nil, err
	}
	return &progress, nil
}

func (r *StoryRepo) CreateProgress(
	ctx context.Context,
	progress *model.StoryProgress,
) error {
	_, err := r.progress.InsertOne(ctx, progress)
	return err
}

// InitializeProgress creates a missing progress document or repairs a legacy
// document that has the deterministic ID but lacks authoritative fields. A
// valid existing progress never matches this filter and is not overwritten.
func (r *StoryRepo) InitializeProgress(
	ctx context.Context,
	progress *model.StoryProgress,
) error {
	result, err := r.progress.UpdateOne(
		ctx,
		bson.M{
			"_id": progress.ID,
			"$or": bson.A{
				bson.M{"user_id": bson.M{"$exists": false}},
				bson.M{"user_id": ""},
				bson.M{"story_id": bson.M{"$exists": false}},
				bson.M{"story_id": ""},
				bson.M{"mode": bson.M{"$exists": false}},
				bson.M{"mode": ""},
				bson.M{"current_node_id": bson.M{"$exists": false}},
				bson.M{"current_node_id": ""},
				bson.M{"status": bson.M{"$exists": false}},
				bson.M{"status": ""},
				bson.M{"revision": bson.M{"$lt": 1}},
			},
		},
		bson.M{"$set": bson.M{
			"user_id":              progress.UserID,
			"story_id":             progress.StoryID,
			"hero_id":              progress.HeroID,
			"mode":                 progress.Mode,
			"current_node_id":      progress.CurrentNodeID,
			"completed_nodes":      progress.CompletedNodes,
			"claimed_reward_nodes": progress.ClaimedRewardNodes,
			"choices":              progress.Choices,
			"status":               progress.Status,
			"revision":             progress.Revision,
			"story_version":        progress.StoryVersion,
			"started_at":           progress.StartedAt,
			"updated_at":           progress.UpdatedAt,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 && result.UpsertedCount == 0 {
		return fmt.Errorf("%w: story progress initialized concurrently", database.ErrDatabaseConflict)
	}
	return nil
}

func (r *StoryRepo) ReplaceProgress(
	ctx context.Context,
	progress *model.StoryProgress,
	expectedRevision int64,
) error {
	if expectedRevision < 1 || expectedRevision > int64(^uint32(0)>>1) {
		return fmt.Errorf("%w: story progress revision is invalid", database.ErrDatabaseConflict)
	}

	// CloudBase stores relaxed integral values as numberInt. Preserve that BSON
	// type explicitly in the optimistic-lock predicate.
	result, err := r.progress.UpdateOne(
		ctx,
		bson.M{
			"_id":      progress.ID,
			"revision": int32(expectedRevision),
		},
		bson.M{"$set": bson.M{
			"current_node_id":      progress.CurrentNodeID,
			"completed_nodes":      progress.CompletedNodes,
			"claimed_reward_nodes": progress.ClaimedRewardNodes,
			"choices":              progress.Choices,
			"status":               progress.Status,
			"revision":             progress.Revision,
			"updated_at":           progress.UpdatedAt,
			"completed_at":         progress.CompletedAt,
		}},
	)
	if err != nil {
		return err
	}
	if result.MatchedCount != 1 {
		return fmt.Errorf("%w: story progress revision changed", database.ErrDatabaseConflict)
	}
	return nil
}

func (r *StoryRepo) DeleteProgress(
	ctx context.Context,
	userID, storyID, mode string,
) error {
	_, err := r.progress.DeleteOne(ctx, bson.M{
		"_id": StoryProgressID(userID, storyID, mode),
	})
	return err
}

func (r *StoryRepo) WithTransaction(
	ctx context.Context,
	operation func(context.Context) error,
) error {
	return r.collections.WithTransaction(ctx, operation)
}

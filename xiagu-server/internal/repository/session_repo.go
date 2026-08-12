package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

type SessionRepo struct {
	coll *mongo.Collection
}

func NewSessionRepo(db *database.Collections) *SessionRepo {
	return &SessionRepo{coll: db.Collection("ai_sessions")}
}

func (r *SessionRepo) GetByUser(ctx context.Context, userID string) (*model.AISession, error) {
	var session model.AISession
	err := r.coll.FindOne(ctx, bson.M{"user_id": userID}).Decode(&session)
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *SessionRepo) Create(ctx context.Context, s *model.AISession) error {
	s.CreatedAt = time.Now()
	s.UpdatedAt = time.Now()
	s.ExpiresAt = time.Now().Add(24 * time.Hour)
	result, err := r.coll.InsertOne(ctx, s)
	if err != nil {
		return err
	}
	s.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *SessionRepo) AppendMessages(ctx context.Context, sessionID primitive.ObjectID, msgs []model.ChatMessage) error {
	_, err := r.coll.UpdateOne(ctx, bson.M{"_id": sessionID}, bson.M{
		"$push": bson.M{
			"messages": bson.M{"$each": msgs},
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	})
	return err
}

package database

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func EnsureCoreIndexes(
	ctx context.Context,
	collections *Collections,
) error {
	_, err := collections.Collection("users").Indexes().CreateOne(
		ctx,
		mongo.IndexModel{
			Keys: bson.D{
				{Key: "openid", Value: 1},
			},
			Options: options.Index().
				SetName("users_openid_unique").
				SetUnique(true),
		},
	)
	if err != nil {
		return fmt.Errorf("create users openid index: %w", err)
	}

	_, err = collections.Collection("admins").Indexes().CreateOne(
		ctx,
		mongo.IndexModel{
			Keys: bson.D{
				{Key: "username", Value: 1},
			},
			Options: options.Index().
				SetName("admins_username_unique").
				SetUnique(true),
		},
	)
	if err != nil {
		return fmt.Errorf(
			"create admins username index: %w",
			err,
		)
	}

	return nil
}

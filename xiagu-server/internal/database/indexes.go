package database

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
)

func EnsureCoreIndexes(
	ctx context.Context,
	collections *Collections,
) error {
	commands := []any{
		bson.M{
			"createIndexes": collections.Collection("users").Name(),
			"indexes": []any{bson.M{
				"key":    bson.D{{Key: "openid", Value: 1}},
				"name":   "users_openid_unique",
				"unique": true,
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("admins").Name(),
			"indexes": []any{bson.M{
				"key":    bson.D{{Key: "username", Value: 1}},
				"name":   "admins_username_unique",
				"unique": true,
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("ai_sessions").Name(),
			"indexes": []any{
				bson.M{
					"key": bson.D{
						{Key: "user_id", Value: 1},
						{Key: "current_mode", Value: 1},
					},
					"name":   "ai_sessions_user_unique",
					"unique": true,
				},
				bson.M{
					"key":                bson.D{{Key: "expires_at", Value: 1}},
					"name":               "ai_sessions_ttl",
					"expireAfterSeconds": 0,
				},
			},
		},
		bson.M{
			"createIndexes": collections.Collection("ai_usage").Name(),
			"indexes": []any{bson.M{
				"key":                bson.D{{Key: "expires_at", Value: 1}},
				"name":               "ai_usage_ttl",
				"expireAfterSeconds": 0,
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("checkins").Name(),
			"indexes": []any{bson.M{
				"key": bson.D{
					{Key: "user_id", Value: 1},
					{Key: "poi_id", Value: 1},
					{Key: "checkin_at", Value: -1},
				},
				"name": "checkins_user_poi_time",
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("checkin_guards").Name(),
			"indexes": []any{bson.M{
				"key":  bson.D{{Key: "last_checkin_at", Value: 1}},
				"name": "checkin_guards_last_checkin_at",
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("user_inventory").Name(),
			"indexes": []any{bson.M{
				"key": bson.D{
					{Key: "user_id", Value: 1},
					{Key: "item_id", Value: 1},
				},
				"name":   "user_inventory_owner_unique",
				"unique": true,
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("merch_orders").Name(),
			"indexes": []any{bson.M{
				"key": bson.D{
					{Key: "user_id", Value: 1},
					{Key: "hero_id", Value: 1},
				},
				"name":   "merch_orders_user_hero_unique",
				"unique": true,
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("story_progress").Name(),
			"indexes": []any{bson.M{
				"key": bson.D{
					{Key: "user_id", Value: 1},
					{Key: "story_id", Value: 1},
					{Key: "mode", Value: 1},
				},
				"name":   "story_progress_owner_unique",
				"unique": true,
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("challenge_progress").Name(),
			"indexes": []any{bson.M{
				"key": bson.D{
					{Key: "user_id", Value: 1},
					{Key: "challenge_type", Value: 1},
					{Key: "challenge_id", Value: 1},
				},
				"name":   "challenge_progress_owner_unique",
				"unique": true,
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("achievements").Name(),
			"indexes": []any{bson.M{
				"key":  bson.D{{Key: "user_id", Value: 1}, {Key: "achievement_id", Value: 1}},
				"name": "achievements_owner_unique", "unique": true,
			}},
		},
		bson.M{
			"createIndexes": collections.Collection("pois").Name(),
			"indexes": []any{
				bson.M{"key": bson.D{{Key: "location", Value: "2dsphere"}}, "name": "pois_location_2dsphere"},
				bson.M{"key": bson.D{{Key: "poi_code", Value: 1}}, "name": "pois_code_unique", "unique": true, "sparse": true},
			},
		},
		bson.M{
			"createIndexes": collections.Collection("routes").Name(),
			"indexes": []any{bson.M{
				"key": bson.D{{Key: "route_code", Value: 1}}, "name": "routes_code_unique", "unique": true, "sparse": true,
			}},
		},
	}

	if _, err := collections.RunCommands(ctx, commands, ""); err != nil {
		return fmt.Errorf("create core CloudBase database indexes: %w", err)
	}
	return nil
}

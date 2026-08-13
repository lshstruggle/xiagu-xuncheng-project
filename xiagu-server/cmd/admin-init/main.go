package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"

	"xiagu-server/internal/config"
	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

func main() {
	username := strings.TrimSpace(os.Getenv("ADMIN_USERNAME"))
	password := os.Getenv("ADMIN_PASSWORD")
	nickname := strings.TrimSpace(os.Getenv("ADMIN_NICKNAME"))

	if username == "" {
		log.Fatal("ADMIN_USERNAME is required")
	}
	if len(password) < 12 {
		log.Fatal("ADMIN_PASSWORD must be at least 12 characters")
	}
	if nickname == "" {
		nickname = "超级管理员"
	}

	configPath, err := config.ResolveRuntimeConfigPath(
		os.Getenv("CONFIG_PATH"),
		"configs/config.yaml",
	)
	if err != nil {
		log.Fatalf("resolve config path: %v", err)
	}

	if err := config.Load(configPath); err != nil {
		log.Fatalf("load config: %v", err)
	}

	cfg := config.C
	if strings.TrimSpace(cfg.MongoDB.URI) == "" {
		log.Fatal("MONGODB_URI is required")
	}
	if strings.TrimSpace(cfg.MongoDB.Database) == "" {
		log.Fatal("MONGODB_DATABASE is required")
	}

	connectContext, cancelConnect := context.WithTimeout(
		context.Background(),
		cfg.MongoDB.ConnectTimeout,
	)
	client, err := database.ConnectMongo(
		connectContext,
		cfg.MongoDB,
	)
	cancelConnect()
	if err != nil {
		log.Fatalf("connect MongoDB: %v", err)
	}

	defer func() {
		disconnectContext, cancelDisconnect := context.WithTimeout(
			context.Background(),
			5*time.Second,
		)
		defer cancelDisconnect()

		if err := client.Disconnect(disconnectContext); err != nil {
			log.Printf("disconnect MongoDB: %v", err)
		}
	}()

	collections := database.NewCollections(
		client.Database(cfg.MongoDB.Database),
		cfg.MongoDB.CollectionPrefix,
	)

	indexContext, cancelIndexes := context.WithTimeout(
		context.Background(),
		cfg.MongoDB.ConnectTimeout,
	)
	err = database.EnsureCoreIndexes(
		indexContext,
		collections,
	)
	cancelIndexes()
	if err != nil {
		log.Fatalf("ensure indexes: %v", err)
	}

	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Fatalf("hash password: %v", err)
	}

	now := time.Now()
	admin := model.AdminUser{
		Username:     username,
		PasswordHash: string(passwordHash),
		Nickname:     nickname,
		Role:         "super_admin",
		Status:       "active",
		CreatedAt:    now,
	}

	writeContext, cancelWrite := context.WithTimeout(
		context.Background(),
		cfg.MongoDB.ConnectTimeout,
	)
	defer cancelWrite()

	result, err := collections.Collection("admins").UpdateOne(
		writeContext,
		bson.M{"username": username},
		bson.M{
			"$setOnInsert": admin,
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Fatalf("initialize administrator: %v", err)
	}

	if result.UpsertedCount == 0 {
		log.Printf(
			"administrator %q already exists; no changes made",
			username,
		)
		return
	}

	log.Printf(
		"administrator %q created in collection %q",
		username,
		database.CollectionName(
			cfg.MongoDB.CollectionPrefix,
			"admins",
		),
	)
}

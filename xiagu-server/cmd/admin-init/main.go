package main

import (
	"context"
	"flag"
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
	resetPassword := flag.Bool(
		"reset-password",
		false,
		"reset the password of an existing administrator",
	)
	flag.Parse()

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
	client, err := database.NewHTTPClient(
		database.HTTPClientConfig{
			EnvironmentID: cfg.CloudBaseDatabase.EnvironmentID,
			Instance:      cfg.CloudBaseDatabase.Instance,
			Database:      cfg.CloudBaseDatabase.Database,
			BaseURL:       cfg.CloudBaseDatabase.BaseURL,
			Timeout:       cfg.CloudBaseDatabase.Timeout,
		},
		database.StaticToken(cfg.CloudBaseDatabase.APIKey),
	)
	if err != nil {
		log.Fatalf("initialize CloudBase database client: %v", err)
	}

	collections := database.NewCollections(
		client,
		cfg.CloudBaseDatabase.CollectionPrefix,
	)

	indexContext, cancelIndexes := context.WithTimeout(
		context.Background(),
		cfg.CloudBaseDatabase.Timeout,
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
		cfg.CloudBaseDatabase.Timeout,
	)
	defer cancelWrite()

	if *resetPassword {
		result, err := collections.Collection("admins").UpdateOne(
			writeContext,
			bson.M{"username": username},
			bson.M{"$set": bson.M{
				"password_hash": string(passwordHash),
				"status":        "active",
			}},
		)
		if err != nil {
			log.Fatalf("reset administrator password: %v", err)
		}
		if result.MatchedCount == 0 {
			log.Fatalf("administrator %q does not exist", username)
		}
		log.Printf("administrator %q password reset", username)
		return
	}

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
			cfg.CloudBaseDatabase.CollectionPrefix,
			"admins",
		),
	)
}

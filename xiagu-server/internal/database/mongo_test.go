package database

import (
	"context"
	"strings"
	"testing"
	"time"

	"xiagu-server/internal/config"
)

func TestBuildMongoClientOptions(t *testing.T) {
	cfg := config.MongoConfig{
		URI:            "mongodb://cloudbase.example:27017",
		Database:       "cloudbase_database",
		MaxPoolSize:    10,
		MinPoolSize:    0,
		ConnectTimeout: 10 * time.Second,
	}

	clientOptions := BuildMongoClientOptions(cfg)

	if got := clientOptions.GetURI(); got != cfg.URI {
		t.Fatalf("expected MongoDB URI %q, got %q", cfg.URI, got)
	}

	if clientOptions.AppName == nil || *clientOptions.AppName != "xiagu-server" {
		t.Fatalf("expected MongoDB app name %q", "xiagu-server")
	}

	if clientOptions.MaxPoolSize == nil ||
		*clientOptions.MaxPoolSize != cfg.MaxPoolSize {
		t.Fatalf(
			"expected max pool size %d",
			cfg.MaxPoolSize,
		)
	}

	if clientOptions.MinPoolSize == nil ||
		*clientOptions.MinPoolSize != cfg.MinPoolSize {
		t.Fatalf(
			"expected min pool size %d",
			cfg.MinPoolSize,
		)
	}

	if clientOptions.ConnectTimeout == nil ||
		*clientOptions.ConnectTimeout != cfg.ConnectTimeout {
		t.Fatalf(
			"expected connect timeout %s",
			cfg.ConnectTimeout,
		)
	}

	if clientOptions.ServerSelectionTimeout == nil ||
		*clientOptions.ServerSelectionTimeout != cfg.ConnectTimeout {
		t.Fatalf(
			"expected server selection timeout %s",
			cfg.ConnectTimeout,
		)
	}
}

func TestConnectMongoReturnsErrorForCancelledContext(t *testing.T) {
	cfg := config.MongoConfig{
		URI:            "mongodb://test-user:super-secret-password@127.0.0.1:27017",
		Database:       "cloudbase_database",
		MaxPoolSize:    10,
		MinPoolSize:    0,
		ConnectTimeout: 10 * time.Second,
	}

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	client, err := ConnectMongo(ctx, cfg)
	if err == nil {
		t.Fatal("expected MongoDB connection error")
	}

	if client != nil {
		t.Fatal("expected nil MongoDB client after connection failure")
	}

	if !strings.Contains(err.Error(), "ping MongoDB") {
		t.Fatalf("expected ping error context, got %q", err.Error())
	}

	if strings.Contains(err.Error(), "super-secret-password") {
		t.Fatal("MongoDB error must not expose URI credentials")
	}
}

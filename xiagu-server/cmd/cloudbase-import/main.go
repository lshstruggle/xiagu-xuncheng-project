package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/config"
	"xiagu-server/internal/database"
)

func main() {
	collectionName := flag.String("collection", "", "logical collection name")
	filePath := flag.String("file", "", "JSON or Extended JSON array file")
	keyFields := flag.String("key", "", "comma-separated stable business key fields")
	dryRun := flag.Bool("dry-run", false, "validate input without writing data")
	flag.Parse()

	if strings.TrimSpace(*collectionName) == "" || strings.TrimSpace(*filePath) == "" {
		log.Fatal("--collection and --file are required")
	}
	keys := splitKeys(*keyFields)
	if len(keys) == 0 {
		log.Fatal("--key must contain at least one stable business key field")
	}

	documents, err := readDocuments(*filePath)
	if err != nil {
		log.Fatalf("read import data: %v", err)
	}
	if err := validateDocuments(documents, keys); err != nil {
		log.Fatalf("validate import data: %v", err)
	}
	if *dryRun {
		log.Printf("dry-run passed: %d documents for %s", len(documents), *collectionName)
		return
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
	if strings.TrimSpace(cfg.CloudBaseDatabase.EnvironmentID) == "" {
		log.Fatal("CLOUDBASE_ENV_ID is required")
	}
	if strings.TrimSpace(cfg.CloudBaseDatabase.APIKey) == "" {
		log.Fatal("CLOUDBASE_API_KEY is required")
	}

	client, err := database.NewHTTPClient(database.HTTPClientConfig{
		EnvironmentID: cfg.CloudBaseDatabase.EnvironmentID,
		Instance:      cfg.CloudBaseDatabase.Instance,
		Database:      cfg.CloudBaseDatabase.Database,
		BaseURL:       cfg.CloudBaseDatabase.BaseURL,
		Timeout:       cfg.CloudBaseDatabase.Timeout,
	}, database.StaticToken(cfg.CloudBaseDatabase.APIKey))
	if err != nil {
		log.Fatalf("initialize CloudBase database client: %v", err)
	}
	collection := database.NewCollections(
		client,
		cfg.CloudBaseDatabase.CollectionPrefix,
	).Collection(*collectionName)

	ctx, cancel := context.WithTimeout(
		context.Background(),
		time.Duration(len(documents)+1)*cfg.CloudBaseDatabase.Timeout,
	)
	defer cancel()

	for index, document := range documents {
		filter, err := stableFilter(document, keys)
		if err != nil {
			log.Fatalf("document %d: %v", index, err)
		}
		setDocument := bson.M{}
		for key, value := range document {
			if key != "_id" {
				setDocument[key] = value
			}
		}
		_, err = collection.UpdateOne(
			ctx,
			filter,
			bson.M{"$set": setDocument},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			log.Fatalf("upsert document %d: %v", index, err)
		}
	}
	log.Printf("imported %d documents into %s", len(documents), collection.Name())
}

func readDocuments(path string) ([]bson.M, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var documents []bson.M
	if err := bson.UnmarshalExtJSON(data, false, &documents); err != nil {
		return nil, fmt.Errorf("decode JSON/EJSON array: %w", err)
	}
	if len(documents) == 0 {
		return nil, errors.New("import file contains no documents")
	}
	return documents, nil
}

func splitKeys(value string) []string {
	var keys []string
	for _, key := range strings.Split(value, ",") {
		if trimmed := strings.TrimSpace(key); trimmed != "" {
			keys = append(keys, trimmed)
		}
	}
	return keys
}

func validateDocuments(documents []bson.M, keys []string) error {
	seen := map[string]struct{}{}
	for index, document := range documents {
		filter, err := stableFilter(document, keys)
		if err != nil {
			return fmt.Errorf("document %d: %w", index, err)
		}
		encoded, err := bson.MarshalExtJSON(filter, false, false)
		if err != nil {
			return err
		}
		identity := string(encoded)
		if _, exists := seen[identity]; exists {
			return fmt.Errorf("document %d has a duplicate stable key", index)
		}
		seen[identity] = struct{}{}
	}
	return nil
}

func stableFilter(document bson.M, keys []string) (bson.M, error) {
	filter := bson.M{}
	for _, key := range keys {
		value, exists := document[key]
		if !exists || value == nil || strings.TrimSpace(fmt.Sprint(value)) == "" {
			return nil, fmt.Errorf("stable key %q is missing", key)
		}
		filter[key] = value
	}
	return filter, nil
}

package main

import (
	"context"
	"flag"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"

	"xiagu-server/internal/config"
	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
	"xiagu-server/internal/rewardconfig"
)

func main() {
	dryRun := flag.Bool("dry-run", false, "show changes without writing")
	overwrite := flag.Bool("overwrite", false, "replace existing fragment reward configuration")
	flag.Parse()

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

	collection := database.NewCollections(
		client,
		cfg.CloudBaseDatabase.CollectionPrefix,
	).Collection("pois")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		log.Fatalf("list POIs: %v", err)
	}
	defer cursor.Close(ctx)

	var pois []model.POI
	if err := cursor.All(ctx, &pois); err != nil {
		log.Fatalf("decode POIs: %v", err)
	}

	updated := 0
	skipped := 0
	for _, poi := range pois {
		if poi.Rewards != nil && poi.Rewards.Fragments != nil && !*overwrite {
			skipped++
			continue
		}

		fragments, ok := rewardconfig.DefaultFragments(poi.Type)
		if !ok {
			log.Printf("skip POI %q: unsupported type %q", poi.Name, poi.Type)
			skipped++
			continue
		}

		log.Printf(
			"configure POI %q: hero=%d skin=%d first_multiplier=%d",
			poi.Name,
			fragments.HeroFragments,
			fragments.SkinFragments,
			fragments.FirstCheckinMultiplier,
		)
		if *dryRun {
			updated++
			continue
		}

		_, err := collection.UpdateOne(
			ctx,
			bson.M{"_id": poi.ID},
			bson.M{"$set": bson.M{
				"rewards.fragments": fragments,
				"updated_at":        time.Now(),
			}},
		)
		if err != nil {
			log.Fatalf("update POI %q: %v", poi.Name, err)
		}
		updated++
	}

	log.Printf(
		"POI reward backfill completed: collection=%q updated=%d skipped=%d dry_run=%t",
		collection.Name(),
		updated,
		skipped,
		*dryRun,
	)
}

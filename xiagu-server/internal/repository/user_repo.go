package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

type UserRepo struct {
	coll        *database.Collection
	inventory   *database.Collection
	collections *database.Collections
}

func NewUserRepo(db *database.Collections) *UserRepo {
	return &UserRepo{
		coll:        db.Collection("users"),
		inventory:   db.Collection("user_inventory"),
		collections: db,
	}
}

var (
	ErrInsufficientAssets = errors.New("insufficient assets")
	ErrItemAlreadyOwned   = errors.New("item already owned")
)

type ShopExchange struct {
	ItemID   string
	ItemType string
	HeroID   string
	Cost     int
}

// ExchangeShopItem atomically deducts fragments and records ownership. The
// inventory ID is deterministic, so concurrent requests can never create two
// ownership records for the same user and item.
func (r *UserRepo) ExchangeShopItem(
	ctx context.Context,
	userID string,
	exchange ShopExchange,
) (heroFragments int, skinFragments int, err error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return 0, 0, fmt.Errorf("parse user ID: %w", err)
	}
	if exchange.Cost <= 0 {
		return 0, 0, errors.New("shop item cost must be positive")
	}

	balanceField := "hero_fragments"
	if exchange.ItemType == "skin" {
		balanceField = "skin_fragments"
	} else if exchange.ItemType != "hero" {
		return 0, 0, errors.New("unsupported shop item type")
	}

	err = r.collections.WithTransaction(ctx, func(transactionContext context.Context) error {
		inventory := &model.UserInventory{
			ID:         userID + ":" + exchange.ItemID,
			UserID:     userID,
			ItemID:     exchange.ItemID,
			ItemType:   exchange.ItemType,
			HeroID:     exchange.HeroID,
			AcquiredAt: time.Now(),
		}
		if _, insertErr := r.inventory.InsertOne(transactionContext, inventory); insertErr != nil {
			if errors.Is(insertErr, database.ErrDuplicateWrite) {
				return ErrItemAlreadyOwned
			}
			return fmt.Errorf("record shop ownership: %w", insertErr)
		}

		result, updateErr := r.coll.UpdateOne(
			transactionContext,
			bson.M{
				"_id":        objectID,
				balanceField: bson.M{"$gte": exchange.Cost},
			},
			bson.M{
				"$inc": bson.M{balanceField: -exchange.Cost},
				"$set": bson.M{"updated_at": time.Now()},
			},
		)
		if updateErr != nil {
			return fmt.Errorf("deduct shop balance: %w", updateErr)
		}
		if result.MatchedCount != 1 {
			return ErrInsufficientAssets
		}

		return nil
	})
	if err != nil {
		return 0, 0, err
	}

	// CloudBase HTTP transactions are used only for writes. Reading through a
	// transaction can return an empty document even when the normal database
	// endpoint returns the complete record, so read the committed balance using
	// the regular endpoint.
	var balances struct {
		Hero int `bson:"hero_fragments"`
		Skin int `bson:"skin_fragments"`
	}
	if findErr := r.coll.FindOne(
		ctx,
		bson.M{"_id": objectID},
		options.FindOne().SetProjection(bson.M{
			"hero_fragments": 1,
			"skin_fragments": 1,
		}),
	).Decode(&balances); findErr != nil {
		return 0, 0, fmt.Errorf("read committed shop balance: %w", findErr)
	}
	return balances.Hero, balances.Skin, nil
}

func (r *UserRepo) OwnedShopItems(
	ctx context.Context,
	userID string,
) (map[string]struct{}, error) {
	cursor, err := r.inventory.Find(
		ctx,
		bson.M{"user_id": userID},
		options.Find().SetProjection(bson.M{"item_id": 1}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []struct {
		ItemID string `bson:"item_id"`
	}
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	owned := make(map[string]struct{}, len(items))
	for _, item := range items {
		owned[item.ItemID] = struct{}{}
	}
	return owned, nil
}

func (r *UserRepo) GetByOpenID(ctx context.Context, openID string) (*model.User, error) {
	var user model.User
	err := r.coll.FindOne(ctx, bson.M{"openid": openID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var user model.User
	err = r.coll.FindOne(ctx, bson.M{"_id": oid}).Decode(&user)
	return &user, err
}

func (r *UserRepo) UpdateProfile(
	ctx context.Context,
	userID string,
	nickname string,
	avatar string,
) error {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("parse user ID: %w", err)
	}

	result, err := r.coll.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{
		"$set": bson.M{
			"nickname":   nickname,
			"avatar":     avatar,
			"updated_at": time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("update user profile: %w", err)
	}
	if result.MatchedCount != 1 {
		return database.ErrDocumentNotFound
	}
	return nil
}

func (r *UserRepo) Create(ctx context.Context, user *model.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	result, err := r.coll.InsertOne(ctx, user)
	if err != nil {
		return err
	}
	user.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *UserRepo) UpdateHero(ctx context.Context, userID string, heroID string) error {
	oid, _ := primitive.ObjectIDFromHex(userID)
	_, err := r.coll.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{
		"$set": bson.M{
			"current_hero_id": heroID,
			"updated_at":      time.Now(),
		},
	})
	return err
}

// UpdateFragments 更新用户碎片资产（可正可负）
func (r *UserRepo) UpdateFragments(ctx context.Context, userID string, heroDelta, skinDelta int) error {
	oid, _ := primitive.ObjectIDFromHex(userID)
	update := bson.M{
		"$set": bson.M{"updated_at": time.Now()},
	}
	inc := bson.M{}
	if heroDelta != 0 {
		inc["hero_fragments"] = heroDelta
	}
	if skinDelta != 0 {
		inc["skin_fragments"] = skinDelta
	}
	if len(inc) > 0 {
		update["$inc"] = inc
	}
	_, err := r.coll.UpdateOne(ctx, bson.M{"_id": oid}, update)
	return err
}

func (r *UserRepo) CompleteRoute(ctx context.Context, userID, routeCode string) error {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	result, err := r.coll.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{
		"$addToSet": bson.M{"completed_routes": routeCode},
		"$set":      bson.M{"updated_at": time.Now()},
	})
	if err != nil {
		return err
	}
	if result.MatchedCount != 1 {
		return database.ErrDocumentNotFound
	}
	return nil
}

type CheckinUpdate struct {
	CityCode         string
	POIID            string
	HeroID           string
	BondValueInc     int
	HeroFragmentInc  int
	SkinFragmentInc  int
	SpiritBadgeID    string
	BondBookmarkID   string
	SpiritLighthouse bool
	PlayerFootprint  bool
	RewardItems      []model.RewardItem
}

func rewardItemSetUpdates(items []model.RewardItem) bson.M {
	fields := map[string][]string{}
	for _, item := range items {
		if item.ID == "" {
			continue
		}

		var field string
		switch item.Type {
		case "knowledge_card":
			field = "knowledge_cards"
		case "story_fragment":
			field = "story_fragments"
		case "poetry_line":
			field = "poetry_lines"
		case "badge":
			field = "badges"
		case "spirit_badge":
			field = "spirit_badges"
		case "bond_bookmark":
			field = "bond_bookmarks"
		default:
			continue
		}

		duplicate := false
		for _, existing := range fields[field] {
			if existing == item.ID {
				duplicate = true
				break
			}
		}
		if !duplicate {
			fields[field] = append(fields[field], item.ID)
		}
	}

	updates := bson.M{}
	for field, ids := range fields {
		if len(ids) == 1 {
			updates[field] = ids[0]
		} else if len(ids) > 1 {
			updates[field] = bson.M{"$each": ids}
		}
	}
	return updates
}

func (r *UserRepo) UpdateAfterCheckin(ctx context.Context, userID string, u *CheckinUpdate) error {
	oid, _ := primitive.ObjectIDFromHex(userID)

	update := bson.M{
		"$set": bson.M{
			"updated_at": time.Now(),
			fmt.Sprintf("explored_cities.%s.last_visit_date", u.CityCode): time.Now().Format("2006-01-02"),
		},
		"$inc": bson.M{
			fmt.Sprintf("hero_bonds.%s.bond_value", u.HeroID): u.BondValueInc,
		},
		"$addToSet": bson.M{
			fmt.Sprintf("explored_cities.%s.poi_checked_in", u.CityCode): u.POIID,
		},
	}

	inc := update["$inc"].(bson.M)
	if u.HeroFragmentInc != 0 {
		inc["hero_fragments"] = u.HeroFragmentInc
	}
	if u.SkinFragmentInc != 0 {
		inc["skin_fragments"] = u.SkinFragmentInc
	}

	addToSet := update["$addToSet"].(bson.M)
	for field, value := range rewardItemSetUpdates(u.RewardItems) {
		addToSet[field] = value
	}

	if u.SpiritBadgeID != "" {
		addToSet["spirit_badges"] = u.SpiritBadgeID
		addToSet[fmt.Sprintf("explored_cities.%s.spirit_lighthouses_visited", u.CityCode)] = u.POIID
	}
	if u.BondBookmarkID != "" {
		addToSet["bond_bookmarks"] = u.BondBookmarkID
		addToSet[fmt.Sprintf("explored_cities.%s.player_footprints_found", u.CityCode)] = u.POIID
	}

	_, err := r.coll.UpdateOne(ctx, bson.M{"_id": oid}, update)
	return err
}

func (r *UserRepo) ApplyStoryReward(
	ctx context.Context,
	userID string,
	heroID string,
	reward *model.StoryReward,
) error {
	if reward == nil {
		return nil
	}
	if reward.HeroFragments < 0 || reward.SkinFragments < 0 || reward.BondValue < 0 {
		return errors.New("story reward cannot be negative")
	}
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("parse user ID: %w", err)
	}

	update := bson.M{"$set": bson.M{"updated_at": time.Now()}}
	increments := bson.M{}
	if reward.HeroFragments != 0 {
		increments["hero_fragments"] = reward.HeroFragments
	}
	if reward.SkinFragments != 0 {
		increments["skin_fragments"] = reward.SkinFragments
	}
	if reward.BondValue != 0 && heroID != "" {
		increments[fmt.Sprintf("hero_bonds.%s.bond_value", heroID)] = reward.BondValue
	}
	if len(increments) > 0 {
		update["$inc"] = increments
	}
	if items := rewardItemSetUpdates(reward.Items); len(items) > 0 {
		update["$addToSet"] = items
	}
	_, err = r.coll.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	return err
}

func (r *UserRepo) ApplyBossReward(
	ctx context.Context,
	userID string,
	heroID string,
	reward model.BossReward,
) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("parse user ID: %w", err)
	}
	update := bson.M{
		"$inc": bson.M{
			"hero_fragments": reward.HeroFragments,
			"skin_fragments": reward.SkinFragments,
			fmt.Sprintf("hero_bonds.%s.bond_value", heroID): reward.BondValue,
		},
		"$set": bson.M{"updated_at": time.Now()},
	}
	if reward.PosterID != "" {
		update["$addToSet"] = bson.M{"boss_posters": reward.PosterID}
	}
	result, err := r.coll.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	if err != nil {
		return err
	}
	if result.MatchedCount != 1 {
		return database.ErrDocumentNotFound
	}
	return nil
}

func (r *UserRepo) FindOrCreateByOpenID(
	ctx context.Context,
	openID string,
) (*model.User, error) {
	now := time.Now()

	update := bson.M{
		"$set": bson.M{
			"updated_at":    now,
			"last_login_at": now,
		},
		"$setOnInsert": bson.M{
			"openid":           openID,
			"nickname":         "召唤师",
			"status":           "active",
			"current_hero_id":  "libai",
			"hero_bonds":       map[string]*model.HeroBond{},
			"explored_cities":  map[string]*model.CityProgress{},
			"badges":           []string{},
			"spirit_badges":    []string{},
			"bond_bookmarks":   []string{},
			"knowledge_cards":  []string{},
			"story_fragments":  []string{},
			"poetry_lines":     []string{},
			"boss_posters":     []string{},
			"completed_routes": []string{},
			"share_count":      0,
			"coupons":          []model.UserCoupon{},
			"created_at":       now,
		},
	}

	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var user model.User
	err := r.coll.FindOneAndUpdate(
		ctx,
		bson.M{"openid": openID},
		update,
		opts,
	).Decode(&user)
	if err == nil {
		return &user, nil
	}

	if !errors.Is(err, database.ErrDuplicateWrite) {
		return nil, fmt.Errorf("find or create user: %w", err)
	}

	// 另一个并发请求已经创建了相同 openid 的用户。
	if retryErr := r.coll.FindOne(
		ctx,
		bson.M{"openid": openID},
	).Decode(&user); retryErr != nil {
		return nil, fmt.Errorf(
			"load user after concurrent create: %w",
			retryErr,
		)
	}

	return &user, nil
}

func (r *UserRepo) GetStatusByID(
	ctx context.Context,
	userID string,
) (string, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return "", fmt.Errorf("parse user ID: %w", err)
	}

	var result struct {
		Status string `bson:"status"`
	}

	err = r.coll.FindOne(
		ctx,
		bson.M{"_id": objectID},
		options.FindOne().SetProjection(
			bson.M{"status": 1},
		),
	).Decode(&result)
	if err != nil {
		return "", fmt.Errorf("find user status: %w", err)
	}

	return result.Status, nil
}

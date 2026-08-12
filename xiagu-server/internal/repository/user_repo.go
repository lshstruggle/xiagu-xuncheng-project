package repository

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

type UserRepo struct {
	coll *mongo.Collection
}

func NewUserRepo(db *database.Collections) *UserRepo {
	return &UserRepo{coll: db.Collection("users")}
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

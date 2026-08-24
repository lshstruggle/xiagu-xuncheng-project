package repository

import (
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
)

var ErrMerchAlreadyClaimed = errors.New("merchandise already claimed")

type MerchOrderRepo struct {
	coll *database.Collection
}

func NewMerchOrderRepo(db *database.Collections) *MerchOrderRepo {
	return &MerchOrderRepo{coll: db.Collection("merch_orders")}
}

func (r *MerchOrderRepo) Create(ctx context.Context, order *model.MerchOrder) error {
	result, err := r.coll.InsertOne(ctx, order)
	if err != nil {
		if errors.Is(err, database.ErrDuplicateWrite) {
			return ErrMerchAlreadyClaimed
		}
		return err
	}
	order.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

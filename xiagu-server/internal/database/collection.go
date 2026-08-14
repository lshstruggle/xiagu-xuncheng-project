package database

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Collections applies the environment prefix and returns CloudBase HTTP
// collection handles. It deliberately mirrors the small subset of the MongoDB
// driver used by this project so the business layer stays transport agnostic.
type Collections struct {
	client *HTTPClient
	prefix string
}

func NewCollections(client *HTTPClient, prefix string) *Collections {
	return &Collections{client: client, prefix: prefix}
}

func (c *Collections) Collection(name string) *Collection {
	return &Collection{
		client: c.client,
		name:   CollectionName(c.prefix, name),
	}
}

func (c *Collection) Name() string { return c.name }

func (c *Collections) Ping(ctx context.Context) error {
	return c.client.Ping(ctx)
}

func (c *Collections) WithTransaction(
	ctx context.Context,
	operation func(context.Context) error,
) error {
	return c.client.WithTransaction(ctx, operation)
}

func (c *Collections) RunCommands(
	ctx context.Context,
	commands []any,
	transactionID string,
) ([]json.RawMessage, error) {
	return c.client.RunCommands(ctx, commands, transactionID)
}

func CollectionName(prefix string, name string) string {
	return prefix + name
}

type Collection struct {
	client *HTTPClient
	name   string
}

type SingleResult struct {
	raw json.RawMessage
	err error
}

func (r *SingleResult) Decode(value any) error {
	if r.err != nil {
		return r.err
	}
	return unmarshalExtendedJSON(r.raw, value)
}

type Cursor struct {
	documents []json.RawMessage
	position  int
	current   json.RawMessage
}

func (c *Cursor) All(_ context.Context, value any) error {
	data, err := json.Marshal(c.documents)
	if err != nil {
		return err
	}
	return unmarshalExtendedJSON(data, value)
}

func (c *Cursor) Next(_ context.Context) bool {
	if c.position >= len(c.documents) {
		return false
	}
	c.current = c.documents[c.position]
	c.position++
	return true
}

func (c *Cursor) Decode(value any) error {
	if len(c.current) == 0 {
		return errors.New("cursor is not positioned on a document")
	}
	return unmarshalExtendedJSON(c.current, value)
}

func (c *Cursor) Close(context.Context) error { return nil }

type InsertOneResult struct{ InsertedID any }
type InsertManyResult struct{ InsertedIDs []any }
type UpdateResult struct {
	MatchedCount  int64
	ModifiedCount int64
	UpsertedCount int64
}
type DeleteResult struct{ DeletedCount int64 }

func (c *Collection) FindOne(
	ctx context.Context,
	filter any,
	findOptions ...*options.FindOneOptions,
) *SingleResult {
	command := bson.M{"find": c.name, "filter": filter, "limit": int64(1)}
	if len(findOptions) > 0 && findOptions[0] != nil {
		option := findOptions[0]
		if option.Projection != nil {
			command["projection"] = option.Projection
		}
		if option.Sort != nil {
			command["sort"] = option.Sort
		}
		if option.Skip != nil {
			command["skip"] = *option.Skip
		}
	}

	documents, err := c.find(ctx, command)
	if err != nil {
		return &SingleResult{err: err}
	}
	if len(documents) == 0 {
		return &SingleResult{err: ErrDocumentNotFound}
	}
	return &SingleResult{raw: documents[0]}
}

func (c *Collection) Find(
	ctx context.Context,
	filter any,
	findOptions ...*options.FindOptions,
) (*Cursor, error) {
	command := bson.M{"find": c.name, "filter": filter}
	if len(findOptions) > 0 && findOptions[0] != nil {
		option := findOptions[0]
		if option.Projection != nil {
			command["projection"] = option.Projection
		}
		if option.Sort != nil {
			command["sort"] = option.Sort
		}
		if option.Limit != nil {
			command["limit"] = *option.Limit
		}
		if option.Skip != nil {
			command["skip"] = *option.Skip
		}
	}

	documents, err := c.find(ctx, command)
	if err != nil {
		return nil, err
	}
	return &Cursor{documents: documents}, nil
}

func (c *Collection) find(
	ctx context.Context,
	command bson.M,
) ([]json.RawMessage, error) {
	results, err := c.client.RunCommands(ctx, []any{command}, transactionIDFromContext(ctx))
	if err != nil {
		return nil, err
	}
	if len(results) != 1 {
		return nil, errors.New("CloudBase find returned an invalid result")
	}

	var documents []json.RawMessage
	if err := json.Unmarshal(results[0], &documents); err != nil {
		return nil, errors.New("decode CloudBase find result")
	}
	return documents, nil
}

func (c *Collection) InsertOne(
	ctx context.Context,
	document any,
	_ ...*options.InsertOneOptions,
) (*InsertOneResult, error) {
	prepared, id, err := prepareInsertDocument(document)
	if err != nil {
		return nil, err
	}
	_, err = c.client.RunCommands(ctx, []any{bson.M{
		"insert":    c.name,
		"documents": []any{prepared},
	}}, transactionIDFromContext(ctx))
	if err != nil {
		return nil, err
	}
	return &InsertOneResult{InsertedID: id}, nil
}

func (c *Collection) InsertMany(
	ctx context.Context,
	documents []any,
	_ ...*options.InsertManyOptions,
) (*InsertManyResult, error) {
	prepared := make([]any, 0, len(documents))
	ids := make([]any, 0, len(documents))
	for _, document := range documents {
		item, id, err := prepareInsertDocument(document)
		if err != nil {
			return nil, err
		}
		prepared = append(prepared, item)
		ids = append(ids, id)
	}
	_, err := c.client.RunCommands(ctx, []any{bson.M{
		"insert":    c.name,
		"documents": prepared,
	}}, transactionIDFromContext(ctx))
	if err != nil {
		return nil, err
	}
	return &InsertManyResult{InsertedIDs: ids}, nil
}

func prepareInsertDocument(document any) (bson.M, any, error) {
	encoded, err := bson.Marshal(document)
	if err != nil {
		return nil, nil, fmt.Errorf("encode insert document: %w", err)
	}
	var prepared bson.M
	if err := bson.Unmarshal(encoded, &prepared); err != nil {
		return nil, nil, fmt.Errorf("prepare insert document: %w", err)
	}
	id, exists := prepared["_id"]
	objectID, isObjectID := id.(primitive.ObjectID)
	if !exists || id == nil || (isObjectID && objectID.IsZero()) {
		id = primitive.NewObjectID()
		prepared["_id"] = id
	}
	return prepared, id, nil
}

func (c *Collection) UpdateOne(
	ctx context.Context,
	filter any,
	update any,
	updateOptions ...*options.UpdateOptions,
) (*UpdateResult, error) {
	upsert := false
	if len(updateOptions) > 0 && updateOptions[0] != nil && updateOptions[0].Upsert != nil {
		upsert = *updateOptions[0].Upsert
	}
	results, err := c.client.RunCommands(ctx, []any{bson.M{
		"update": c.name,
		"updates": []any{bson.M{
			"q": filter, "u": update, "upsert": upsert, "multi": false,
		}},
	}}, transactionIDFromContext(ctx))
	if err != nil {
		return nil, err
	}
	return decodeUpdateResult(results)
}

// FindOneAndUpdate preserves the repository-facing operation while using two
// HTTP commands. The write itself remains atomic; callers that upsert must keep
// a unique index and handle ErrDuplicateWrite for concurrent creation.
func (c *Collection) FindOneAndUpdate(
	ctx context.Context,
	filter any,
	update any,
	findOptions ...*options.FindOneAndUpdateOptions,
) *SingleResult {
	upsert := false
	returnAfter := false
	var projection any
	if len(findOptions) > 0 && findOptions[0] != nil {
		option := findOptions[0]
		if option.Upsert != nil {
			upsert = *option.Upsert
		}
		if option.ReturnDocument != nil {
			returnAfter = *option.ReturnDocument == options.After
		}
		projection = option.Projection
	}

	var before json.RawMessage
	if !returnAfter {
		result := c.FindOne(ctx, filter)
		if result.err != nil && !errors.Is(result.err, ErrDocumentNotFound) {
			return result
		}
		before = result.raw
	}

	_, err := c.UpdateOne(
		ctx,
		filter,
		update,
		options.Update().SetUpsert(upsert),
	)
	if err != nil {
		return &SingleResult{err: err}
	}
	if !returnAfter {
		if len(before) == 0 {
			return &SingleResult{err: ErrDocumentNotFound}
		}
		return &SingleResult{raw: before}
	}

	if projection != nil {
		return c.FindOne(ctx, filter, options.FindOne().SetProjection(projection))
	}
	return c.FindOne(ctx, filter)
}

func (c *Collection) DeleteOne(
	ctx context.Context,
	filter any,
	_ ...*options.DeleteOptions,
) (*DeleteResult, error) {
	results, err := c.client.RunCommands(ctx, []any{bson.M{
		"delete":  c.name,
		"deletes": []any{bson.M{"q": filter, "limit": 1}},
	}}, transactionIDFromContext(ctx))
	if err != nil {
		return nil, err
	}
	var result struct {
		N int64 `bson:"n"`
	}
	if err := decodeCommandSummary(results, &result); err != nil {
		return nil, err
	}
	return &DeleteResult{DeletedCount: result.N}, nil
}

func (c *Collection) DeleteMany(
	ctx context.Context,
	filter any,
	_ ...*options.DeleteOptions,
) (*DeleteResult, error) {
	results, err := c.client.RunCommands(ctx, []any{bson.M{
		"delete":  c.name,
		"deletes": []any{bson.M{"q": filter, "limit": 0}},
	}}, transactionIDFromContext(ctx))
	if err != nil {
		return nil, err
	}
	var result struct {
		N int64 `bson:"n"`
	}
	if err := decodeCommandSummary(results, &result); err != nil {
		return nil, err
	}
	return &DeleteResult{DeletedCount: result.N}, nil
}

func (c *Collection) CountDocuments(
	ctx context.Context,
	filter any,
	_ ...*options.CountOptions,
) (int64, error) {
	results, err := c.client.RunCommands(ctx, []any{bson.M{
		"count": c.name,
		"query": filter,
	}}, transactionIDFromContext(ctx))
	if err != nil {
		return 0, err
	}
	var result struct {
		N int64 `bson:"n"`
	}
	if err := decodeCommandSummary(results, &result); err != nil {
		return 0, err
	}
	return result.N, nil
}

func (c *Collection) Aggregate(
	ctx context.Context,
	pipeline mongo.Pipeline,
	_ ...*options.AggregateOptions,
) (*Cursor, error) {
	results, err := c.client.RunCommands(ctx, []any{bson.M{
		"aggregate": c.name,
		"pipeline":  pipeline,
		"cursor":    bson.M{},
	}}, transactionIDFromContext(ctx))
	if err != nil {
		return nil, err
	}
	if len(results) != 1 {
		return nil, errors.New("CloudBase aggregate returned an invalid result")
	}
	var documents []json.RawMessage
	if err := json.Unmarshal(results[0], &documents); err != nil {
		return nil, errors.New("decode CloudBase aggregate result")
	}
	return &Cursor{documents: documents}, nil
}

func decodeUpdateResult(results []json.RawMessage) (*UpdateResult, error) {
	var result struct {
		N         int64 `bson:"n"`
		NModified int64 `bson:"nModified"`
		Upserted  []struct {
			Index int `bson:"index"`
		} `bson:"upserted"`
	}
	if err := decodeCommandSummary(results, &result); err != nil {
		return nil, err
	}
	upsertedCount := int64(len(result.Upserted))
	return &UpdateResult{
		MatchedCount:  result.N - upsertedCount,
		ModifiedCount: result.NModified,
		UpsertedCount: upsertedCount,
	}, nil
}

func decodeCommandSummary(results []json.RawMessage, value any) error {
	if len(results) != 1 {
		return errors.New("CloudBase command returned an invalid result")
	}
	var list []json.RawMessage
	if err := json.Unmarshal(results[0], &list); err == nil {
		if len(list) == 0 {
			return errors.New("CloudBase command returned an empty result")
		}
		return unmarshalExtendedJSON(list[0], value)
	}
	return unmarshalExtendedJSON(results[0], value)
}

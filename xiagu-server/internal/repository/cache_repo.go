package repository

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type CacheRepo struct {
	rdb *redis.Client
}

func NewCacheRepo(rdb *redis.Client) *CacheRepo {
	return &CacheRepo{rdb: rdb}
}

func (r *CacheRepo) Get(ctx context.Context, key string) (string, error) {
	return r.rdb.Get(ctx, key).Result()
}

func (r *CacheRepo) Set(ctx context.Context, key, val string, exp time.Duration) error {
	return r.rdb.Set(ctx, key, val, exp).Err()
}

func (r *CacheRepo) Incr(ctx context.Context, key string) (int64, error) {
	return r.rdb.Incr(ctx, key).Result()
}

func (r *CacheRepo) Expire(ctx context.Context, key string, exp time.Duration) error {
	return r.rdb.Expire(ctx, key, exp).Err()
}

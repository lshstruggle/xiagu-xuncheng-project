package database

import (
	"context"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"xiagu-server/internal/config"
)

const mongoAppName = "xiagu-server"

// BuildMongoClientOptions 根据运行配置构造 MongoDB 客户端参数，但不建立网络连接。
func BuildMongoClientOptions(cfg config.MongoConfig) *options.ClientOptions {
	return options.Client().
		ApplyURI(cfg.URI).
		SetAppName(mongoAppName).
		SetMaxPoolSize(cfg.MaxPoolSize).
		SetMinPoolSize(cfg.MinPoolSize).
		SetConnectTimeout(cfg.ConnectTimeout).
		SetServerSelectionTimeout(cfg.ConnectTimeout)
}

// ConnectMongo 创建 MongoDB 客户端并验证数据库节点可访问。
func ConnectMongo(
	ctx context.Context,
	cfg config.MongoConfig,
) (*mongo.Client, error) {
	client, err := mongo.Connect(ctx, BuildMongoClientOptions(cfg))
	if err != nil {
		return nil, errors.New("connect MongoDB")
	}

	if err := client.Ping(ctx, nil); err != nil {
		disconnectContext, cancel := context.WithTimeout(
			context.Background(),
			cfg.ConnectTimeout,
		)
		defer cancel()

		disconnectErr := client.Disconnect(disconnectContext)
		if disconnectErr != nil {
			return nil, fmt.Errorf(
				"ping MongoDB; disconnect failed: %v",
				disconnectErr,
			)
		}

		return nil, errors.New("ping MongoDB")
	}

	return client, nil
}

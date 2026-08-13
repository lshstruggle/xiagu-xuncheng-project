package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"xiagu-server/internal/app"
	"xiagu-server/internal/config"
	"xiagu-server/internal/database"
	"xiagu-server/internal/handler"
	"xiagu-server/internal/repository"
	"xiagu-server/internal/router"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/external/wechat"
	"xiagu-server/pkg/external/yuanqi"
	"xiagu-server/pkg/logger"
)

func main() {
	// 1. 加载配置
	cfgPath, err := config.ResolveRuntimeConfigPath(
		os.Getenv("CONFIG_PATH"),
		"configs/config.yaml",
	)
	if err != nil {
		log.Fatalf("解析配置来源失败: %v", err)
	}

	if err := config.Load(cfgPath); err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	cfg := config.C
	if err := cfg.Validate(); err != nil {
		log.Fatalf("配置校验失败：%v", err)
	}

	// 2. 初始化日志
	logger.Init(cfg.Server.Mode)
	logger.Log.Info("峡谷寻城记 Go后端启动中...")

	// 3. 连接MongoDB
	mongoConnectContext, cancelMongoConnect := context.WithTimeout(
		context.Background(),
		cfg.MongoDB.ConnectTimeout,
	)

	mongoClient, err := database.ConnectMongo(
		mongoConnectContext,
		cfg.MongoDB,
	)
	cancelMongoConnect()

	if err != nil {
		log.Fatalf("MongoDB连接失败: %v", err)
	}
	mongoDatabase := mongoClient.Database(cfg.MongoDB.Database)
	collections := database.NewCollections(
		mongoDatabase,
		cfg.MongoDB.CollectionPrefix,
	)
	indexContext, cancelIndexes := context.WithTimeout(
		context.Background(),
		cfg.MongoDB.ConnectTimeout,
	)
	if err := database.EnsureCoreIndexes(
		indexContext,
		collections,
	); err != nil {
		cancelIndexes()
		log.Fatalf("创建数据库索引失败: %v", err)
	}
	cancelIndexes()
	logger.Log.Info("MongoDB 连接成功")

	// 4. 初始化外部客户端
	yuanqiClient := yuanqi.NewClient(
		cfg.Yuanqi.BaseURL,
		cfg.Yuanqi.Token,
		cfg.Yuanqi.AssistantID,
		cfg.Yuanqi.Timeout,
		cfg.Yuanqi.MaxRetries,
		logger.Log,
	)
	logger.Log.Info("腾讯元器客户端 就绪")

	wechatAuth := wechat.NewAuth(cfg.WeChat.AppID, cfg.WeChat.AppSecret)

	// 5. 初始化各层
	repos := repository.NewRepos(collections)
	svcs, err := service.NewServices(repos, cfg, yuanqiClient, wechatAuth)
	if err != nil {
		log.Fatalf("初始化服务失败: %v", err)
	}
	handlers := handler.NewHandlers(svcs, collections)

	// 6. 创建Gin
	engine := app.BuildEngine(cfg.Server.Mode)

	app.RegisterReadiness(
		engine,
		func(requestContext context.Context) error {
			pingContext, cancelPing := context.WithTimeout(
				requestContext,
				2*time.Second,
			)
			defer cancelPing()

			return mongoClient.Ping(pingContext, nil)
		},
	)

	// 7. 注册路由
	router.Setup(engine, handlers, repos.User, cfg.JWT.Secret)

	// 8. 启动
	srv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%d", cfg.Server.Port),
		Handler: engine,
	}

	go func() {
		logger.Log.Infof("服务启动: http://0.0.0.0:%d", cfg.Server.Port)
		logger.Log.Info("API文档: http://localhost:" + fmt.Sprint(cfg.Server.Port) + "/health")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("启动失败: %v", err)
		}
	}()

	// 10. 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Log.Info("正在关闭...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	mongoClient.Disconnect(ctx)
	logger.Log.Info("服务已关闭")
}

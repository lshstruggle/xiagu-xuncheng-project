# 峡谷寻城记 - Go后端服务 Dockerfile
# 使用多阶段构建减小镜像体积

# 构建阶段
FROM golang:1.23-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache git ca-certificates tzdata

# 设置工作目录
WORKDIR /build

# 复制go模块文件
COPY xiagu-server/go.mod xiagu-server/go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY xiagu-server/ ./

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o server ./cmd/server/main.go

# 运行阶段
FROM alpine:3.19

# 安装运行时依赖
RUN apk --no-cache add ca-certificates tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非root用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder /build/server .

# 复制配置文件（优先使用Docker配置）
COPY docker/xiagu-server/config.docker.yaml ./configs/config.yaml

# 复制TTS缓存文件
COPY xiagu-server/tts_cache ./tts_cache

# 设置权限
RUN chown -R appuser:appgroup /app

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# 启动命令
CMD ["./server"]

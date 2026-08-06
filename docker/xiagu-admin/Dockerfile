# 峡谷寻城记 - 管理后台 Dockerfile
# 使用多阶段构建

# 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /build

# 复制package.json
COPY xiagu-admin/package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY xiagu-admin/ ./

# 构建生产版本
RUN npm run build

# 运行阶段 - 使用nginx
FROM nginx:alpine

# 安装必要工具
RUN apk add --no-cache curl

# 复制构建产物到nginx目录
COPY --from=builder /build/dist /usr/share/nginx/html

# 复制nginx配置
COPY docker/xiagu-admin/nginx.conf /etc/nginx/conf.d/default.conf

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]

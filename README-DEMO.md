# 🎮 峡谷寻城记 - Demo 部署指南

> 为比赛评委准备的快速体验版本

## 📋 项目简介

**峡谷寻城记** 是一款结合王者荣耀IP与城市探索的LBS（基于位置服务）小程序游戏。用户在成都实地打卡景点，触发李白等游戏英雄的语音讲解，解锁城市故事。

### 技术架构

| 组件 | 技术栈 | 说明 |
|------|--------|------|
| 后端服务 | Go + Gin | RESTful API服务 |
| 管理后台 | React + Vite + Ant Design | 运营管理平台 |
| 小程序 | Taro + React | 微信小程序前端 |
| 数据库 | MongoDB | 存储POI、路线、用户数据 |
| 缓存 | Redis | 会话缓存、热点数据 |
| TTS服务 | GPT-SoVITS | 李白语音合成（可选） |

---

## 🚀 快速开始（评委版）

### 环境要求

- **Go** 1.23+ 
- **Node.js** 20+
- **Docker** 20.10+
- **Docker Compose** 2.0+

### 启动步骤

#### 第1步：启动数据库（Docker）

```bash
# 进入项目目录
cd xiagu-xuncheng-project

# 启动MongoDB和Redis
docker-compose -f docker-compose.demo.yml up -d

# 等待数据库就绪（约10秒）
docker ps
```

#### 第2步：恢复演示数据

```bash
# 恢复完整数据（包含19个POI、彩蛋、商户、优惠券等）
docker-compose -f docker-compose.demo.yml exec mongodb mongorestore --db xiagu_xuncheng --drop /data/backup/xiagu_xuncheng/

# 验证数据恢复成功
docker exec xiagu-mongodb mongosh xiagu_xuncheng --eval "
  print('POI: ' + db.pois.countDocuments());
  print('路线: ' + db.routes.countDocuments());
  print('彩蛋: ' + db.easter_eggs.countDocuments());
  print('商户: ' + db.merchants.countDocuments());
  print('优惠券: ' + db.coupon_definitions.countDocuments());
"
# 应该显示：POI: 19, 路线: 3, 彩蛋: 7, 商户: 10, 优惠券: 12
```

#### 第2步：启动Go后端（本地运行）

```bash
# 新开终端，进入后端目录
cd xiagu-server

# 安装依赖（首次需要）
go mod download

# 启动后端服务
go run cmd/server/main.go
```

后端服务将在 http://localhost:8080 运行

#### 第3步：启动管理后台（本地运行）

```bash
# 新开终端，进入管理后台目录
cd xiagu-admin

# 安装依赖（首次需要）
npm install

# 启动开发服务器
npm run dev
```

管理后台将在 http://localhost:5173 运行

#### 第4步：可选启动TTS服务

```bash
# 如果需要语音合成功能
docker-compose -f docker-compose.demo.yml --profile with-tts up -d xiagu-tts
```

---

## 📊 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| 管理后台 | http://localhost:5173 | 运营数据可视化 |
| API接口 | http://localhost:8080 | 后端服务接口 |
| API文档 | http://localhost:8080/health | 健康检查 |
| MongoDB | mongodb://localhost:27017 | 数据库 |
| Redis | redis://localhost:6379 | 缓存服务 |
| TTS服务 | http://localhost:9880 | 语音合成（如启动） |

---

## 📁 项目结构

```
xiagu-xuncheng-project/
├── docker-compose.demo.yml    # 数据库Docker配置
├── README-DEMO.md             # 本文件
│
├── xiagu-server/              # Go后端服务
│   ├── cmd/server/            # 主程序入口
│   ├── internal/              # 内部模块
│   ├── configs/               # 配置文件
│   └── go.mod                 # Go依赖
│
├── xiagu-admin/               # React管理后台
│   ├── src/                   # 源代码
│   └── package.json           # Node依赖
│
├── xiagu-miniprogram/         # Taro小程序
│   └── src/                   # 源代码
│
├── docker/                    # Docker配置
│   └── init-scripts/          # 数据库初始化
│
└── 文档资料/                   # PRD、知识库等
```

---

## 🛠️ 常用命令

```bash
# 查看数据库状态
docker-compose -f docker-compose.demo.yml ps

# 查看数据库日志
docker-compose -f docker-compose.demo.yml logs -f mongodb

# 进入MongoDB
docker exec -it xiagu-mongodb mongosh xiagu_xuncheng

# 停止所有Docker服务
docker-compose -f docker-compose.demo.yml down

# 重置数据库（删除所有数据）
docker-compose -f docker-compose.demo.yml down -v
```

---

## 📦 打包提交

将以下文件打包给评委：

```bash
# 创建压缩包
tar -czvf xiagu-xuncheng-demo.tar.gz \
  docker-compose.demo.yml \
  README-DEMO.md \
  docker/init-scripts/ \
  xiagu-server/ \
  xiagu-admin/ \
  xiagu-miniprogram/ \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.wav' \
  --exclude='*.mp4'
```

评委收到后按上述"快速开始"步骤操作即可。

---

## 📝 注意事项

1. **首次启动**需要安装Go和Node.js依赖，请耐心等待
2. **数据库**使用Docker运行，数据会持久化保存
3. **TTS服务**需要较大内存，如电脑配置较低可跳过
4. **小程序**需要在微信开发者工具中导入 `xiagu-miniprogram` 目录

---

## 🔍 故障排查

### 后端启动失败

```bash
# 检查MongoDB是否运行
docker ps | grep mongodb

# 检查端口占用
lsof -i :8080
```

### 管理后台启动失败

```bash
# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 数据库连接失败

```bash
# 检查MongoDB日志
docker logs xiagu-mongodb

# 重新初始化数据
docker exec -i xiagu-mongodb mongosh xiagu_xuncheng < docker/init-scripts/mongo-init.js
```

---

**峡谷寻城记 - 让城市成为你的峡谷！** ⚔️

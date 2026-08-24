# 峡谷寻城记

一款把城市探索、实地打卡和英雄故事结合起来的微信小程序。用户可以在成都探索兴趣点（POI）、完成路线任务、收集城市记忆，并通过李白等英雄的语音与 AI 互动获得沉浸式体验。

> 本项目是一个可运行的全栈原型，包含微信小程序、运营管理后台、Go API 服务和可选的 TTS 语音服务。

## 项目亮点

- **城市探索**：地图 POI、路线进度、签到和地理围栏奖励。
- **游戏化收集**：成就、背包、徽章、剧情、彩蛋、商店与优惠券。
- **英雄互动**：AI 对话、故事讲解和可选的 GPT-SoVITS 语音合成。
- **运营后台**：管理 POI、路线、故事、商户、商品、优惠券和用户数据。
- **云端部署**：后端支持 CloudBase HTTP API；TTS 可独立部署到 GPU 工作空间。

## 技术架构

| 模块 | 技术 |
| --- | --- |
| 微信小程序 | Taro 3 + React + TypeScript + Sass |
| 管理后台 | React + Vite + Ant Design + ECharts |
| API 服务 | Go 1.25 + Gin + JWT |
| 数据层 | MongoDB / CloudBase HTTP API，Redis（本地演示） |
| 语音服务 | GPT-SoVITS（可选） |
| 本地编排 | Docker Compose |

## 目录结构

```text
.
├── xiagu-miniprogram/       # 微信小程序前端
├── xiagu-admin/             # React 运营管理后台
├── xiagu-server/             # Go API 服务
├── tts-deploy/               # TTS 网关、Nginx 与 Supervisor 配置
├── docker/                   # 本地数据库初始化脚本
├── docker-compose.demo.yml   # 演示环境编排
├── README-DEMO.md            # 评委版完整启动指南
└── 文档资料/                 # 产品、部署和迁移文档
```

## 快速开始

### 环境要求

- Node.js 20+
- Go 1.25+
- Docker 20.10+ 与 Docker Compose 2+
- 微信开发者工具（运行小程序时需要）

### 1. 启动本地依赖

```bash
docker compose -f docker-compose.demo.yml up -d
```

### 2. 启动 Go 后端

```bash
cd xiagu-server
cp configs/config.example.yaml configs/config.yaml
go mod download
go run ./cmd/server
```

默认 API 地址为 `http://localhost:8080`，可通过 `/health` 检查服务状态。

### 3. 启动管理后台

```bash
cd xiagu-admin
npm install
npm run dev
```

管理后台默认地址为 `http://localhost:5173`。

### 4. 运行微信小程序

```bash
cd xiagu-miniprogram
npm install
npm run dev:weapp
```

然后使用微信开发者工具打开小程序构建目录。完整的演示数据恢复、端口说明和故障排查请参阅 [`README-DEMO.md`](README-DEMO.md)。

## 配置与安全

请从示例配置创建本地配置文件，并将密钥保留在本机或部署平台的环境变量中：

```bash
cp xiagu-server/configs/config.example.yaml xiagu-server/configs/config.yaml
```

不要提交真实的 JWT 密钥、CloudBase 密钥、数据库密码、TTS 共享密钥或私有小程序配置。模型权重、运行时目录、缓存、日志和 `node_modules` 也不会提交到 GitHub；备份大型模型请使用对象存储、Git LFS 或独立的发布制品。更多说明见 [`GITHUB_BASELINE_MANIFEST.md`](GITHUB_BASELINE_MANIFEST.md)。

## 相关文档

- [演示部署指南](README-DEMO.md)
- [TTS 部署与验收](tts-deploy/README.md)
- [CloudBase 后端重构说明](项目文档/CloudBase后端重构修改说明.md)
- [云开发数据库配置指南](云开发数据库配置指南.md)
- [TTS 生成指南](TTS生成指南.md)

## 开发与测试

```bash
# Go 后端测试
cd xiagu-server
go test ./...

# 管理后台构建与检查
cd ../xiagu-admin
npm run lint
npm run build
```

## 项目状态

当前版本以演示和持续开发为主。部署生产环境前，请补充正式的鉴权配置、数据库备份、监控告警和小程序上线审核流程。

## 许可证

项目源码暂未声明统一开源许可证。若要公开分发或二次开发，请先确认相关代码、素材、模型和第三方 IP 的授权范围。

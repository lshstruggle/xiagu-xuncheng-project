# 峡谷寻城记 CloudBase 后端重构修改说明

## 1. 文档信息

- 文档日期：2026-08-15
- 对应分支：`feature/cloudbase-backend-refactor`
- 验收环境：`xiagu-api-test`
- 验收集合前缀：`test_`
- 已验收的云函数构建版本：`20260814T130002Z`
- 当前状态：测试环境核心业务验收通过，正式环境发布尚未执行

> 本文档不记录 AppSecret、JWT Secret、CloudBase API Key、管理员密码或任何 Token。

## 2. 重构结果概要

本轮重构将原本依赖本地 MongoDB、Redis 和 TTS 进程的 Go Gin 服务，调整为可在 CloudBase HTTP 云函数中运行的单一 API 服务。

```text
微信小程序 / 管理后台
            │ HTTPS
            ▼
CloudBase HTTP 访问服务
            │
            ▼
Go Gin HTTP 云函数（0.0.0.0:9000）
            │
            ├─ CloudBase 文档数据库 HTTP API
            ├─ 微信 code2session
            ├─ 腾讯元器文字接口
            └─ CloudBase 云存储固定音频/图片/视频
```

最终技术决策：

- 保留 Gin Router、Handler、Service、Repository 分层。
- 使用 CloudBase HTTP 云函数运行完整 Go API，不拆分为大量小函数。
- 不再使用 MySQL 或外部 Redis。
- 由于 CloudBase 控制台的“MongoDB 连接管理”只支持对接腾讯云 MongoDB 实例，本项目改用 CloudBase 数据库 HTTP API，而非 MongoDB URI 直连。
- AI 仅保留文字回复，不返回实时 TTS 音频。
- 元器凭证通过 CloudBase `YUANQI_TOKEN` 环境变量注入，客户端以 `Authorization: Bearer <token>` 调用；不得将 Token 写入仓库或日志。
- 原有固定剧情音频继续使用 CloudBase 云存储。

## 3. 主要修改内容与原因

### 3.1 云函数启动与可观测性

主要文件：

- `xiagu-server/internal/app/engine.go`
- `xiagu-server/internal/app/health.go`
- `xiagu-server/internal/app/readiness_gate.go`
- `xiagu-server/internal/middleware/request_id.go`
- `xiagu-server/cmd/server/main.go`
- `xiagu-server/deploy/cloudbase/build.sh`
- `xiagu-server/deploy/cloudbase/scf_bootstrap`

修改：

- 抽取可复用 Gin Engine 构建逻辑，保留本地启动能力。
- 云函数监听 `0.0.0.0:9000`。
- 新增 `/health`，返回服务状态、环境和请求 ID。
- 新增 `/ready`，实时检查 CloudBase 数据库可用性。
- 每个请求生成或透传 `X-Request-ID`，便于关联 CloudBase 网关和函数日志。
- 构建脚本交叉编译 Linux amd64 静态二进制，生成 `dist/cloudbase/xiagu-api.zip`。
- 构建时写入 `BuildVersion`，可通过健康接口确认实际部署版本。

原因：CloudBase HTTP 云函数要求应用在指定端口启动；冷启动、数据库失败和网关请求需要可独立诊断。

### 3.2 配置与密钥管理

主要文件：

- `xiagu-server/internal/config/config.go`
- `xiagu-server/internal/config/path.go`
- `xiagu-server/internal/config/validation.go`
- `xiagu-server/configs/config.example.yaml`
- `xiagu-server/deploy/cloudbase/env.test.example`

修改：

- 支持无 YAML 配置文件的纯环境变量启动。
- 开发环境仍可显式指定本地配置文件。
- Serverless 默认值包括端口 9000、release 模式、JWT 7 天、CloudBase 数据库超时 10 秒。
- 启动前校验必填项、JWT 密钥长度、超时、端口和 release CORS 来源。
- 删除 Redis、MongoDB URI 和本地实时 TTS 运行配置；元器 Token 改为仅由云函数环境变量注入。

云端所需配置名：

```text
SERVER_MODE
CLOUDBASE_ENV_ID
CLOUDBASE_API_KEY
CLOUDBASE_DATABASE_INSTANCE
CLOUDBASE_DATABASE_NAME
CLOUDBASE_COLLECTION_PREFIX
WECHAT_APP_ID
WECHAT_APP_SECRET
JWT_SECRET
YUANQI_BASE_URL
YUANQI_TOKEN
YUANQI_ASSISTANT_ID
ALLOWED_ADMIN_ORIGINS
```

原因：云函数不应依赖本地磁盘中的私密配置，也不应将真实密钥提交到 Git。

### 3.3 CloudBase 文档数据库适配层

主要文件：

- `xiagu-server/internal/database/http_client.go`
- `xiagu-server/internal/database/collection.go`
- `xiagu-server/internal/database/indexes.go`
- 删除 `xiagu-server/internal/database/mongo.go`

修改：

- 实现 CloudBase 数据库 Commands HTTP Client。
- 实现与旧 Repository 调用形状接近的 `Collection`、`Cursor`、`SingleResult`、`UpdateResult` 适配层。
- 支持 `FindOne`、`Find`、`InsertOne/Many`、`UpdateOne`、`FindOneAndUpdate`、`DeleteOne/Many`、`CountDocuments`、`Aggregate`。
- 实现 CloudBase 事务开始、提交、回滚及冲突重试。
- 识别 `ACCESS_TOKEN_INVALID`、`DATABASE_TRANSACTION_CONFLICT`、重复键等 CloudBase 错误。
- 集合名统一经过 `CLOUDBASE_COLLECTION_PREFIX`，实现 `test_*` 与正式数据隔离。

原因：CloudBase 当前控制台不能向该项目提供可直连的内置 MongoDB URI；适配层可在尽量不改业务分层的前提下切换底层通信方式。

### 3.4 Redis 和实时 TTS 移除

修改：

- 删除 Redis Client 初始化、配置、Repository 和启动失败阻断。
- 删除后端实时 TTS Handler/Service 依赖。
- AI 接口固定返回文字语义，`audio_ready=false`。
- AI 限流改为 `ai_usage` 时间桶文档，使用 TTL 索引清理。
- AI 会话继续写入 `ai_sessions`，使用用户+模式唯一索引和 TTL。

原因：Redis 未被核心业务实际依赖，CloudBase 不提供原生 Redis；实时 TTS 模型不适合与轻量 HTTP 云函数同实例运行。

### 3.5 微信用户认证

主要文件：

- `xiagu-server/pkg/external/wechat/auth.go`
- `xiagu-server/pkg/auth/jwt.go`
- `xiagu-server/internal/middleware/auth.go`
- `xiagu-server/internal/repository/user_repo.go`
- `xiagu-server/internal/handler/user_handler.go`

修改：

- `/api/v1/user/login` 使用真实微信 `code2session`。
- 按微信 OpenID 幂等查找或创建用户。
- `users.openid` 唯一索引防止并发重复用户。
- 用户 JWT 默认有效期 7 天，只代表当前微信用户。
- 删除 `debug_login_code`、共享调试 Token 和任何 Token 回退。
- 认证中间件实时检查用户状态，封禁用户无法继续访问。
- 不向小程序返回 OpenID。

原因：旧共享调试账号会造成不同微信用户共享资产、剧情和打卡数据。

### 3.6 管理员认证

主要文件：

- `xiagu-server/cmd/admin-init/main.go`
- `xiagu-server/internal/handler/admin_handler.go`
- `xiagu-server/internal/middleware/admin_auth.go`
- `xiagu-server/pkg/util/jwt.go`

修改：

- 管理员密码使用 bcrypt 哈希存储。
- 管理员 JWT 有效期 2 小时，与用户 JWT Claims 分离。
- 删除硬编码管理员密码和默认管理员密钥。
- `admin-init` 可幂等创建管理员。
- 新增 `admin-init --reset-password`，只允许重置已存在账号的密码并恢复 active 状态。

原因：硬编码账号与密钥无法安全进入云环境，且用户与管理员应使用不同的权限语义。

### 3.7 服务端权威打卡与奖励

主要文件：

- `xiagu-server/internal/rewardconfig/defaults.go`
- `xiagu-server/internal/service/checkin_service.go`
- `xiagu-server/internal/repository/checkin_repo.go`
- `xiagu-server/internal/repository/user_repo.go`
- `xiagu-server/cmd/poi-reward-backfill/main.go`

修改：

- POI 奖励由云端数据配置，前端不再决定最终奖励数量。
- 服务端校验坐标、触发半径、容差、POI 状态和 24 小时冷却。
- 使用 `checkin_guards` 原子冷却锁防止并发重复打卡。
- 在 CloudBase 事务中同时完成打卡记录、碎片、羁绊、卡片与成就相关状态更新。
- 首次打卡奖励由服务端判定，重复打卡返回 409，不重复加资产。
- 兼容前端旧英雄 ID `li_bai`，在服务端规范化为 `libai`。

原因：本地奖励不可作为权威资产；并发请求下必须防止重复发奖。

### 3.8 POI 和路线稳定标识

主要文件：

- `xiagu-server/internal/repository/poi_repo.go`
- `xiagu-server/cmd/content-id-backfill/main.go`

修改：

- POI 新增稳定 `poi_code`，路线新增稳定 `route_code`。
- 路线的 POI 顺序改为引用 `poi_code`，不依赖不稳定 ObjectID。
- 为已上线小程序保留数字地图 ID `1..32` 的后端兼容映射。
- 小程序可传 MongoDB ObjectID、`poi_code` 或旧数字 ID。
- 补入原 CloudBase 数据库缺失的 13 个前端 POI，包括“融舍·村里民宿”。
- 幂等补入完成后，测试数据为 32 个 POI、3 条路线。

原因：已上线前端使用数字地图 Marker ID，直接当 ObjectID 查询会返回“POI 不存在”；兼容层避免大规模修改旧页面。

### 3.9 剧情、挑战、路线和成就

主要文件：

- `internal/model/story.go`、`repository/story_repo.go`、`service/story_service.go`
- `internal/model/challenge.go`、`repository/challenge_repo.go`、`service/challenge_service.go`
- `service/route_progress_service.go`
- `internal/model/achievement.go`、`repository/achievement_repo.go`、`service/achievement_service.go`
- `xiagu-server/seeds/`

修改：

- 剧情定义与用户进度分离，进度写入 `story_progress`。
- 剧情启动幂等，推进/暂停/恢复使用 `revision` 乐观并发控制。
- 重复推进、过期 revision 和非法状态返回 409。
- Boss 挑战在服务端校验距离、完成阈值、冷却和奖励。
- 路线完成要求所有指定 POI 已打卡，奖励和完成状态原子写入。
- 成就由云端权威进度计算，解锁状态持久化。

原因：这些状态会影响奖励和用户进度，不能只依赖前端 Storage。

### 3.10 商城和周边订单

修改：

- 商城兑换使用 CloudBase 事务，同时扣减碎片和写入 `user_inventory`。
- 用户+商品唯一索引防止重复兑换。
- 余额不足、已拥有商品返回 409，不返回通用 500。
- 周边订单在服务端校验姓名、中国大陆手机号、地址和英雄 Lv.10 羁绊资格。
- `merch_orders(user_id, hero_id)` 唯一索引防止同英雄重复领取。
- 自动化测试确认数据库命令和错误中不包含 CloudBase 凭据。

### 3.11 统一错误语义

修改：

- Handler 层区分 400、401、404、409、429、500、503、504。
- 业务错误使用 `AppError`映射，不再统一返回 500。
- 已验证的典型语义包括：参数错误 400、未认证 401、资源不存在 404、冷却/版本冲突/余额不足 409、AI 限流 429、依赖不可用 503。

### 3.12 小程序最小连接修改

主要文件：

- `xiagu-miniprogram/src/services/api.ts`
- `xiagu-miniprogram/src/services/auth.ts`

修改：

- API Base URL 改为 CloudBase HTTPS 域名。
- 只在存在 Token 时添加 `Authorization` 请求头。
- 删除 `DEBUG_TOKEN`、localhost 与调试 Token 回退。
- 多个页面同时启动时共用单一微信登录 Promise。
- 受保护请求在无 Token 时等待登录，避免 `assets -> 401 -> login` 竞态。
- Token 过期时自动重新登录并仅重试一次。
- 未重写打卡页面、剧情页面或其他视觉逻辑。

原因：后端改为真实用户 JWT 后，页面必须在受保护请求前完成登录；这是使已上线小程序连接云端 API 的必要最小修改。

## 4. 数据集合与索引

核心集合：

- `users`
- `admins`
- `pois`
- `routes`
- `checkins`
- `checkin_guards`
- `ai_sessions`
- `ai_usage`
- `story_progress`
- `user_inventory`
- `achievements`
- `challenge_progress`
- `merch_orders`
- 原有商户、优惠券、彩蛋及用户彩蛋收藏集合

核心索引：

- `users.openid` 唯一。
- `admins.username` 唯一。
- `pois.location` 2dsphere。
- `pois.poi_code` 稀疏唯一。
- `routes.route_code` 稀疏唯一。
- `checkins(user_id, poi_id, checkin_at)` 组合索引。
- `ai_sessions(user_id, current_mode)` 唯一，`expires_at` TTL。
- `ai_usage.expires_at` TTL。
- `story_progress(user_id, story_id, mode)` 唯一。
- `challenge_progress(user_id, challenge_type, challenge_id)` 唯一。
- `achievements(user_id, achievement_id)` 唯一。
- `user_inventory(user_id, item_id)` 唯一。
- `merch_orders(user_id, hero_id)` 唯一。

## 5. 数据导入与维护工具

### `cmd/cloudbase-import`

- 导入公共种子数据。
- 支持集合前缀和幂等导入。
- 不导入旧共享演示用户资产、剧情、打卡或 AI 会话。

### `cmd/poi-reward-backfill`

- 为 POI 写入服务端权威碎片奖励。
- 支持 `--dry-run`。
- 已验证第二次执行为 `updated=0`。

### `cmd/content-id-backfill`

- 补入 POI/Route 稳定业务 ID。
- 补入前端已存在、CloudBase 中缺失的 13 个 POI。
- 支持 `--dry-run`。
- 最终幂等检查结果：

```text
inserted=0 pois=0 routes=0 dry_run=true
```

### `cmd/admin-init`

- 幂等创建 bcrypt 管理员。
- 密码最少 12 个字符。
- `--reset-password` 只重置已存在的指定管理员。

## 6. 已完成的测试和云端验收

### 6.1 自动化检查

- `go test ./cmd/... ./internal/... ./pkg/...` 通过。
- `go vet ./cmd/... ./internal/... ./pkg/...` 通过。
- 核心 Repository、Service、Middleware、微信和元器 Client 的 `go test -race` 通过。
- Linux amd64 静态编译通过。
- CloudBase 启动脚本语法检查通过。
- 运行时代码的调试 Token、默认管理员密码、元器 Token 和本地 API 地址扫描通过。
- `npm run build:weapp` 通过。

### 6.2 真实 CloudBase 验收

- `/health` 返回 200，环境为 release。
- `/ready` 返回 ready/database ok。
- 真实微信 code 登录成功，重复登录不生成重复用户。
- 两个微信账号生成不同用户，JWT 分别读取自己的资料和资产。
- B 账号修改英雄不影响 A 账号。
- 超距打卡返回 400，资产不变。
- 正常打卡写入碎片、羁绊和知识卡。
- 首次打卡奖励倍数正确。
- 冷却内重复打卡返回 409，资产不重复增加。
- “融舍·村里民宿”旧数字 ID `8` 打卡成功，奖励正确显示在个人中心。
- POI 共 32 个，缺失 `poi_code` 数量为 0。
- Route 共 3 条，缺失 `route_code` 数量为 0。
- 未打完路线时完成请求返回 409。
- 剧情启动、暂停、恢复、推进、过期 revision 冲突和幂等启动全部通过。
- 商城兑换、重复兑换 409、资产扣减和测试数据恢复通过。
- AI 文字回复、无实时音频、每分钟 5 次成功+1 次 429 通过。
- Boss 超距、未完成、正常完成、冷却和原子奖励通过。
- 成就接口从云端进度返回解锁状态。
- 周边订单无效联系信息返回 400，不满足资格返回 409，未创建真实订单。
- 管理员未认证返回 401；真实管理员登录、资料、32 POI 和 3 Route 查询通过。
- 小程序 Network 中 login、assets、profile、checkin 均返回 200，不再出现首次 assets 401。

## 7. 部署与运维

### 7.1 构建

```bash
cd xiagu-server
./deploy/cloudbase/build.sh
```

上传包：

```text
xiagu-server/dist/cloudbase/xiagu-api.zip
```

### 7.2 部署后检查

```bash
curl -sS "$API_BASE/health" | jq
curl -sS "$API_BASE/ready" | jq
```

### 7.3 验收脚本

- `deploy/cloudbase/story-acceptance.sh`
- `deploy/cloudbase/business-acceptance.sh`
- `deploy/cloudbase/challenge-acceptance.sh`
- `deploy/cloudbase/final-acceptance.sh`

这些脚本不包含真实密钥，通过环境变量接收 Token 和凭据。

### 7.4 管理员密码重置

```bash
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="<新密码>"
go run ./cmd/admin-init --reset-password
unset ADMIN_PASSWORD
```

密码不可从 bcrypt 哈希恢复，忘记后应重置。

## 8. 已知边界与尚未完成项

1. **正式发布尚未执行**

   当前验收的是 `xiagu-api-test` 和 `test_*` 集合。正式 `xiagu-api`、无前缀正式集合、正式管理员和正式数据导入需要单独执行。

2. **管理后台统计仍为原有占位数据**

   `GetDashboardStats`、`GetTrends`、`GetHotPois` 仍返回旧的固定演示数据。本轮为遵循“最小迁移修改”未重写该业务。

3. **管理后台写操作未进行云端破坏性验收**

   已验证管理员登录、资料、POI 和 Route 列表。为避免修改公共内容，未在云端执行 POI/路线/商户/优惠券的真实新增与删除。

4. **周边成功领取未使用真实收件数据云端验收**

   云端验证了 400/409 安全拒绝，本地 HTTP Repository 测试覆盖了有资格订单持久化和重复领取。

5. **小程序全项目 TypeScript 静态检查存在旧问题**

   `npm run build:weapp` 已通过，但 `tsc --noEmit` 会报出多个旧组件、云存储类型和素材声明问题。这些错误不来自本轮 API/登录修改，为避免扩大范围未处理。

6. **实时 TTS 不在 CloudBase 函数中运行**

   若未来恢复 GPT-SoVITS 实时语音，建议单独部署在带 GPU 的长运行服务中，不与 CloudBase HTTP 函数进程合并。

## 9. 正式发布建议步骤

1. 备份 CloudBase 测试数据和需要保留的正式公共数据。
2. 新建正式 `xiagu-api`，使用正式密钥，`CLOUDBASE_COLLECTION_PREFIX` 设为空。
3. 运行核心索引创建。
4. 使用 `cloudbase-import`、`poi-reward-backfill`、`content-id-backfill` 导入及补入公共数据。
5. 对所有补入工具再执行 `--dry-run`，确认输出为 0 变更。
6. 初始化正式管理员，将密码保存到密码管理器。
7. 验证 `/health`、`/ready`、微信登录和两账号隔离。
8. 执行剧情、商城、挑战、周边和管理员的安全验收。
9. 将小程序和管理后台 Base URL 切换为正式路由。
10. 发布小比例体验版，观察函数错误率、冷启动、P95、CloudBase 数据库失败率和元器超时率。

## 10. 回滚方案

- 代码回滚：切回 CloudBase 上一个已验证函数版本。
- 数据回滚：使用发布前备份恢复公共集合；用户资产集合不做覆盖式导入。
- 小程序回滚：切回上一审核版本。
- 不恢复共享调试用户、DEBUG_TOKEN、本地 Redis 或不安全的本地 API 回退。

## 11. 安全注意事项

- CloudBase API Key、微信 AppSecret、JWT Secret 只存在 CloudBase 环境变量或临时终端环境变量中。
- 终端操作完成后执行 `unset` 清除 API Key、密码和 Token。
- 不在聊天、截图、Git Diff、日志或验收文档中记录密钥。
- 如密钥曾经输出到可共享位置，应立即轮换。
- 正式环境 `ALLOWED_ADMIN_ORIGINS` 只配置管理后台正式 HTTPS 域名。

## 12. 结论

Go Gin 后端已在保留原业务分层和已上线小程序主要交互的前提下，完成 CloudBase HTTP 云函数化、CloudBase 文档数据库 HTTP 适配、真实微信用户隔离、权威奖励、并发与幂等控制。

测试环境已完成端到端验收，下一阶段应以“正式环境配置、公共数据幂等导入、小比例发布与可观测性”为主，不再扩大核心业务改造范围。

## 13. 2026-08-15：AI 对话分句流式 TTS

本次将 AI 对话的实时语音恢复为独立的 CloudStudio GPU 服务，不在 CloudBase 函数中加载模型：

```text
小程序 /ai/chat（文字立即显示）
  → CloudBase Go（分句 + 两分钟票据）
  → /ai/tts/segment（用户 JWT + 票据）
  → CloudStudio HTTPS（密钥鉴权）
  → Nginx → Gunicorn 单 worker → GPT-SoVITS 李白模型
```

- 每句最长 35 字；小程序播放当前句时预取下一句 WAV，不再使用 Base64 音频。
- 票据绑定用户、英雄、文本哈希、片段序号与有效期；票据篡改、过期、跨用户或文本不匹配均拒绝。
- Go 客户端连接超时 3 秒、总超时 15 秒、最多 2 个连接，连续 3 次失败后熔断 30 秒。
- CloudStudio 服务只公开 `/health`、`/ready`、`/tts`，采用 1 推理 + 2 排队、15 秒超时、2 GB LRU 缓存、原子写入与不含正文的日志。
- TTS 未配置、服务休眠、429、超时或播放失败都保留 AI 文字和 HTTP 200；关闭 `TTS_ENABLED` 即可回滚为纯文字。

主要文件：`tts_server.py`、`tts-deploy/`、`xiagu-server/internal/service/tts_service.go`、`xiagu-server/pkg/external/sovits/client.go`、`xiagu-miniprogram/src/services/tts-player.ts`。

本地已验证：Python 语法检查、Go 票据/分句/配置测试、Go 编译包测试和小程序 `npm run build:weapp`。完整上传、GPU 推理、Supervisor 自恢复、CloudBase 到 CloudStudio 连通性和真机播放须在部署环境按 `tts-deploy/README.md` 验收。

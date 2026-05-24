# MVP战报功能说明

## 功能概述

每晚22:30，小程序会自动弹出MVP战报弹窗，统计用户当天的打卡记录和运动步数，并可将数据发送给李白智能体（工作流已预留接口）。用户可选择生成MVP战报海报。

## 文件结构

```
src/
├── components/
│   ├── mvp-report-modal/     # MVP战报弹窗组件
│   │   ├── index.tsx
│   │   └── index.scss
│   └── mvp-poster/           # MVP海报展示组件（9:16比例）
│       ├── index.tsx
│       └── index.scss
├── services/
│   └── daily-report.ts       # 每日统计服务
└── app.tsx                   # 添加定时检查逻辑
```

## 核心功能

### 1. 定时触发（app.tsx）
- 每分钟检查一次当前时间
- 在22:30-23:59之间且当天未显示过，则弹出MVP战报弹窗
- 使用 `shouldShowDailyReport()` 判断是否触发

### 2. 数据统计（daily-report.ts）

#### 统计内容：
- **打卡记录**：今日打卡的POI数量和列表
- **运动步数**：从微信运动获取（降级使用本地存储）
- **探索距离**：根据步数估算（0.7米/步）
- **羁绊碎片**：今日收集的羁绊碎片数量

#### 接口说明：
```typescript
// 获取今日统计
getTodayStats(): Promise<DailyCheckinStats>

// 生成MVP战报数据
generateMVPReport(stats: DailyCheckinStats): Promise<MVPReportData>

// 发送给李白智能体（预留接口）
sendToLiBaiAgent(stats: DailyCheckinStats): Promise<void>
```

### 3. 弹窗交互（MVPReportModal）

**弹窗内容：**
- 标题：今日峡谷战报（22:30 每日结算时刻）
- 统计卡片：打卡点数量、步数、探索距离
- 亮点列表：今日成就（打卡X个地点、行走X万步等）
- MVP标识：当打卡≥3个或步数≥10000时显示

**按钮：**
- "暂不生成了"：关闭弹窗，标记今日已显示
- "生成MVP战报"：展示海报

### 4. 海报展示（MVPPoster）

**海报规格：**
- 比例：9:16（竖版海报）
- 尺寸：自适应屏幕，宽度75vw，最大高度70vh
- 图片来源：云存储 `cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/mvp画报.png`

**功能：**
- 海报图片展示
- 数据覆盖层（可选）：日期、打卡数、步数、英雄名
- 保存到相册
- 分享给朋友

## 测试方法

### 1. 模拟模式测试（推荐）
1. 进入打卡页面，点击左上角的"模拟定位"按钮
2. 点击🔖按钮打开羁绊碎片调试面板
3. 点击面板右上角的"🏆"按钮（MVP战报测试按钮）
4. 返回首页，等待弹窗出现（每分钟检查一次）

### 2. 手动重置测试
```typescript
// 在控制台执行
import { resetReportCheck } from './services/daily-report'
resetReportCheck()  // 重置今日检查状态
```

### 3. 修改时间测试（开发环境）
修改 `daily-report.ts` 中的时间判断逻辑，将22:30改为当前时间进行测试。

## 与李白智能体集成

### 当前状态
- 工作流接口已预留：`sendToLiBaiAgent()`
- 当前仅记录日志，未实际调用

### 待生图效果完善后实现
```typescript
// 在 daily-report.ts 中完成实现
export async function sendToLiBaiAgent(stats: DailyCheckinStats): Promise<void> {
  await api.sendToLiBaiAgent({
    stats,
    timestamp: Date.now()
  })
}
```

### 发送数据格式
```typescript
{
  date: "2026-04-09",
  totalCheckins: 5,
  poiList: [...],
  totalSteps: 12580,
  totalDistance: 8806,
  heroBonds: 3,
  collectedFragments: 2
}
```

## 注意事项

1. **时间触发**：只在22:30-23:59之间触发，每天只显示一次
2. **数据存储**：打卡记录使用 `my_checkins` 本地存储键
3. **步数获取**：优先从微信运动获取，失败则使用本地存储
4. **海报图片**：确保云存储中的图片路径正确
5. **权限**：保存图片需要用户授权相册权限

## 自定义配置

### 修改触发时间
在 `services/daily-report.ts` 中修改：
```typescript
export function shouldShowDailyReport(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  
  // 修改这里的时间
  if (hour < 22 || (hour === 22 && minute < 30)) {
    return false
  }
  // ...
}
```

### 修改海报比例
在 `components/mvp-poster/index.scss` 中修改：
```scss
.poster-frame {
  width: 75vw;
  height: 133.33vw;  // 9:16比例
  // 或修改成其他比例，如 3:4 = width * 4/3
}
```

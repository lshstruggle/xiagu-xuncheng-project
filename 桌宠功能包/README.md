# 桌宠 WebPet — 功能包使用说明

> 本文档面向 **AI Agent（如 CodeBuddy、Cursor、Copilot 等）**，用于将桌宠功能完整嵌入到任意 **Next.js 14+ (App Router)** 项目中。

---

## 1. 功能概述

这个桌宠是一个**浮动在页面上的交互式 AI 聊天角色**，具备以下能力：

| 功能 | 说明 |
|------|------|
| 拖拽移动 | 鼠标/触摸按住桌宠本体即可拖动到任意位置 |
| 欢庾语气泡 | 点击或每隔 20 秒随机播放一段打字机效果的文字 |
| AI 聊天 | 输入问题后通过腾讯元器 API 流式返回回复，保留对话历史 |
| 4 种动画状态 | idle / thinking / dragging / clicked，分别对应不同 GIF |
| 气泡智能定位 | 聊天窗口根据桌宠在屏幕左右半区自动调整弹出方向 |
| 移动端适配 | 触摸拖拽支持，移动端(<768px)自动隐藏 |
| 深色模式 | 自动适配 dark mode CSS 变量 |

**GIF 素材位置：** `public/assets/pet/`
- `idle.gif` — 待机状态
- `thinking.gif` — 思考/等待 AI 回复
- `dragging.gif` — 被拖拽中
- `clicked.gif` — 被点击/鼠标悬停

---

## 2. 文件清单

```
桌宠功能包/
├── README.md                        # 本文件（使用说明）
├── components/
│   └── web-pet.tsx                  # ★ 核心组件（复制到目标项目 components/ 下）
├── app/
│   └── api/
│       └── chat/
│           └── route.ts             # ★ 聊天 API 路由（复制到目标项目对应路径）
├── public/
│   └── assets/
│       └── pet/
│           ├── idle.gif             # ★ 4个GIF素材（放入目标项目 public/assets/pet/）
│           ├── thinking.gif
│           ├── dragging.gif
│           └── clicked.gif
├── styles/
│   ├── globals.css                  # ★ CSS变量 + wiggle动画（合并到目标项目 globals.css）
│   └── tailwind-preset.ts           # Tailwind颜色预设（合并到 tailwind.config.ts）
```

### 你需要在目标项目中确保存在的文件和路径：

| 目标文件 | 来源 | 说明 |
|----------|------|------|
| `components/web-pet.tsx` | 复制 `components/web-pet.tsx` | 直接复制，无需修改 |
| `app/api/chat/route.ts` | 复制 `app/api/chat/route.ts` | 直接复制，需配置环境变量 |
| `public/assets/pet/*.gif` | 复制 4 个 GIF | 路径必须为 `public/assets/pet/` |
| `app/globals.css` 追加内容 | 合并 `styles/globals.css` | CSS变量 + wiggle 动画 |
| `tailwind.config.ts` 补充 | 合并 `styles/tailwind-preset.ts` | 添加 color token |

---

## 3. 依赖项

在目标项目的 `package.json` 中确保已安装：

```bash
npm install lucide-react        # 图标库（CircleHelp, Send, X, Loader2）
npm install tailwindcss-animate # Tailwind 动画工具类
```

如果项目使用 pnpm/yarn/bun，改为对应包管理器的安装命令。

其他依赖（react, next, tailwindcss）通常已存在于任何 Next.js 项目中。

---

## 4. 嵌入步骤（严格按顺序执行）

### 步骤 1：复制文件到目标项目

```bash
# 在目标项目根目录执行（假设功能包在 ../桌宠功能包/）

# 复制组件
cp ../桌宠功能包/components/web-pet.tsx components/web-pet.tsx

# 复制 API 路由
mkdir -p app/api/chat
cp ../桌宠功能包/app/api/chat/route.ts app/api/chat/route.ts

# 复制 GIF 素材
mkdir -p public/assets/pet
cp ../桌宠功能包/public/assets/pet/*.gif public/assets/pet/
```

### 步骤 2：合并 CSS 变量和动画

打开目标项目的 `app/globals.css`，将 `styles/globals.css` 中的内容合并进去。

**重点检查：**
- `:root` 和 `.dark` 下的所有 CSS 变量都必须存在
- `@keyframes wiggle` 和 `.animate-wiggle` 必须定义
- 保留 `@layer base { * { @apply border-border; } }` 规则

### 步骤 3：合并 Tailwind 颜色配置

打开目标项目的 `tailwind.config.ts`，确保 `theme.extend.colors` 中包含 `styles/tailwind-preset.ts` 中定义的所有颜色 token。

核弹：`card`, `primary`, `muted`, `border`, `input`, `background`, `foreground` 等必须存在。

---

## 5. 环境变量配置

在目标项目的 `.env.local` 中添加：

```env
# 腾讯元器 API 配置（必填）
YUANQI_APP_ID=你的元器应用ID
YUANQI_TOKEN=你的元器API Token
```

> 如果未设置环境变量，API 路由会使用代码中的默认值（硬编码的 test token），生产环境请务必改用环境变量。

---

## 6. 在页面中引入组件

在目标项目的任意 `page.tsx` 或 `layout.tsx` 中添加：

```tsx
import WebPet from "@/components/web-pet"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPet />
      {children}
    </>
  )
}
```

> **建议放到根 `layout.tsx`**，这样桌宠会出现在所有页面中。

---

## 7. 常见问题排查

| 问题 | 原因 | 解决 |
|------|------|------|
| 桌宠不显示 | 可能是移动端宽度 | 组件在 `<768px` 时自动隐藏，在PC端正常 |
| CSS 样式异常/颜色不对 | CSS 变量未合并 | 检查 `globals.css` 是否包含所有 `:root` 和 `.dark` 变量 |
| Tailwind 编译报错 (card/primary 等) | 颜色 token 未注册 | 检查 `tailwind.config.ts` 的 `extend.colors` |
| AI 聊天无响应 | API 路由或环境变量问题 | 检查 `app/api/chat/route.ts` 是否存在、环境变量是否配置 |
| GIF 不显示/404 | 素材路径不对 | 确认 `public/assets/pet/` 下有 4 个 GIF 文件 |
| 拖拽时没有摆动动画 | wiggle 动画未定义 | 确认 `globals.css` 中有 `@keyframes wiggle` |

---

## 8. 自定义调整

以下是 `web-pet.tsx` 中的可调参数和对应行号：

| 参数 | 行号 | 默认值 | 说明 |
|------|------|--------|------|
| 桌宠尺寸 | 48, 146 | `120px` | `petSize` 变量和 `w-[120px] h-[120px]` |
| 欢迎语间隔 | 106 | `20000`(ms) | 自动播放欢迎语的周期 |
| 打字机速度 | 93 | `50`(ms) | 每个字符的显示间隔 |
| 欢迎语数组 | 13-18 | 4句 | `welcomeDialogues` 数组，支持修改内容 |
| 气泡与桌宠距离 | 352, 392 | 见代码 | 欢迎气泡 `-top-[110px]`，聊天窗口 `left-[120px]`/`right-[120px]` |
| 气泡宽度 | 352, 391 | `240px`/`280px` | 欢迎气泡/聊天窗口宽度 |
| 对话历史高度 | 405 | `max-h-[200px]` | 聊天记录区域最大高度 |

---

## 9. 完整的文件结构（嵌入后）

```
your-project/
├── app/
│   ├── globals.css            # ← 已合并 CSS 变量和 wiggle 动画
│   ├── layout.tsx             # ← 已 import WebPet
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # ← 已复制
│   └── ...
├── components/
│   └── web-pet.tsx            # ← 已复制
├── public/
│   └── assets/
│       └── pet/
│           ├── idle.gif       # ← 已复制
│           ├── thinking.gif   # ← 已复制
│           ├── dragging.gif   # ← 已复制
│           └── clicked.gif    # ← 已复制
├── tailwind.config.ts         # ← 已合并颜色 token
├── package.json               # ← 已安装 lucide-react, tailwindcss-animate
└── .env.local                 # ← 已配置 YUANQI_APP_ID, YUANQI_TOKEN
```

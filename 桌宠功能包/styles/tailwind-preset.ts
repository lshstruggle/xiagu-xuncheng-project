/**
 * Tailwind 配置预设 — 桌宠组件需要的 color token
 *
 * 使用方式（在目标项目 tailwind.config.ts 中）:
 *
 *   import type { Config } from "tailwindcss"
 *   import webPetColors from "./路径/桌宠功能包/styles/tailwind-preset"
 *
 *   const config: Config = {
 *     theme: {
 *       extend: {
 *         colors: {
 *           ...webPetColors,
 *           // 目标项目的其他颜色
 *         },
 *       },
 *     },
 *   }
 */
const webPetColors = {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
} as const

export default webPetColors

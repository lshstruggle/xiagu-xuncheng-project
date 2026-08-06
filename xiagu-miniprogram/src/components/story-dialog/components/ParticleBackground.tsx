/**
 * 峡谷粒子背景组件
 * 在关键节点触发时，为对话框背景增加氛围粒子效果
 * 使用Canvas绘制，性能最优
 */

import React, {
  useEffect,
  useRef,
  useCallback
} from 'react'
import Taro from '@tarojs/taro'
import { Canvas, View } from '@tarojs/components'
import './ParticleBackground.scss'

// ============ 类型定义 ============
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  opacitySpeed: number
  color: string
  life: number
  maxLife: number
}

interface ParticleBackgroundProps {
  active: boolean          // 是否激活粒子效果
  theme?: 'gold' | 'red' | 'blue'  // 主题颜色
  intensity?: 'low' | 'medium' | 'high'  // 粒子密度
  canvasId?: string
}

// 主题颜色配置
const THEME_COLORS = {
  gold: [
    'rgba(245, 197, 24, alpha)',
    'rgba(255, 215, 0, alpha)',
    'rgba(230, 168, 23, alpha)',
    'rgba(255, 248, 180, alpha)'
  ],
  red: [
    'rgba(255, 107, 107, alpha)',
    'rgba(255, 59, 59, alpha)',
    'rgba(220, 53, 69, alpha)',
    'rgba(255, 150, 150, alpha)'
  ],
  blue: [
    'rgba(79, 195, 247, alpha)',
    'rgba(41, 182, 246, alpha)',
    'rgba(3, 169, 244, alpha)',
    'rgba(180, 230, 255, alpha)'
  ]
}

// 粒子密度配置
const INTENSITY_CONFIG = {
  low: { count: 15, speed: 0.4 },
  medium: { count: 25, speed: 0.6 },
  high: { count: 40, speed: 0.8 }
}

// ============ 组件主体 ============
export default function ParticleBackground({
  active,
  theme = 'gold',
  intensity = 'medium',
  canvasId = 'particleCanvas'
}: ParticleBackgroundProps) {

  const canvasRef = useRef<any>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const ctxRef = useRef<any>(null)
  const canvasSizeRef = useRef({ width: 0, height: 0 })
  const isActiveRef = useRef(active)

  // ---- 获取系统信息 ----
  const initCanvasSize = useCallback(() => {
    const systemInfo = Taro.getSystemInfoSync()
    const dpr = systemInfo.pixelRatio || 2
    canvasSizeRef.current = {
      width: systemInfo.windowWidth * dpr,
      height: systemInfo.windowHeight * dpr
    }
    return dpr
  }, [])

  // ---- 创建单个粒子 ----
  const createParticle = useCallback((
    width: number,
    height: number
  ): Particle => {
    const config = INTENSITY_CONFIG[intensity]
    const colors = THEME_COLORS[theme]
    const color = colors[Math.floor(Math.random() * colors.length)]
    const maxLife = 120 + Math.random() * 180

    return {
      // 随机起始位置（底部1/3区域，因为对话框在底部）
      x: Math.random() * width,
      y: height * 0.6 + Math.random() * (height * 0.4),
      // 向上漂浮
      vx: (Math.random() - 0.5) * config.speed * 1.5,
      vy: -(Math.random() * config.speed + 0.3),
      radius: 1.5 + Math.random() * 3,
      opacity: 0,
      opacitySpeed: 0.02 + Math.random() * 0.02,
      color,
      life: 0,
      maxLife
    }
  }, [theme, intensity])

  // ---- 初始化粒子池 ----
  const initParticles = useCallback((
    width: number,
    height: number
  ) => {
    const config = INTENSITY_CONFIG[intensity]
    particlesRef.current = Array.from(
      { length: config.count },
      () => {
        const p = createParticle(width, height)
        // 随机初始化生命值，避免粒子同步出现
        p.life = Math.random() * p.maxLife
        p.opacity = Math.random() * 0.6
        return p
      }
    )
  }, [createParticle, intensity])

  // ---- 绘制单个粒子 ----
  const drawParticle = useCallback((
    ctx: any,
    particle: Particle
  ) => {
    const { x, y, radius, opacity, color } = particle
    const actualColor = color.replace('alpha', opacity.toString())

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = actualColor

    // 发光效果
    ctx.shadowBlur = radius * 4
    ctx.shadowColor = color.replace('alpha', (opacity * 0.6).toString())
    ctx.fill()
    ctx.shadowBlur = 0
  }, [])

  // ---- 更新粒子状态 ----
  const updateParticle = useCallback((
    particle: Particle,
    width: number,
    height: number
  ): Particle => {
    let { x, y, vx, vy, opacity, opacitySpeed, life, maxLife } = particle

    // 更新位置
    x += vx
    y += vy
    life++

    // 透明度：先渐入再渐出
    const lifeRatio = life / maxLife
    if (lifeRatio < 0.2) {
      opacity = Math.min(0.8, opacity + opacitySpeed * 2)
    } else if (lifeRatio > 0.7) {
      opacity = Math.max(0, opacity - opacitySpeed)
    }

    // 微弱漂移（模拟空气流动）
    vx += (Math.random() - 0.5) * 0.05

    // 粒子超出范围或生命结束，重置
    if (life >= maxLife || y < 0 || x < 0 || x > width) {
      return createParticle(width, height)
    }

    return { ...particle, x, y, vx, vy, opacity, life }
  }, [createParticle])

  // ---- 主动画循环 ----
  const animate = useCallback(() => {
    if (!isActiveRef.current || !ctxRef.current) return

    const { width, height } = canvasSizeRef.current
    const ctx = ctxRef.current

    // 清空画布（带残影效果）
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, width, height)

    // 更新并绘制所有粒子
    particlesRef.current = particlesRef.current.map(p => {
      const updated = updateParticle(p, width, height)
      drawParticle(ctx, updated)
      return updated
    })

    animFrameRef.current = requestAnimationFrame(animate)
  }, [updateParticle, drawParticle])

  // ---- 初始化Canvas ----
  const initCanvas = useCallback(() => {
    const query = Taro.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]?.node) return

        const canvas = res[0].node
        const dpr = initCanvasSize()
        const { width, height } = canvasSizeRef.current

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        ctxRef.current = ctx

        // 初始化粒子
        const realWidth = width / dpr
        const realHeight = height / dpr
        initParticles(realWidth, realHeight)

        // 启动动画
        animate()
      })
  }, [canvasId, initCanvasSize, initParticles, animate])

  // ---- 监听active变化 ----
  useEffect(() => {
    isActiveRef.current = active

    if (active) {
      initCanvas()
    } else {
      // 停止动画
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      // 清空画布
      if (ctxRef.current) {
        const { width, height } = canvasSizeRef.current
        ctxRef.current.clearRect(0, 0, width, height)
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [active, initCanvas])

  if (!active) return null

  return (
    <View className='particle-bg-container'>
      <Canvas
        id={canvasId}
        type='2d'
        className='particle-canvas'
      />
    </View>
  )
}

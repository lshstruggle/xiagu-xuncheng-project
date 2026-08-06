/**
 * 手势控制Hook
 * 支持：上滑展开、下滑关闭、左右滑动切换选项
 * 适配：微信小程序触摸事件
 */

import { useState, useCallback, useRef } from 'react'
import Taro from '@tarojs/taro'

// ============ 类型定义 ============
interface TouchPoint {
  x: number
  y: number
  time: number
}

interface GestureResult {
  direction: 'up' | 'down' | 'left' | 'right' | 'tap' | 'none'
  distance: number
  velocity: number  // 速度 px/ms
}

interface UseGestureControlProps {
  onSwipeUp?: () => void       // 上滑：展开详情
  onSwipeDown?: () => void     // 下滑：关闭对话
  onSwipeLeft?: () => void     // 左滑：下一个
  onSwipeRight?: () => void    // 右滑：上一个
  onTap?: () => void           // 点击：继续
  onLongPress?: () => void     // 长按：跳过
  threshold?: number           // 触发阈值（px）
  velocityThreshold?: number   // 速度阈值（px/ms）
  longPressDelay?: number      // 长按延迟（ms）
}

// ============ Hook主体 ============
export function useGestureControl({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  onLongPress,
  threshold = 50,
  velocityThreshold = 0.3,
  longPressDelay = 600
}: UseGestureControlProps) {

  const touchStartRef = useRef<TouchPoint | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const isDraggingRef = useRef(false)

  // 当前拖拽偏移量（用于实时反馈）
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // ---- 触摸开始 ----
  const handleTouchStart = useCallback((e: any) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    isLongPressRef.current = false
    isDraggingRef.current = false

    // 启动长按计时器
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        // 长按触感反馈
        Taro.vibrateShort({ type: 'medium' })
        onLongPress()
      }, longPressDelay)
    }
  }, [onLongPress, longPressDelay])

  // ---- 触摸移动 ----
  const handleTouchMove = useCallback((e: any) => {
    if (!touchStartRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // 超过阈值认为是拖拽
    if (distance > 10) {
      isDraggingRef.current = true
      setIsDragging(true)

      // 取消长按
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }

      // 实时更新拖拽偏移（用于动画反馈）
      setDragOffset({ x: deltaX, y: deltaY })
    }
  }, [])

  // ---- 触摸结束 ----
  const handleTouchEnd = useCallback((e: any) => {
    // 清除长按计时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    // 重置拖拽状态
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })

    if (!touchStartRef.current) return
    if (isLongPressRef.current) return  // 长按已处理

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = distance / deltaTime

    // 判断手势类型
    const result = analyzeGesture(
      deltaX, deltaY, distance,
      velocity, threshold, velocityThreshold
    )

    // 根据手势方向触发回调
    switch (result.direction) {
      case 'tap':
        Taro.vibrateShort({ type: 'light' })
        onTap?.()
        break
      case 'up':
        Taro.vibrateShort({ type: 'light' })
        onSwipeUp?.()
        break
      case 'down':
        Taro.vibrateShort({ type: 'medium' })
        onSwipeDown?.()
        break
      case 'left':
        Taro.vibrateShort({ type: 'light' })
        onSwipeLeft?.()
        break
      case 'right':
        Taro.vibrateShort({ type: 'light' })
        onSwipeRight?.()
        break
    }

    touchStartRef.current = null
    isDraggingRef.current = false
  }, [
    onTap, onSwipeUp, onSwipeDown,
    onSwipeLeft, onSwipeRight,
    threshold, velocityThreshold
  ])

  // ---- 触摸取消 ----
  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
    touchStartRef.current = null
  }, [])

  return {
    dragOffset,
    isDragging,
    gestureHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    }
  }
}

// ============ 手势分析工具函数 ============
function analyzeGesture(
  deltaX: number,
  deltaY: number,
  distance: number,
  velocity: number,
  threshold: number,
  velocityThreshold: number
): GestureResult {

  // 点击判定（距离小且速度快）
  if (distance < 15) {
    return { direction: 'tap', distance, velocity }
  }

  // 未达到阈值且速度慢
  if (distance < threshold && velocity < velocityThreshold) {
    return { direction: 'none', distance, velocity }
  }

  // 判断主要方向
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)

  if (absY > absX) {
    // 垂直方向
    return {
      direction: deltaY < 0 ? 'up' : 'down',
      distance,
      velocity
    }
  } else {
    // 水平方向
    return {
      direction: deltaX < 0 ? 'left' : 'right',
      distance,
      velocity
    }
  }
}

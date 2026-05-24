/**
 * 触感反馈Hook
 * 根据节点情感类型给出不同的触感反馈模式
 */

import { useCallback } from 'react'
import Taro from '@tarojs/taro'

// 情感类型对应的震动模式
type EmotionType = 'normal' | 'happy' | 'sad' | 'excited' | 'thoughtful'
type HapticType = 'light' | 'medium' | 'heavy'

interface HapticPattern {
  type: HapticType
  repeat?: number      // 重复次数
  interval?: number    // 间隔ms
}

// 情感 -> 触感映射表
const EMOTION_HAPTIC_MAP: Record<EmotionType, HapticPattern> = {
  normal: { type: 'light', repeat: 1 },
  happy: { type: 'light', repeat: 2, interval: 100 },
  excited: { type: 'medium', repeat: 3, interval: 80 },
  sad: { type: 'medium', repeat: 1 },
  thoughtful: { type: 'light', repeat: 1 }
}

// 事件类型 -> 触感映射
const EVENT_HAPTIC_MAP: Record<string, HapticPattern> = {
  dialogOpen: { type: 'light', repeat: 1 },
  dialogClose: { type: 'medium', repeat: 1 },
  choiceSelect: { type: 'medium', repeat: 1 },
  chapterStart: { type: 'heavy', repeat: 1 },
  endingReach: { type: 'heavy', repeat: 2, interval: 200 },
  locationTrigger: { type: 'medium', repeat: 2, interval: 150 },
  mediaOpen: { type: 'light', repeat: 1 }
}

export function useHapticFeedback() {

  // ---- 执行震动序列 ----
  const executeHaptic = useCallback(async (pattern: HapticPattern) => {
    const { type, repeat = 1, interval = 100 } = pattern

    for (let i = 0; i < repeat; i++) {
      await new Promise<void>((resolve) => {
        if (type === 'heavy') {
          Taro.vibrateLong({
            success: resolve,
            fail: resolve
          })
        } else {
          Taro.vibrateShort({
            type,
            success: resolve,
            fail: resolve
          })
        }
      })

      // 多次震动间的间隔
      if (i < repeat - 1) {
        await new Promise(resolve => setTimeout(resolve, interval))
      }
    }
  }, [])

  // ---- 根据情感类型触发震动 ----
  const triggerEmotionHaptic = useCallback((
    emotion: EmotionType = 'normal'
  ) => {
    const pattern = EMOTION_HAPTIC_MAP[emotion]
    executeHaptic(pattern)
  }, [executeHaptic])

  // ---- 根据事件类型触发震动 ----
  const triggerEventHaptic = useCallback((
    event: keyof typeof EVENT_HAPTIC_MAP
  ) => {
    const pattern = EVENT_HAPTIC_MAP[event]
    if (pattern) {
      executeHaptic(pattern)
    }
  }, [executeHaptic])

  return {
    triggerEmotionHaptic,
    triggerEventHaptic
  }
}

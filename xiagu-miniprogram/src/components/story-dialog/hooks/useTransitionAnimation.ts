/**
 * 节点转场动画Hook
 * 节点切换时的炫光转场效果
 */

import { useState, useCallback, useRef } from 'react'

type TransitionType =
  | 'fade'        // 普通淡入淡出
  | 'flash'       // 闪光（关键节点）
  | 'slide'       // 滑入（选择分支后）
  | 'ripple'      // 涟漪（位置触发）

interface TransitionState {
  isTransitioning: boolean
  type: TransitionType
  phase: 'out' | 'in' | 'idle'
}

export function useTransitionAnimation() {

  const [transition, setTransition] = useState<TransitionState>({
    isTransitioning: false,
    type: 'fade',
    phase: 'idle'
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- 执行转场 ----
  const playTransition = useCallback((
    type: TransitionType = 'fade',
    callback?: () => void
  ) => {
    // 清除之前的计时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 根据类型设置动画时长
    const durationMap: Record<TransitionType, number> = {
      fade: 200,
      flash: 150,
      slide: 250,
      ripple: 300
    }
    const duration = durationMap[type]

    // 阶段1：退出动画
    setTransition({
      isTransitioning: true,
      type,
      phase: 'out'
    })

    // 阶段2：执行内容切换
    timeoutRef.current = setTimeout(() => {
      callback?.()

      // 阶段3：进入动画
      setTransition({
        isTransitioning: true,
        type,
        phase: 'in'
      })

      // 阶段4：动画结束
      timeoutRef.current = setTimeout(() => {
        setTransition({
          isTransitioning: false,
          type: 'fade',
          phase: 'idle'
        })
      }, duration)
    }, duration)
  }, [])

  // ---- 根据节点类型选择转场动画 ----
  const getTransitionType = useCallback((
    nodeType: string,
    isKeyNode: boolean,
    isChoice: boolean
  ): TransitionType => {
    if (nodeType === 'ending') return 'flash'
    if (isKeyNode) return 'ripple'
    if (isChoice) return 'slide'
    return 'fade'
  }, [])

  // ---- 生成CSS类名 ----
  const getTransitionClass = useCallback((): string => {
    if (!transition.isTransitioning) return ''

    return `transition-${transition.type}-${transition.phase}`
  }, [transition])

  return {
    transition,
    playTransition,
    getTransitionType,
    getTransitionClass
  }
}

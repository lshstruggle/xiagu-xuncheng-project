import { View, Text } from '@tarojs/components'
import { useState, useRef } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface LongPressBtnProps {
  duration?: number
  text?: string
  color?: string
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

export default function LongPressBtn({
  duration = 1500,
  text = '长按收集这段记忆',
  color = '#C8A252',
  onProgress,
  onComplete
}: LongPressBtnProps) {
  const [pressing, setPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const progressTimer = useRef<NodeJS.Timeout | null>(null)
  const vibrateTimer = useRef<NodeJS.Timeout | null>(null)
  const startTime = useRef(0)

  const onTouchStart = () => {
    if (completed) return

    setPressing(true)
    setProgress(0)
    startTime.current = Date.now()

    // 持续震动
    vibrateTimer.current = setInterval(() => {
      Taro.vibrateShort({ type: 'light' })
    }, 120)

    // 进度更新
    const interval = 50
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      
      setProgress(newProgress)
      onProgress?.(newProgress)

      if (newProgress >= 100) {
        onCompleteHandler()
      }
    }, interval)
  }

  const onTouchEnd = () => {
    if (completed) return
    reset()
  }

  const onCompleteHandler = () => {
    clearTimers()
    setPressing(false)
    setCompleted(true)
    setProgress(100)
    Taro.vibrateLong()
    onComplete?.()
  }

  const reset = () => {
    clearTimers()
    setPressing(false)
    setProgress(0)
  }

  const clearTimers = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    if (vibrateTimer.current) {
      clearInterval(vibrateTimer.current)
      vibrateTimer.current = null
    }
  }

  return (
    <View className='long-press-container'>
      <View
        className={`long-press-btn ${pressing ? 'pressing' : ''} ${completed ? 'completed' : ''}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{ '--progress': progress } as any}
      >
        {/* 进度环 */}
        <View className='progress-ring'>
          <View className='ring-bg'></View>
          <View className='ring-fill' style={{ width: `${progress}%` }}></View>
        </View>

        {/* 按钮内容 */}
        <View className='btn-content'>
          <Text className='btn-icon'>{completed ? '✅' : '✋'}</Text>
          <Text className='btn-text' style={{ color: completed ? color : '#F5E6C8' }}>
            {completed ? '记忆已收集' : text}
          </Text>
        </View>

        {/* 进度百分比 */}
        {pressing && !completed && (
          <View className='progress-text' style={{ color }}>
            {Math.floor(progress)}%
          </View>
        )}
      </View>
    </View>
  )
}

/**
 * TTS音波动画组件
 * 播放中显示跳动音波，停止时显示静态图标
 */

import React from 'react'
import { View, Text } from '@tarojs/components'
import './TTSWaveAnimation.scss'

interface TTSWaveAnimationProps {
  isPlaying: boolean
  color?: string        // 波形颜色
  barCount?: number     // 波形柱数量
  size?: 'small' | 'medium' | 'large'
}

// 每根波形柱的动画延迟配置
const WAVE_DELAYS = [
  '0s', '0.15s', '0.3s', '0.45s', '0.6s'
]

// 每根波形柱的高度配置（静态时）
const WAVE_HEIGHTS = [
  '12rpx', '20rpx', '16rpx', '24rpx', '14rpx'
]

export default function TTSWaveAnimation({
  isPlaying,
  color = '#F5C518',
  barCount = 5,
  size = 'medium'
}: TTSWaveAnimationProps) {

  const bars = Array.from({ length: barCount }, (_, i) => i)

  return (
    <View className={`tts-wave-container size-${size}`}>
      {isPlaying ? (
        // ---- 播放中：跳动波形 ----
        <View className='tts-wave-bars'>
          {bars.map((_, index) => (
            <View
              key={index}
              className='tts-wave-bar'
              style={{
                background: color,
                animationDelay: WAVE_DELAYS[index % WAVE_DELAYS.length],
                height: WAVE_HEIGHTS[index % WAVE_HEIGHTS.length]
              }}
            />
          ))}
        </View>
      ) : (
        // ---- 停止：静态喇叭图标 ----
        <View className='tts-static-icon'>
          <Text
            className='tts-speaker-icon'
            style={{ color }}
          >
            🔊
          </Text>
        </View>
      )}
    </View>
  )
}

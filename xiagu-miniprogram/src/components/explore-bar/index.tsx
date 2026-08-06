// components/explore-bar/index.tsx
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { calcExploreScore } from '../../config/explore-score'
import './index.scss'

export default function ExploreBar() {
  const [percent, setPercent] = useState(0)

  const refresh = useCallback(() => {
    const checkins = Taro.getStorageSync('my_checkins') || []
    const completedRoutes = Taro.getStorageSync('completed_routes') || []
    const unlockedAch = Taro.getStorageSync('unlocked_achievements') || []
    const score = calcExploreScore({ checkins, completedRoutes, unlockedAchievements: unlockedAch })
    setPercent(score)
  }, [])

  const goDetail = useCallback(() => {
    Taro.navigateTo({ url: '/pages/backpack/index' })
  }, [])

  useDidShow(() => {
    refresh()
  })

  return (
    <View className='explore-bar' onClick={goDetail}>
      <View className='eb-label'>
        <Text className='eb-city'>成都</Text>
        <Text className='eb-text'>探索度</Text>
      </View>
      <View className='eb-bar'>
        <View className='eb-fill' style={{ width: `${percent}%` }} />
      </View>
      <Text className='eb-num'>{percent}%</Text>
    </View>
  )
}

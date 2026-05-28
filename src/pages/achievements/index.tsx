import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import FutureBg from '../../components/future-bg'
import { ACHIEVEMENTS, calcExploreScore, Achievement } from '../../config/explore-score'
import './index.scss'

interface UserData {
  checkins: any[]
  completedRoutes: number[]
  unlockedAchievements: string[]
  badges: any[]
  bookmarks: string[]
  shareCount: number
}

export default function Achievements() {
  const [score, setScore] = useState(0)
  const [userData, setUserData] = useState<UserData>({
    checkins: [],
    completedRoutes: [],
    unlockedAchievements: [],
    badges: [],
    bookmarks: [],
    shareCount: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const checkins = Taro.getStorageSync('my_checkins') || []
    const completedRoutes = Taro.getStorageSync('completed_routes') || []
    const unlockedAch = Taro.getStorageSync('unlocked_achievements') || []
    const badges = Taro.getStorageSync('my_badges') || []
    const bookmarksRaw = Taro.getStorageSync('collected_fragments') || '[]'
    let bookmarks: string[] = []
    try { bookmarks = JSON.parse(bookmarksRaw) } catch (e) { bookmarks = [] }
    const shareCount = Taro.getStorageSync('share_count') || 0

    const data: UserData = { checkins, completedRoutes, unlockedAchievements: unlockedAch, badges, bookmarks, shareCount }
    setUserData(data)

    const s = calcExploreScore({
      checkins,
      completedRoutes,
      unlockedAchievements: unlockedAch,
    })
    setScore(s)
  }

  const isUnlocked = (ach: Achievement): boolean => {
    if (userData.unlockedAchievements.includes(ach.id)) return true

    switch (ach.condition.type) {
      case 'checkin_count':
        return userData.checkins.length >= (ach.condition.value as number)
      case 'route_count':
        return userData.completedRoutes.length >= (ach.condition.value as number)
      case 'badge_count':
        return userData.badges.length >= (ach.condition.value as number)
      case 'share_count':
        return userData.shareCount >= (ach.condition.value as number)
      case 'spirit_badge_all':
        return userData.badges.length >= 6
      case 'bookmark_all':
        return userData.bookmarks.length >= 10
      default:
        return false
    }
  }

  const getProgress = (ach: Achievement): { current: number; target: number } => {
    const target = ach.condition.value as number
    switch (ach.condition.type) {
      case 'checkin_count':
        return { current: userData.checkins.length, target }
      case 'route_count':
        return { current: userData.completedRoutes.length, target }
      case 'badge_count':
        return { current: userData.badges.length, target }
      case 'share_count':
        return { current: userData.shareCount, target }
      case 'spirit_badge_all':
        return { current: userData.badges.length, target: 6 }
      case 'bookmark_all':
        return { current: userData.bookmarks.length, target: 10 }
      default:
        return { current: 0, target: 1 }
    }
  }

  const categories = [
    { title: '打卡成就', items: ACHIEVEMENTS.filter(a => a.condition.type === 'checkin_count') },
    { title: '收集成就', items: ACHIEVEMENTS.filter(a => ['badge_count', 'spirit_badge_all', 'bookmark_all'].includes(a.condition.type)) },
    { title: '路线成就', items: ACHIEVEMENTS.filter(a => a.condition.type === 'route_count') },
    { title: '社交成就', items: ACHIEVEMENTS.filter(a => a.condition.type === 'share_count') },
  ]

  const totalScore = ACHIEVEMENTS.reduce((sum, a) => sum + a.score, 0)
  const earnedScore = ACHIEVEMENTS.filter(a => isUnlocked(a)).reduce((sum, a) => sum + a.score, 0)

  return (
    <View className='achievements-page'>
      <FutureBg />
      <ScrollView className='ach-scroll' scrollY>
        {/* 头部 */}
        <View className='ach-header'>
          <Text className='ach-title'>成就系统</Text>
          <View className='ach-score-card'>
            <View className='ach-score-main'>
              <Text className='ach-score-num'>{score}</Text>
              <Text className='ach-score-label'>探索度</Text>
            </View>
            <View className='ach-score-detail'>
              <Text className='ach-score-item'>成就得分 {earnedScore}/{totalScore}</Text>
              <View className='ach-score-bar'>
                <View className='ach-score-fill' style={{ width: `${totalScore ? (earnedScore / totalScore) * 100 : 0}%` }} />
              </View>
            </View>
          </View>
        </View>

        {/* 分类列表 */}
        {categories.map(cat => (
          <View key={cat.title} className='ach-section'>
            <Text className='ach-section-title'>{cat.title}</Text>
            <View className='ach-grid'>
              {cat.items.map(ach => {
                const unlocked = isUnlocked(ach)
                const progress = getProgress(ach)
                const pct = Math.min((progress.current / progress.target) * 100, 100)
                return (
                  <View key={ach.id} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
                    <View className='ach-icon-wrap'>
                      <Text className='ach-icon'>{ach.icon}</Text>
                      {unlocked && <View className='ach-glow' />}
                    </View>
                    <Text className='ach-name'>{ach.name}</Text>
                    <Text className='ach-desc'>{ach.desc}</Text>
                    {!unlocked && (
                      <View className='ach-progress'>
                        <View className='ach-progress-bar'>
                          <View className='ach-progress-fill' style={{ width: `${pct}%` }} />
                        </View>
                        <Text className='ach-progress-text'>{progress.current}/{progress.target}</Text>
                      </View>
                    )}
                    {unlocked && <Text className='ach-unlocked-tag'>已解锁 +{ach.score}分</Text>}
                  </View>
                )
              })}
            </View>
          </View>
        ))}

        <View className='safe-bottom' />
      </ScrollView>
    </View>
  )
}

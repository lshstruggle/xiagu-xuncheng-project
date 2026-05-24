import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getHeroAvatar, heroAvatarFileIDs, getCachedImageByFileID } from '../../../utils/cloud-assets'
import './index.scss'

// 英雄基础数据
const HEROES_DATA = [
  { id: 1, name: '嬴政', city: '西安', reason: '古都帝王，见证千年历史' },
  { id: 2, name: '李白', city: '成都', reason: '诗仙醉酒，蜀道难吟' },
  { id: 3, name: '杨玉环', city: '敦煌', reason: '华清池畔，贵妃醉酒' },
  { id: 4, name: '武则天', city: '西安', reason: '女皇登基，大唐盛世' },
  { id: 5, name: '诸葛亮', city: '成都', reason: '三国丞相，武侯遗风' },
  { id: 6, name: '貂蝉', city: '洛阳', reason: '闭月羞花，洛阳牡丹' }
]

// 模拟当前城市，实际应该从定位获取
const CURRENT_CITY = '成都'

export default function HeroSelect() {
  const [selectedHero, setSelectedHero] = useState<number | null>(null)
  const [currentCity, setCurrentCity] = useState(CURRENT_CITY)
  const [heroAvatars, setHeroAvatars] = useState<Record<string, string>>({})

  useEffect(() => {
    // 异步加载英雄头像
    const loadAvatars = async () => {
      const avatars: Record<string, string> = {}
      for (const hero of HEROES_DATA) {
        // 先检查缓存
        const cached = getCachedImageByFileID(heroAvatarFileIDs[hero.name])
        if (cached) {
          avatars[hero.name] = cached
        } else {
          // 异步获取
          const url = await getHeroAvatar(hero.name)
          avatars[hero.name] = url
        }
      }
      setHeroAvatars(avatars)
    }
    loadAvatars()

    // 尝试获取真实定位
    Taro.getLocation({
      type: 'gcj02',
      success: (res) => {
        // 这里简化处理，实际应该根据坐标反解析城市
        console.log('当前位置:', res)
      },
      fail: () => {
        console.log('使用默认城市:', CURRENT_CITY)
      }
    })
  }, [])

  // 获取推荐英雄（当前城市的英雄）
  const recommendedHeroes = HEROES_DATA.filter(hero => hero.city === currentCity)

  const handleSelect = (id: number) => {
    setSelectedHero(id)
  }

  const handleConfirm = () => {
    if (selectedHero) {
      const hero = HEROES_DATA.find(h => h.id === selectedHero)
      // 保存选择的英雄到本地存储
      Taro.setStorageSync('selectedHero', hero?.name)
      Taro.showToast({
        title: `${hero?.name} 加入队伍`,
        icon: 'success'
      })
      // 跳转到模式选择页面
      setTimeout(() => {
        Taro.navigateTo({
          url: `/packageA/pages/story-mode-select/index?heroId=${hero?.name}&heroName=${hero?.name}&heroAvatar=${encodeURIComponent(heroAvatars[hero?.name || ''] || '')}`
        })
      }, 1000)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className='hero-select-container'>
      {/* 顶部导航 */}
      <View className='nav-bar'>
        <Text className='back-btn' onClick={handleBack}>‹</Text>
        <Text className='nav-title'>选择英雄</Text>
        <View className='nav-placeholder'></View>
      </View>

      {/* 地点提示 */}
      <View className='location-tip'>
        <Text className='location-icon'>📍</Text>
        <Text className='location-text'>当前位置：{currentCity}</Text>
      </View>

      {/* 推荐区域 */}
      {recommendedHeroes.length > 0 && (
        <View className='recommend-section'>
          <View className='recommend-header'>
            <Text className='recommend-icon'>⭐</Text>
            <Text className='recommend-title'>为您推荐</Text>
          </View>
          <Text className='recommend-desc'>基于您当前所在地点，以下英雄与您更有缘分</Text>
        </View>
      )}

      {/* 英雄网格 */}
      <View className='heroes-grid'>
        {HEROES_DATA.map((hero) => {
          const isRecommended = hero.city === currentCity
          return (
            <View 
              key={hero.id}
              className={`hero-item ${selectedHero === hero.id ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
              onClick={() => handleSelect(hero.id)}
            >
              <View className='avatar-wrap'>
                <Image className='hero-avatar' src={heroAvatars[hero.name] || ''} mode='aspectFill' />
                {isRecommended && (
                  <View className='recommend-badge'>推荐</View>
                )}
                {selectedHero === hero.id && (
                  <View className='selected-mark'>✓</View>
                )}
              </View>
              <Text className='hero-name'>{hero.name}</Text>
              {isRecommended && (
                <Text className='hero-reason'>{hero.reason}</Text>
              )}
            </View>
          )
        })}
      </View>

      {/* 底部确认按钮 */}
      <View className='bottom-section'>
        <Button 
          className={`confirm-btn ${selectedHero ? 'active' : ''}`}
          onClick={handleConfirm}
          disabled={!selectedHero}
        >
          <Text className='btn-text'>
            {selectedHero ? '确认选择' : '请选择英雄'}
          </Text>
        </Button>
      </View>
    </View>
  )
}

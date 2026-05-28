import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import type { StoryLine } from '../../../types/story'
import { getStoryByHero, startStory, setExploreMode } from '../../../services/story'
import { getTempFileURL } from '../../../utils/temp-url-cache'
import { resetFreeModeWelcome } from '../../../data/free-mode-welcome'
import FutureBg from '../../../components/future-bg'
import './index.scss'

const MODE_ICON_FREE = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/模式选择ui/自由探索模式-removebg-preview.png'
const MODE_ICON_EXPLORE = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/模式选择ui/剧情模式-removebg-preview.png'

export default function StoryModeSelect() {
  const router = useRouter()
  const { heroId, heroName, heroAvatar: rawHeroAvatar } = router.params

  const [story, setStory] = useState<StoryLine | null>(null)
  const [loading, setLoading] = useState(true)
  const [heroAvatar, setHeroAvatar] = useState('')
  const [modeIcons, setModeIcons] = useState({ free: '', explore: '' })

  useEffect(() => {
    if (!heroId) {
      Taro.showToast({ title: '请先选择英雄', icon: 'none' })
      Taro.redirectTo({ url: '/pages/hero-select/index' })
      return
    }

    // 处理头像 URL
    const loadAvatar = async () => {
      if (rawHeroAvatar) {
        if (rawHeroAvatar.startsWith('cloud://')) {
          // 云存储路径需要转换
          const url = await getTempFileURL(rawHeroAvatar)
          setHeroAvatar(url || '')
        } else {
          // 已经是临时 URL
          setHeroAvatar(decodeURIComponent(rawHeroAvatar))
        }
      }
    }
    loadAvatar()

    const heroStory = getStoryByHero(heroId)
    setStory(heroStory || null)
    setLoading(false)

    // 加载模式图标
    const loadIcons = async () => {
      const [freeUrl, exploreUrl] = await Promise.all([
        getTempFileURL(MODE_ICON_FREE),
        getTempFileURL(MODE_ICON_EXPLORE)
      ])
      setModeIcons({ free: freeUrl || '', explore: exploreUrl || '' })
    }
    loadIcons()
  }, [heroId, rawHeroAvatar])

  const selectFreeMode = () => {
    setExploreMode('free')
    // 重置自由模式欢迎剧情标记，确保下次进入时显示
    resetFreeModeWelcome()
    Taro.showToast({ title: '进入自由模式', icon: 'success' })
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/checkin/index' })
    }, 500)
  }

  const selectExploreMode = () => {
    if (!story) {
      Taro.showModal({
        title: '暂无故事线',
        content: `${heroName}暂无专属探索故事，是否选择自由模式？`,
        success: (res) => {
          if (res.confirm) {
            selectFreeMode()
          }
        }
      })
      return
    }

    try {
      startStory(story.id, heroId!)
      setExploreMode('explore')
      Taro.showToast({ title: '故事已开始', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/checkin/index' })
      }, 500)
    } catch (e) {
      console.error('开始故事失败', e)
      Taro.showToast({ title: '开始故事失败', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <View className='sms-page'>
        <View className='sms-loading'>
          <Text className='sms-loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='sms-page'>
      <FutureBg />
      {/* 顶部金线 */}
      <View className='sms-top-line' />

      {/* 头部 */}
      <View className='sms-head'>
        <Text className='sms-eyebrow'>探索模式</Text>
        <Text className='sms-title'>选择你的旅行方式</Text>
      </View>

      {/* 英雄信息 */}
      <View className='sms-hero'>
        <View className='sms-hero-avatar-wrap'>
          <Image className='sms-hero-avatar' src={heroAvatar} mode='aspectFill' />
        </View>
        <Text className='sms-hero-name'>{heroName}</Text>
        {story && (
          <View className='sms-hero-badge'>
            <Text className='sms-badge-text'>专属故事线</Text>
          </View>
        )}
      </View>

      {/* 选项组 */}
      <View className='sms-options'>
        {/* 自由模式 */}
        <View className='sms-option' onClick={selectFreeMode}>
          <View className='sms-option-left'>
            <View className='sms-option-icon sms-option-icon--free'>
              {modeIcons.free ? (
                <Image className='sms-mode-icon-img' src={modeIcons.free} mode='aspectFit' />
              ) : (
                <Text className='sms-emoji'>🗺️</Text>
              )}
            </View>
            <View className='sms-option-text'>
              <Text className='sms-option-name'>自由模式</Text>
              <Text className='sms-option-desc'>随意漫游，自行打卡</Text>
            </View>
          </View>
          <View className='sms-option-arrow'>
            <Text className='sms-arrow'>›</Text>
          </View>
        </View>

        {/* 探索模式 */}
        <View 
          className={`sms-option ${!story ? 'sms-option--disabled' : ''}`}
          onClick={selectExploreMode}
        >
          <View className='sms-option-left'>
            <View className='sms-option-icon sms-option-icon--explore'>
              {modeIcons.explore ? (
                <Image className='sms-mode-icon-img' src={modeIcons.explore} mode='aspectFit' />
              ) : (
                <Text className='sms-emoji'>🍶⚔️</Text>
              )}
            </View>
            <View className='sms-option-text'>
              <Text className='sms-option-name'>{heroName} · 剧情</Text>
              <Text className='sms-option-desc'>
                {story ? '跟随故事线探索成都' : '暂无专属故事'}
              </Text>
            </View>
          </View>
          <View className='sms-option-arrow'>
            <Text className='sms-arrow'>›</Text>
          </View>
        </View>
      </View>

      {/* 故事预览 */}
      {story && (
        <View className='sms-preview'>
          <View className='sms-preview-header'>
            <View className='sms-preview-line' />
            <Text className='sms-preview-title'>故事预览</Text>
            <View className='sms-preview-line' />
          </View>
          <View className='sms-chapters'>
            {story.chapters.map((chapter) => (
              <View key={chapter.id} className='sms-chapter'>
                <View className='sms-chapter-dot' />
                <View className='sms-chapter-info'>
                  <Text className='sms-chapter-title'>{chapter.title}</Text>
                  <Text className='sms-chapter-location'>📍 {chapter.locationName}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 提示 */}
      <View className='sms-tips'>
        <Text className='sms-tips-text'>💡 探索模式可随时切换回自由模式，进度会保留</Text>
      </View>
    </View>
  )
}

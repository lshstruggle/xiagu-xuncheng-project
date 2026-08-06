import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import type { StoryMode, StoryLine } from '../../types/story'
import {
  getExploreMode,
  setExploreMode,
  getCurrentStoryProgress,
  getStoryById
} from '../../services/story'
import { getTempFileURL } from '../../utils/temp-url-cache'
import './index.scss'

const MODE_ICON_FREE = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/模式选择ui/自由探索模式-removebg-preview.png'
const MODE_ICON_EXPLORE = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/模式选择ui/剧情模式-removebg-preview.png'

interface ModeSelectorProps {
  heroId: string
  heroName: string
  heroAvatar: string
  onModeChange?: (mode: StoryMode) => void
}

export default function ModeSelector({
  heroId,
  heroName,
  heroAvatar,
  onModeChange
}: ModeSelectorProps) {
  const [currentMode, setCurrentMode] = useState<StoryMode>('free')
  const [showSelector, setShowSelector] = useState(false)
  const [currentStory, setCurrentStory] = useState<StoryLine | null>(null)
  const [storyProgress, setStoryProgress] = useState(0)
  const [modeIcons, setModeIcons] = useState({ free: '', explore: '' })

  useEffect(() => {
    const mode = getExploreMode()
    setCurrentMode(mode)

    const progress = getCurrentStoryProgress()
    if (progress) {
      const story = getStoryById(progress.storyId)
      setCurrentStory(story || null)
      const totalNodes = story ? Object.keys(story.nodes).length : 0
      setStoryProgress(
        totalNodes > 0
          ? Math.round((progress.completedNodes.length / totalNodes) * 100)
          : 0
      )
    }

    // 加载模式图标
    const loadIcons = async () => {
      const [freeUrl, exploreUrl] = await Promise.all([
        getTempFileURL(MODE_ICON_FREE),
        getTempFileURL(MODE_ICON_EXPLORE)
      ])
      setModeIcons({ free: freeUrl || '', explore: exploreUrl || '' })
    }
    loadIcons()
  }, [])

  const handleModeChange = (mode: StoryMode) => {
    if (mode === currentMode) {
      setShowSelector(false)
      return
    }
    setExploreMode(mode)
    setCurrentMode(mode)
    onModeChange?.(mode)
    setShowSelector(false)
    Taro.showToast({
      title: mode === 'explore' ? '已进入探索模式' : '已切换自由模式',
      icon: 'success'
    })
  }

  return (
    <>
      {/* 悬浮触发按钮 */}
      <View className='ms-trigger' onClick={() => setShowSelector(true)}>
        <View className={`ms-trigger-dot ${currentMode}`} />
        <Text className='ms-trigger-label'>
          {currentMode === 'free' ? '自由' : '探索'}
        </Text>
      </View>

      {/* 弹窗 */}
      {showSelector && (
        <View className='ms-overlay' onClick={() => setShowSelector(false)}>
          <View className='ms-sheet' onClick={e => e.stopPropagation()}>
            <View className='ms-sheet-top-line' />

            {/* 头部 */}
            <View className='ms-head'>
              <Text className='ms-head-eyebrow'>探索模式</Text>
              <Text className='ms-head-title'>选择你的旅行方式</Text>
            </View>

            {/* 选项组 */}
            <View className='ms-options'>

              {/* 自由模式 */}
              <View
                className={`ms-option ${currentMode === 'free' ? 'ms-option--active' : ''}`}
                onClick={() => handleModeChange('free')}
              >
                <View className='ms-option-left'>
                  <View className='ms-option-icon ms-option-icon--free'>
                    {modeIcons.free ? (
                      <Image className='ms-mode-icon-img' src={modeIcons.free} mode='aspectFit' />
                    ) : (
                      <Text className='ms-option-emoji'>🗺️</Text>
                    )}
                  </View>
                  <View className='ms-option-text'>
                    <Text className='ms-option-name'>自由模式</Text>
                    <Text className='ms-option-desc'>随意漫游，自行打卡</Text>
                  </View>
                </View>
                {currentMode === 'free' && (
                  <View className='ms-option-check' />
                )}
              </View>

              {/* 探索模式 */}
              <View
                className={`ms-option ${currentMode === 'explore' ? 'ms-option--active' : ''}`}
                onClick={() => handleModeChange('explore')}
              >
                <View className='ms-option-left'>
                  <View className='ms-option-icon ms-option-icon--explore'>
                    {modeIcons.explore ? (
                      <Image className='ms-mode-icon-img' src={modeIcons.explore} mode='aspectFit' />
                    ) : (
                      <Image className='ms-hero-avatar' src={heroAvatar} mode='aspectFill' />
                    )}
                  </View>
                  <View className='ms-option-text'>
                    <Text className='ms-option-name'>{heroName} · 剧情</Text>
                    <Text className='ms-option-desc'>跟随故事线探索成都</Text>
                  </View>
                </View>
                {currentMode === 'explore' && (
                  <View className='ms-option-check' />
                )}
              </View>
            </View>

            {/* 进度条：仅探索模式且有故事时显示 */}
            {currentMode === 'explore' && currentStory && (
              <View className='ms-progress-block'>
                <View className='ms-progress-meta'>
                  <Text className='ms-progress-story'>{currentStory.title}</Text>
                  <Text className='ms-progress-pct'>{storyProgress}%</Text>
                </View>
                <View className='ms-progress-track'>
                  <View
                    className='ms-progress-fill'
                    style={{ width: `${storyProgress}%` }}
                  />
                </View>
              </View>
            )}

            {/* 关闭 */}
            <View className='ms-close' onClick={() => setShowSelector(false)}>
              <Text className='ms-close-text'>关闭</Text>
            </View>
          </View>
        </View>
      )}
    </>
  )
}

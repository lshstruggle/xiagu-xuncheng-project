/**
 * 故事路线地图标记组件
 * 在地图上显示故事路线指引和进度
 */

import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import type { StoryLine, StoryChapter } from '../../types/story'
import { getCurrentStoryProgress, getStoryById } from '../../services/story'
import './index.scss'

interface StoryRouteProps {
  visible: boolean
  onClose: () => void
}

export default function StoryRoute({ visible, onClose }: StoryRouteProps) {
  const [story, setStory] = useState<StoryLine | null>(null)
  const [currentChapterId, setCurrentChapterId] = useState<string>('')
  const [completedChapters, setCompletedChapters] = useState<string[]>([])

  useEffect(() => {
    if (visible) {
      loadStoryProgress()
    }
  }, [visible])

  const loadStoryProgress = () => {
    const progress = getCurrentStoryProgress()
    if (progress) {
      const storyData = getStoryById(progress.storyId)
      setStory(storyData || null)
      setCurrentChapterId(progress.currentChapterId)
      setCompletedChapters(progress.completedChapters)
    }
  }

  // 跳转到指定地点
  const navigateToLocation = (chapter: StoryChapter) => {
    const node = story?.nodes[chapter.nodes[0]]
    if (node?.location) {
      Taro.openLocation({
        latitude: node.location.lat,
        longitude: node.location.lng,
        name: node.location.name,
        address: node.location.address
      })
    }
  }

  // 获取章节状态
  const getChapterStatus = (chapter: StoryChapter) => {
    if (completedChapters.includes(chapter.id)) {
      return 'completed'
    }
    if (chapter.id === currentChapterId) {
      return 'current'
    }
    return 'locked'
  }

  if (!visible || !story) return null

  return (
    <View className='story-route-overlay' onClick={onClose}>
      <View className='story-route-container' onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <View className='route-header'>
          <Image className='hero-avatar-small' src={story.coverImage} mode='aspectFill' />
          <View className='header-info'>
            <Text className='story-title'>{story.title}</Text>
            <Text className='story-subtitle'>{story.subtitle}</Text>
          </View>
          <View className='close-btn' onClick={onClose}>
            <Text className='close-icon'>✕</Text>
          </View>
        </View>

        {/* 路线时间轴 */}
        <View className='route-timeline'>
          {story.chapters.map((chapter, index) => {
            const status = getChapterStatus(chapter)
            return (
              <View
                key={chapter.id}
                className={`timeline-item ${status}`}
                onClick={() => navigateToLocation(chapter)}
              >
                {/* 节点标记 */}
                <View className='timeline-marker'>
                  <View className={`marker-dot ${status}`}>
                    {status === 'completed' && <Text className='marker-icon'>✓</Text>}
                    {status === 'current' && <Text className='marker-icon'>📍</Text>}
                    {status === 'locked' && <Text className='marker-icon'>🔒</Text>}
                  </View>
                  {index < story.chapters.length - 1 && (
                    <View className={`timeline-line ${status}`} />
                  )}
                </View>

                {/* 章节信息 */}
                <View className='chapter-info'>
                  <Text className='chapter-title'>{chapter.title}</Text>
                  <Text className='chapter-subtitle'>{chapter.subtitle}</Text>
                  <View className='location-tag'>
                    <Text className='location-icon'>📍</Text>
                    <Text className='location-name'>{chapter.locationName}</Text>
                  </View>
                  {chapter.required && (
                    <View className='required-badge'>
                      <Text className='required-text'>主线</Text>
                    </View>
                  )}
                </View>

                {/* 状态标签 */}
                <View className={`status-badge ${status}`}>
                  <Text className='status-text'>
                    {status === 'completed' ? '已完成' : status === 'current' ? '进行中' : '未开始'}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* 底部提示 */}
        <View className='route-footer'>
          <Text className='footer-hint'>💡 点击章节可查看地图位置</Text>
        </View>
      </View>
    </View>
  )
}

/**
 * 故事媒体查看器
 * 支持：实景图、选手照片、比赛画面
 * 支持：全屏预览、左右滑动切换
 */

import React, {
  useState,
  useCallback
} from 'react'
import Taro from '@tarojs/taro'
import {
  View,
  Text,
  Image,
  Swiper,
  SwiperItem
} from '@tarojs/components'
import './StoryMediaViewer.scss'

// ============ 类型定义 ============
export interface StoryMedia {
  type: 'scene' | 'player' | 'match' | 'fit'
  url: string
  caption?: string
  tag?: string
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scaleToFill' | 'aspectFit' | 'aspectFill'
}

interface StoryMediaViewerProps {
  mediaList: StoryMedia[]    // 支持多张图片轮播
  onClose?: () => void       // 全屏模式关闭回调
  compact?: boolean          // 紧凑模式（嵌入气泡）vs 全屏模式
}

// 媒体类型对应的标签配置
const MEDIA_TYPE_CONFIG = {
  scene: {
    icon: '📍',
    label: '实景',
    color: 'rgba(79, 195, 247, 0.9)'
  },
  player: {
    icon: '⭐',
    label: '选手',
    color: 'rgba(245, 197, 24, 0.9)'
  },
  match: {
    icon: '🏆',
    label: '赛事',
    color: 'rgba(255, 107, 107, 0.9)'
  }
}

// ============ 组件主体 ============
export default function StoryMediaViewer({
  mediaList,
  onClose,
  compact = true
}: StoryMediaViewerProps) {

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(
    new Array(mediaList.length).fill(false)
  )
  const [loadError, setLoadError] = useState<boolean[]>(
    new Array(mediaList.length).fill(false)
  )

  // ---- 图片加载成功 ----
  const handleImageLoad = useCallback((index: number) => {
    setImageLoaded(prev => {
      const next = [...prev]
      next[index] = true
      return next
    })
  }, [])

  // ---- 图片加载失败 ----
  const handleImageError = useCallback((index: number) => {
    setLoadError(prev => {
      const next = [...prev]
      next[index] = true
      return next
    })
  }, [])

  // ---- Swiper切换 ----
  const handleSwiperChange = useCallback((e: any) => {
    setCurrentIndex(e.detail.current)
  }, [])

  // ---- 点击进入全屏预览 ----
  const handleEnterFullscreen = useCallback(() => {
    if (compact) {
      // 使用微信原生图片预览
      const urls = mediaList.map(m => m.url)
      Taro.previewImage({
        current: mediaList[currentIndex].url,
        urls,
        success: () => {},
        fail: () => {
          // 降级：切换为自定义全屏模式
          setIsFullscreen(true)
        }
      })
    }
  }, [compact, mediaList, currentIndex])

  // ---- 退出全屏 ----
  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false)
    onClose?.()
  }, [onClose])

  const currentMedia = mediaList[currentIndex]
  const typeConfig = MEDIA_TYPE_CONFIG[currentMedia?.type || 'scene']

  // ============ 紧凑模式渲染（嵌入剧情框上方）============
  if (compact) {
    return (
      <View className='media-viewer-embedded'>
        {/* 关闭按钮 - 右上角 */}
        <View className='media-embedded-close' onClick={() => onClose?.()}>
          <Text className='media-embedded-close-icon'>✕</Text>
        </View>

        {/* 单张图片 */}
        {mediaList.length === 1 ? (
          <View className='media-embedded-content'>
            {/* 加载占位 */}
            {!imageLoaded[0] && !loadError[0] && (
              <View className='media-placeholder'>
                <View className='media-loading-spinner' />
                <Text className='media-loading-text'>加载中...</Text>
              </View>
            )}

            {/* 加载失败 */}
            {loadError[0] && (
              <View className='media-error'>
                <Text className='media-error-icon'>🖼</Text>
                <Text className='media-error-text'>图片加载失败</Text>
              </View>
            )}

            {/* 实际图片 */}
            <Image
              className={`${(currentMedia.fit === 'aspectFit' || currentMedia.type === 'fit') ? 'media-embedded-img-fit' : 'media-embedded-img'} ${imageLoaded[0] ? 'loaded' : ''}`}
              src={currentMedia.url}
              mode={(currentMedia.fit === 'aspectFit' || currentMedia.type === 'fit') ? 'aspectFit' : 'aspectFill'}
              onLoad={() => handleImageLoad(0)}
              onError={() => handleImageError(0)}
              lazyLoad
            />

            {/* 底部信息栏 */}
            {(currentMedia.caption || currentMedia.tag) && (
              <View className='media-embedded-info'>
                {currentMedia.caption && (
                  <Text className='media-embedded-caption'>
                    {currentMedia.caption}
                  </Text>
                )}
                {currentMedia.tag && (
                  <Text className='media-embedded-tag'>{currentMedia.tag}</Text>
                )}
              </View>
            )}
          </View>

        ) : (
          // ---- 多张图片：Swiper轮播 ----
          <View className='media-embedded-swiper-wrapper'>
            <Swiper
              className='media-embedded-swiper'
              circular
              onChange={handleSwiperChange}
            >
              {mediaList.map((media, index) => {
                const config = MEDIA_TYPE_CONFIG[media.type]
                return (
                  <SwiperItem key={index} className='media-embedded-swiper-item'>
                    {/* 加载占位 */}
                    {!imageLoaded[index] && !loadError[index] && (
                      <View className='media-placeholder'>
                        <View className='media-loading-spinner' />
                      </View>
                    )}

                    <Image
                      className={`${(media.fit === 'aspectFit' || media.type === 'fit') ? 'media-embedded-img-fit' : 'media-embedded-img'} ${imageLoaded[index] ? 'loaded' : ''}`}
                      src={media.url}
                      mode={(media.fit === 'aspectFit' || media.type === 'fit') ? 'aspectFit' : 'aspectFill'}
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                      lazyLoad
                    />

                    {/* 底部信息 */}
                    {(media.caption || media.tag) && (
                      <View className='media-embedded-info'>
                        {media.caption && (
                          <Text className='media-embedded-caption'>
                            {media.caption}
                          </Text>
                        )}
                        {media.tag && (
                          <Text className='media-embedded-tag'>{media.tag}</Text>
                        )}
                      </View>
                    )}
                  </SwiperItem>
                )
              })}
            </Swiper>

            {/* 轮播指示点 */}
            <View className='swiper-dots-embedded'>
              {mediaList.map((_, index) => (
                <View
                  key={index}
                  className={`swiper-dot ${index === currentIndex ? 'active' : ''}`}
                />
              ))}
            </View>

            {/* 图片计数 */}
            <View className='swiper-counter-embedded'>
              <Text className='swiper-counter-text'>
                {currentIndex + 1}/{mediaList.length}
              </Text>
            </View>
          </View>
        )}
      </View>
    )
  }

  // ============ 全屏模式渲染 ============
  return (
    <View className='media-viewer-fullscreen'>
      {/* 关闭按钮 */}
      <View className='fullscreen-close' onClick={handleExitFullscreen}>
        <Text className='fullscreen-close-icon'>✕</Text>
      </View>

      {/* 全屏图片 */}
      <Swiper
        className='fullscreen-swiper'
        current={currentIndex}
        onChange={handleSwiperChange}
        circular
      >
        {mediaList.map((media, index) => (
          <SwiperItem key={index} className='fullscreen-swiper-item'>
            <Image
              className='fullscreen-img'
              src={media.url}
              mode='aspectFit'
              onLoad={() => handleImageLoad(index)}
              lazyLoad
            />
          </SwiperItem>
        ))}
      </Swiper>

      {/* 底部信息 */}
      <View className='fullscreen-info'>
        <View
          className='fullscreen-type-tag'
          style={{
            background: MEDIA_TYPE_CONFIG[currentMedia?.type]?.color
          }}
        >
          <Text className='fullscreen-type-text'>
            {MEDIA_TYPE_CONFIG[currentMedia?.type]?.icon}
            {MEDIA_TYPE_CONFIG[currentMedia?.type]?.label}
          </Text>
        </View>
        {currentMedia?.caption && (
          <Text className='fullscreen-caption'>{currentMedia.caption}</Text>
        )}
        {currentMedia?.tag && (
          <Text className='fullscreen-tag'>{currentMedia.tag}</Text>
        )}
        {/* 分页指示 */}
        <View className='fullscreen-dots'>
          {mediaList.map((_, index) => (
            <View
              key={index}
              className={`fullscreen-dot ${
                index === currentIndex ? 'active' : ''
              }`}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

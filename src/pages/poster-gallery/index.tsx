import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import FutureBg from '../../components/future-bg'
import './index.scss'

interface Poster {
  id: string
  url: string
  unlockTime: number
}

// Boss 对应名称映射
const POSTER_NAME_MAP: Record<string, string> = {
  'boss_zhuzai_poster': '主宰击败海报',
  'boss_baojun_poster': '暴君击败海报',
  'boss_longwang_poster': '风暴龙王击败海报'
}

export default function PosterGallery() {
  const [posters, setPosters] = useState<Poster[]>([])

  useEffect(() => {
    // 获取本地缓存解锁的海报记录
    const unlockedPosters = Taro.getStorageSync('unlocked_boss_posters') || []
    setPosters(unlockedPosters)
  }, [])

  const handlePreview = (currentUrl: string) => {
    const urls = posters.map(p => p.url)
    Taro.previewImage({
      current: currentUrl,
      urls
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <View className='poster-gallery-page'>
      <FutureBg />
      <ScrollView className='poster-scroll' scrollY>
        <View className='gallery-header'>
        <Text className='gallery-title'>海报储藏室</Text>
        <Text className='gallery-subtitle'>存放你在峡谷探索中收集到的所有海报</Text>
      </View>

      {posters.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>🖼️</Text>
          <Text className='empty-text'>还没有收集到任何海报</Text>
          <Text className='empty-text' style={{ fontSize: '12px', marginTop: '8px' }}>快去探索峡谷或完成挑战，解锁专属海报吧！</Text>
        </View>
      ) : (
        <View className='poster-list'>
          {posters.map((poster) => (
            <View 
              key={poster.id} 
              className='poster-item'
              onClick={() => handlePreview(poster.url)}
            >
              <Image 
                className='poster-img' 
                src={poster.url} 
                mode='aspectFill' 
              />
              <View className='poster-info'>
                <Text className='poster-name'>
                  {POSTER_NAME_MAP[poster.id] || '神秘首领海报'}
                </Text>
                <Text className='poster-date'>获取于 {formatDate(poster.unlockTime)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      </ScrollView>
    </View>
  )
}

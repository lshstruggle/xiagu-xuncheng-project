import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import FutureBg from '../../components/future-bg'
import './index.scss'

interface Poster {
  id: string
  url: string
  unlockTime: number
}

// 海报名称映射
const POSTER_NAME_MAP: Record<string, string> = {
  'boss_zhuzai_poster': '主宰击败海报',
  'boss_baojun_poster': '暴君击败海报',
  'boss_longwang_poster': '风暴龙王击败海报',
  'poster_niliu_shanghai': '逆流而上海报',
  'poster_kuaile_dianjing': '快乐电竞海报'
}

export default function PosterGallery() {
  const [posters, setPosters] = useState<Poster[]>([])
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null)

  useEffect(() => {
    // 获取本地缓存解锁的海报记录
    const unlockedPosters = Taro.getStorageSync('unlocked_boss_posters') || []
    setPosters(unlockedPosters)
  }, [])

  // 页面级分享配置
  useShareAppMessage(() => {
    if (selectedPoster) {
      return {
        title: `我在峡谷寻城记获得了「${POSTER_NAME_MAP[selectedPoster.id] || '专属海报'}」！`,
        path: '/pages/poster-gallery/index',
        imageUrl: selectedPoster.url
      }
    }
    return {
      title: '峡谷寻城记 · 海报储藏室',
      path: '/pages/poster-gallery/index'
    }
  })

  const handlePosterClick = (poster: Poster) => {
    setSelectedPoster(poster)
  }

  const handleCloseDetail = () => {
    setSelectedPoster(null)
  }

  const handleSharePoster = async () => {
    if (!selectedPoster) return
    Taro.showLoading({ title: '准备分享...' })
    try {
      let imageUrl = selectedPoster.url
      // 云存储 URL 转为临时 HTTPS URL
      if (imageUrl.startsWith('cloud://')) {
        const { fileList } = await Taro.cloud.getTempFileURL({ fileList: [imageUrl] })
        imageUrl = fileList[0]?.tempFileURL || imageUrl
      }
      // 下载到本地临时文件
      const downloadRes = await Taro.downloadFile({ url: imageUrl })
      await Taro.showShareImageMenu({ path: downloadRes.tempFilePath })
    } catch (e) {
      console.error('分享海报失败', e)
      // 降级：唤起页面级分享
      Taro.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage'] })
    } finally {
      Taro.hideLoading()
    }
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
              onClick={() => handlePosterClick(poster)}
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

      {/* 海报详情弹窗 */}
      {selectedPoster && (
        <View className='poster-detail-overlay' catchMove onClick={handleCloseDetail}>
          <View className='poster-detail-card' onClick={(e) => e.stopPropagation()}>
            {/* 关闭按钮 */}
            <View className='poster-detail-close' onClick={handleCloseDetail}>
              <Text className='poster-detail-close-icon'>✕</Text>
            </View>

            {/* 大图 */}
            <Image
              className='poster-detail-img'
              src={selectedPoster.url}
              mode='aspectFit'
            />

            {/* 海报信息 */}
            <View className='poster-detail-info'>
              <Text className='poster-detail-name'>
                {POSTER_NAME_MAP[selectedPoster.id] || '神秘海报'}
              </Text>
              <Text className='poster-detail-date'>
                获取于 {formatDate(selectedPoster.unlockTime)}
              </Text>
            </View>

            {/* 分享按钮 */}
            <View className='poster-detail-share-btn' onClick={handleSharePoster}>
              <Text className='poster-detail-share-icon'>↗</Text>
              <Text className='poster-detail-share-text'>分享给好友</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

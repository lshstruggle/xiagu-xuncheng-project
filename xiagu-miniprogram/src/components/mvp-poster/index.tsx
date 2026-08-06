import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import type { MVPReportData } from '../../services/daily-report'
import './index.scss'

interface MVPPosterProps {
  visible: boolean
  reportData: MVPReportData
  onClose: () => void
  onSave?: () => void
}

// 云存储中的MVP画报图片路径
const MVP_POSTER_URL = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/mvp画报.png'

export default function MVPPoster({ visible, reportData, onClose, onSave }: MVPPosterProps) {
  const [posterUrl, setPosterUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (visible) {
      loadPosterImage()
    }
  }, [visible])

  const loadPosterImage = async () => {
    setLoading(true)
    try {
      // 获取云存储临时链接
      const { fileList } = await Taro.cloud.getTempFileURL({
        fileList: [MVP_POSTER_URL]
      })
      
      if (fileList && fileList.length > 0 && fileList[0].tempFileURL) {
        setPosterUrl(fileList[0].tempFileURL)
      }
    } catch (e) {
      console.error('加载海报图片失败', e)
      Taro.showToast({ title: '图片加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveImage = async () => {
    if (!posterUrl) return
    
    try {
      Taro.showLoading({ title: '保存中...' })
      
      // 先下载图片到本地
      const downloadRes = await Taro.downloadFile({
        url: posterUrl
      })
      
      // 保存到相册
      await Taro.saveImageToPhotosAlbum({
        filePath: downloadRes.tempFilePath
      })
      
      Taro.showToast({ title: '保存成功', icon: 'success' })
      onSave?.()
    } catch (e) {
      console.error('保存图片失败', e)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const handleShare = () => {
    // 触发分享功能
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }

  if (!visible) return null

  return (
    <View className='poster-overlay' onClick={onClose}>
      <View className='poster-container' onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <View className='poster-close' onClick={onClose}>
          <Text className='close-icon'>✕</Text>
        </View>

        {/* 海报展示区域 - 9:16比例 */}
        <View className='poster-frame'>
          {loading ? (
            <View className='poster-loading'>
              <Text className='loading-text'>加载中...</Text>
            </View>
          ) : (
            <Image 
              className='poster-image' 
              src={posterUrl} 
              mode='aspectFit'
              showMenuByLongpress
            />
          )}
          
        </View>

        {/* 底部操作栏 */}
        <View className='poster-actions'>
          <View className='action-btn' onClick={handleShare}>
            <Text className='btn-text'>分享</Text>
          </View>
          <View className='action-btn primary' onClick={handleSaveImage}>
            <Text className='btn-text'>保存海报</Text>
          </View>
        </View>

        {/* 提示文字 */}
        <Text className='poster-hint'>长按图片可发送给朋友</Text>
      </View>
    </View>
  )
}

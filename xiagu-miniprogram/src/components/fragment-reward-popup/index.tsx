import { View, Text, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import { getTempFileURL } from '../../utils/temp-url-cache'

const HERO_FRAG_CLOUD = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/英雄碎片.png'
const SKIN_FRAG_CLOUD = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/皮肤碎片.png'

interface FragmentRewardPopupProps {
  heroFragments: number
  skinFragments: number
  isFirstTime: boolean
  onClose: () => void
}

export default function FragmentRewardPopup({
  heroFragments,
  skinFragments,
  isFirstTime,
  onClose,
}: FragmentRewardPopupProps) {
  const [icons, setIcons] = useState({ hero: '', skin: '' })
  const [show, setShow] = useState(false)

  useEffect(() => {
    loadIcons()
    // 延迟显示以实现入场动画
    const timer = setTimeout(() => setShow(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const loadIcons = async () => {
    try {
      const [heroUrl, skinUrl] = await Promise.all([
        getTempFileURL(HERO_FRAG_CLOUD),
        getTempFileURL(SKIN_FRAG_CLOUD),
      ])
      setIcons({ hero: heroUrl || '', skin: skinUrl || '' })
    } catch (err) {
      console.error('加载碎片图标失败', err)
    }
  }

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  return (
    <View className={`frag-overlay ${show ? 'show' : ''}`} onClick={handleClose}>
      <View className='frag-card' onClick={(e) => e.stopPropagation()}>
        {/* 首次奖励横幅 */}
        {isFirstTime && (
          <View className='frag-first-banner'>
            <Text className='frag-first-text'>首次探索 奖励翻倍！</Text>
          </View>
        )}

        {/* 标题 */}
        <Text className='frag-title'>探索奖励</Text>

        {/* 碎片展示 */}
        <View className='frag-row'>
          <View className='frag-item'>
            {icons.hero ? (
              <Image className='frag-icon-img' src={icons.hero} mode='aspectFit' />
            ) : (
              <Text className='frag-icon-emoji'>⚔️</Text>
            )}
            <Text className='frag-count'>+{heroFragments}</Text>
            <Text className='frag-label'>英雄碎片</Text>
          </View>

          <View className='frag-divider'></View>

          <View className='frag-item'>
            {icons.skin ? (
              <Image className='frag-icon-img' src={icons.skin} mode='aspectFit' />
            ) : (
              <Text className='frag-icon-emoji'>👗</Text>
            )}
            <Text className='frag-count'>+{skinFragments}</Text>
            <Text className='frag-label'>皮肤碎片</Text>
          </View>
        </View>

        {/* 关闭按钮 */}
        <View className='frag-close-btn' onClick={handleClose}>
          <Text className='frag-close-text'>收下奖励</Text>
        </View>
      </View>
    </View>
  )
}

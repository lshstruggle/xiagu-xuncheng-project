import { View, Text, Image, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import type { BossConfig, MATCH_FRAME_IMAGE } from '../../config/bosses'
import { getTempFileURL } from '../../utils/temp-url-cache'

interface BossMatchModalProps {
  boss: BossConfig
  onClose: () => void
  onStartChallenge: () => void
}

export default function BossMatchModal({ boss, onClose, onStartChallenge }: BossMatchModalProps) {
  const [frameUrl, setFrameUrl] = useState('')
  const [attackGifUrl, setAttackGifUrl] = useState('')

  useEffect(() => {
    loadAssets()
  }, [boss])

  const loadAssets = async () => {
    const [frame, attack] = await Promise.all([
      getTempFileURL(MATCH_FRAME_IMAGE),
      getTempFileURL(boss.attackGif)
    ])
    if (frame) setFrameUrl(frame)
    if (attack) setAttackGifUrl(attack)
  }

  const handleInvite = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    })
  }

  return (
    <View className='boss-match-overlay' onClick={onClose}>
      <View className='boss-match-modal' onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <View className='match-close' onClick={onClose}>
          <Text>✕</Text>
        </View>

        {/* 顶部标题 */}
        <View className='match-header'>
          <Text className='match-boss-name'>{boss.title}</Text>
          <Text className='match-subtitle'>准备挑战 · {boss.locationName}</Text>
        </View>

        {/* 匹配框区域 */}
        <View className='match-frames'>
          {[1, 2, 3].map((i) => (
            <View key={i} className='match-frame'>
              {frameUrl ? (
                <Image className='match-frame-img' src={frameUrl} mode='aspectFill' />
              ) : (
                <View className='match-frame-placeholder'>
                  <Text>?</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 底部按钮 */}
        <View className='match-actions'>
          <Button className='match-btn match-btn-invite' openType='share'>
            邀请同行
          </Button>
          <Button className='match-btn match-btn-challenge' onClick={onStartChallenge}>
            开始挑战
          </Button>
        </View>
      </View>
    </View>
  )
}

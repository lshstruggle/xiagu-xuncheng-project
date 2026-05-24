import { View, Text, Image } from '@tarojs/components'
import './index.scss'

interface BookmarkData {
  title: string
  quote: string
  visualDesc?: string
  bgColor?: string
  accentColor?: string
}

interface BookmarkCardProps {
  data: BookmarkData
  rarity: string
  rarityLabel: string
  rarityColor: string
  collected?: boolean
  showDetail?: boolean
  animated?: boolean
  hintText?: string
  collectDate?: string
  onTap?: () => void
}

export default function BookmarkCard({
  data,
  rarity,
  rarityLabel,
  rarityColor,
  collected = false,
  showDetail = false,
  animated = false,
  hintText = '尚未发现',
  collectDate = '',
  onTap
}: BookmarkCardProps) {
  const getEmoji = () => {
    switch (rarity) {
      case 'normal': return '😆'
      case 'rare': return '🍵'
      case 'epic': return '🌃'
      case 'legendary': return '⚔️'
      case 'limited': return '🐉'
      default: return '✨'
    }
  }

  return (
    <View 
      className={`bookmark-wrapper ${animated ? 'animate-in' : ''} ${showDetail ? 'detail' : 'thumb'}`}
      onClick={onTap}
    >
      <View 
        className={`bookmark-card rarity-${rarity}`}
        style={{ '--accent': rarityColor, backgroundColor: data.bgColor || '#F5ECD8' } as any}
      >
        {/* 顶部视觉区域 */}
        <View className='bookmark-visual' style={{ backgroundColor: data.bgColor || '#1A1A2E' }}>
          {/* 稀有度光效 */}
          <View className={`rarity-glow rarity-glow-${rarity}`}></View>
          
          {/* 占位插画区 */}
          <View className='visual-placeholder'>
            <Text className='visual-emoji'>{getEmoji()}</Text>
            <Text className='visual-title'>{data.title}</Text>
          </View>
        </View>

        {/* 金色分割线 */}
        <View className='bookmark-divider'>
          <View className='divider-line'></View>
          <View className='divider-ornament'>◆</View>
          <View className='divider-line'></View>
        </View>

        {/* 金句区域 */}
        <View className='bookmark-quote'>
          <Text className='quote-mark'>"</Text>
          <Text className='quote-content'>{data.quote}</Text>
          <Text className='quote-mark end'>"</Text>
        </View>

        {/* 底部信息 */}
        <View className='bookmark-info'>
          <Text className='info-rarity' style={{ color: rarityColor }}>{rarityLabel}</Text>
          {collected && <Text className='info-city'>成都 · {collectDate}</Text>}
        </View>

        {/* 书签尖角 */}
        <View 
          className='bookmark-tip' 
          style={{ borderTopColor: data.bgColor === '#1A1A2E' ? '#1a1520' : '#EDE0CA' }}
        ></View>
      </View>

      {/* 未收集遮罩 */}
      {!collected && !showDetail && (
        <View className='locked-mask'>
          <Text className='locked-icon'>🔒</Text>
          <Text className='locked-hint'>{hintText}</Text>
        </View>
      )}
    </View>
  )
}

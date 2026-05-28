import { View, Text, Image, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getTempFileURLs } from '../../utils/temp-url-cache'
import TreasureMap from '../../components/treasure-map'
import FutureBg from '../../components/future-bg'
import StartExploreBtn from '../../assets/images/start-explore-btn.jpg'
import './index.scss'

const routes = (imageUrls: Record<string, string>) => [
  {
    id: 1,
    name: '宽窄巷子探秘',
    poiCount: 8,
    duration: '2小时',
    tags: ['🏮1个荣耀灯塔', '⭐2个选手足迹'],
    difficulty: '简单',
    image: imageUrls.kuanzhai || ''
  },
  {
    id: 2,
    name: '锦里古街漫游',
    poiCount: 6,
    duration: '1.5小时',
    tags: ['🏮2个荣耀灯塔', '⭐1个选手足迹'],
    difficulty: '中等',
    image: imageUrls.jinli || ''
  },
  {
    id: 3,
    name: '太古里巡礼',
    poiCount: 5,
    duration: '1小时',
    tags: ['🏮1个荣耀灯塔', '⭐3个选手足迹'],
    difficulty: '困难',
    image: imageUrls.chunxi || ''
  }
]

export default function Index() {
  const [activeTab, setActiveTab] = useState('home')
  const [images, setImages] = useState<Record<string, string>>({
    kuanzhai: '',
    jinli: '',
    wuhou: '',
    chunxi: '',
    chengduCover: ''
  })
  const [treasureMapVisible, setTreasureMapVisible] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState(1)

  // 获取云存储图片的临时链接（带缓存）
  useEffect(() => {
    const loadImages = async () => {
      const urls = await getTempFileURLs(['kuanzhai', 'jinli', 'wuhou', 'chunxi', 'chengduCover'])
      setImages(urls)
    }
    loadImages()
  }, [])

  const startExplore = () => {
    Taro.navigateTo({ url: '/packageA/pages/hero-select/index' })
  }

  const goToExplore = () => {
    Taro.switchTab({ url: '/pages/checkin/index' })
  }

  const openTreasureMap = (routeId: number) => {
    setSelectedRouteId(routeId)
    setTreasureMapVisible(true)
  }

  const closeTreasureMap = () => {
    setTreasureMapVisible(false)
  }

  const handleStartExploreFromMap = (routeId: number) => {
    // 检查是否已选英雄
    const selectedHero = Taro.getStorageSync('selectedHero')
    if (selectedHero) {
      Taro.switchTab({ url: '/pages/checkin/index' })
    } else {
      Taro.navigateTo({ url: '/packageA/pages/hero-select/index' })
    }
  }

  return (
    <View className='container'>
      <FutureBg />
      <ScrollView className='page-scroll' scrollY>
        {/* 顶部导航 */}
        <View className='header'>
          <View className='location'>
            <Text className='location-icon'>📍</Text>
            <Text className='location-text'>成都</Text>
          </View>
          <View className='avatar-wrap'>
            <View className='avatar'>
              <Image 
                className='avatar-img' 
                src='https://game.gtimg.cn/images/yxzj/img201606/heroimg/109/109.jpg'
              />
            </View>
            <View className='badge'>3</View>
          </View>
        </View>

        {/* 城市横幅 */}
        <View className='city-banner'>
          <Image 
            className='banner-image' 
            src={images.chengduCover || ''}
            mode='aspectFill'
            onError={() => console.error('首页横幅图片加载失败')}
          />
          <View className='banner-overlay'></View>
          <View className='banner-content'>
            <View className='city-info'>
              <Text className='city-name'>成都·天府之国</Text>
              <Text className='city-desc'>千年蓉城，美食与文化的交汇</Text>
            </View>
            <View className='progress-wrap'>
              <View className='progress-label'>
                <Text className='label-text'>已探索</Text>
                <Text className='progress-value'>12%</Text>
              </View>
              <View className='progress-bar'>
                <View className='progress-fill' style={{ width: '12%' }}></View>
              </View>
            </View>
          </View>
        </View>

        {/* 推荐路线标题 */}
        <View className='section-title'>
          <View className='title-bar'></View>
          <Text className='title-text'>推荐路线</Text>
        </View>

        {/* 路线卡片滚动区 */}
        <ScrollView className='routes-scroll' scrollX showScrollbar={false}>
          {routes(images).map((route) => (
            <View key={route.id} className='route-card' onClick={() => openTreasureMap(route.id)}>
              <View className='card-image'>
                <Image className='card-bg-image' src={route.image} mode='aspectFill' />
                <View className='card-image-overlay'></View>
                <View className='difficulty-tag'>{route.difficulty}</View>
                <View className='duration-badge'>🕐 {route.duration}</View>
              </View>
              <View className='card-body'>
                <View className='card-header'>
                  <Text className='route-name'>{route.name}</Text>
                  <Text className='poi-count'>{route.poiCount}个地点</Text>
                </View>
                <View className='tags'>
                  {route.tags.map((tag, index) => (
                    <Text key={index} className='tag'>{tag}</Text>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 藏宝图组件 */}
        <TreasureMap
          visible={treasureMapVisible}
          routeId={selectedRouteId}
          onClose={closeTreasureMap}
          onStartExplore={handleStartExploreFromMap}
        />

        {/* CTA按钮 */}
        <View className='cta-wrap'>
          <Image
            className='cta-btn-img'
            src={StartExploreBtn}
            mode='scaleToFill'
            onClick={startExplore}
          />
        </View>
      </ScrollView>
    </View>
  )
}

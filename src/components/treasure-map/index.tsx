import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { ROUTES_CHENGDU, DIFFICULTY_COLOR, RouteConfig } from '../../config/routes-chengdu'
import { MAP_IMAGES, MAP_HOTSPOTS, TYPE_STYLE, MapHotspot } from '../../config/map-hotspots'
import { getTempFileURL } from '../../utils/temp-url-cache'
import './index.scss'

interface TreasureMapProps {
  visible: boolean
  routeId: number
  onClose: () => void
  onStartExplore?: (routeId: number) => void
}

interface StyledSpot extends MapHotspot {
  typeColor: string
  typeIcon: string
  typeLabel: string
  typeBg: string
  typeImage: string
}

interface BubbleData extends StyledSpot {
  bx: number
  by: number
}

export default function TreasureMap({ visible, routeId, onClose, onStartExplore }: TreasureMapProps) {
  const [route, setRoute] = useState<RouteConfig | null>(null)
  const [diffColor, setDiffColor] = useState('')
  const [mapImage, setMapImage] = useState('')
  const [spots, setSpots] = useState<StyledSpot[]>([])
  const [imgReady, setImgReady] = useState(false)
  
  // 关键修复：气泡数据和显示状态分离
  const [bubbleData, setBubbleData] = useState<BubbleData | null>(null)
  const [bubbleVisible, setBubbleVisible] = useState(false)
  const [bubbleFlip, setBubbleFlip] = useState(false) // true=气泡显示在POI下方

  // 初始化
  useEffect(() => {
    if (visible && routeId) {
      const r = ROUTES_CHENGDU.find(item => item.id === routeId)
      if (r) {
        setRoute(r)
        setDiffColor(DIFFICULTY_COLOR[r.difficulty] || '#999')
        setImgReady(false)
        setBubbleData(null)
        setBubbleVisible(false)

        // 加载热区数据
        const rawSpots = MAP_HOTSPOTS[routeId] || []
        const styledSpots: StyledSpot[] = rawSpots.map(s => ({
          ...s,
          typeColor: TYPE_STYLE[s.type]?.color || '#999',
          typeIcon: TYPE_STYLE[s.type]?.icon || '📍',
          typeLabel: TYPE_STYLE[s.type]?.label || '据点',
          typeBg: TYPE_STYLE[s.type]?.bg || 'linear-gradient(135deg,#333,#111)',
          typeImage: TYPE_STYLE[s.type]?.image || ''
        }))
        setSpots(styledSpots)

        // 加载云存储图片临时链接
        loadMapImage(routeId)
      }
    }
  }, [visible, routeId])

  // 加载地图图片
  const loadMapImage = async (rid: number) => {
    const cloudPath = MAP_IMAGES[rid]
    if (!cloudPath) {
      setImgReady(true)
      return
    }

    try {
      const tempUrl = await getTempFileURL(cloudPath)
      if (tempUrl) {
        setMapImage(tempUrl)
      } else {
        console.warn('获取藏宝图临时链接失败，请检查文件是否存在:', cloudPath)
        setMapImage('')
      }
    } catch (e) {
      console.error('加载地图图片失败:', e)
      setMapImage('')
    }
  }

  // 图片加载完成
  const onImgLoad = () => {
    setImgReady(true)
  }

  // 点击热区
  const tapSpot = useCallback((spot: StyledSpot) => {
    const styledSpot: BubbleData = {
      ...spot,
      bx: spot.x,
      by: spot.y,
      typeColor: TYPE_STYLE[spot.type]?.color || '#999',
      typeIcon: TYPE_STYLE[spot.type]?.icon || '📍',
      typeLabel: TYPE_STYLE[spot.type]?.label || '据点',
      typeBg: TYPE_STYLE[spot.type]?.bg || 'linear-gradient(135deg,#333,#111)',
      typeImage: TYPE_STYLE[spot.type]?.image || ''
    }

    // 翻转规则：POI靠近顶部(y<35%)时，气泡显示在下方
    const flip = spot.y < 35

    // 关键修复：先设数据再显示，保证DOM先就位再做opacity过渡
    setBubbleData(styledSpot)
    setBubbleFlip(flip)
    setBubbleVisible(false)

    // 下一帧再设visible，触发opacity过渡动画
    setTimeout(() => {
      setBubbleVisible(true)
    }, 30)
  }, [])

  // 关闭气泡 - 关键修复：先隐藏（opacity过渡），不立即销毁DOM
  const closeBubble = useCallback(() => {
    setBubbleVisible(false)
    // 过渡结束后再清除数据
    setTimeout(() => {
      setBubbleData(null)
    }, 250)
  }, [])

  // 设为指定路线
  const handleSetRoute = useCallback(() => {
    if (route) {
      Taro.setStorageSync('selectedRouteId', route.id)
      Taro.showToast({
        title: `已设为指定路线：${route.name}`,
        icon: 'success',
        duration: 2000
      })
      if (onStartExplore) {
        onStartExplore(route.id)
      }
      onClose()
    }
  }, [route, onStartExplore, onClose])

  // 关闭地图
  const handleClose = useCallback(() => {
    setBubbleData(null)
    setBubbleVisible(false)
    setBubbleFlip(false)
    onClose()
  }, [onClose])

  if (!route) return null

  return (
    <View className={`treasure-overlay ${visible ? 'show' : ''}`}>
      {/* 遮罩 */}
      <View className='tm-mask' onClick={handleClose} />

      {/* 弹窗 - 关键修复：不用transform，用opacity+visibility */}
      <View className={`tm-panel ${visible ? 'show' : ''}`}>
        {/* 顶栏 */}
        <View className='tm-header'>
          <View className='tm-row1'>
            <View className='tm-diff' style={{ background: diffColor }}>
              {route.difficultyLabel}
            </View>
            <Text className='tm-name'>{route.name}</Text>
            <View className='tm-close' onClick={handleClose}>✕</View>
          </View>
          <Text className='tm-desc'>{route.description}</Text>
          <View className='tm-stats'>
            <Text className='tm-stat'>📍 {spots.length}个据点</Text>
            <Text className='tm-stat'>🚶 {route.distance}</Text>
            <Text className='tm-stat'>⏱ {route.duration}</Text>
          </View>
          <View className='tm-tags-row'>
            <View className='tm-tags'>
              {route.tags.map((tag, i) => (
                <Text key={i} className='tm-tag'>{tag}</Text>
              ))}
            </View>
            <View className='tm-set-route-btn' onClick={handleSetRoute}>
              <Text className='tm-set-route-text'>设为指定路线</Text>
            </View>
          </View>
        </View>

        {/* 地图区域 - 关键修复：去掉scroll-view，改用普通view + overflow */}
        <View className='tm-map-area'>
          <View className='tm-box'>
            <View className='tm-frame'>
              {/* 地图图片 */}
              {mapImage && (
                <Image
                  className='tm-img'
                  src={mapImage}
                  mode='widthFix'
                  onLoad={onImgLoad}
                />
              )}

              {/* 热区层 */}
              {imgReady && (
                <View 
                  className='tm-hotspot-layer'
                  onClick={(e) => {
                    // 点击空白处关闭气泡
                    if (bubbleData) {
                      closeBubble()
                    }
                  }}
                >
                  {/* 热区 */}
                  {spots.map((spot, index) => (
                    <View
                      key={spot.id}
                      className='tm-hotspot'
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation()
                        tapSpot(spot)
                      }}
                    />
                  ))}

                  {/* 气泡卡片 - 关键修复：用hidden控制，不用wx:if */}
                  {bubbleData && (
                    <View
                      className={`tm-bubble ${bubbleVisible ? 'on' : 'off'} ${bubbleFlip ? 'flip-down' : 'flip-up'}`}
                      style={{ left: `${bubbleData.bx}%`, top: `${bubbleData.by}%` }}
                    >
                      <View className='tm-bcard' onClick={(e) => e.stopPropagation()}>
                        {/* 图片区 */}
                        <View className='tm-bimg-wrap'>
                          {bubbleData.image ? (
                            <Image className='tm-bimg' src={bubbleData.image} mode='aspectFill' />
                          ) : (
                            <View
                              className='tm-bimg-ph'
                              style={{ background: bubbleData.typeBg }}
                            >
                              {bubbleData.typeImage ? (
                                <Image className='tm-ph-img' src={bubbleData.typeImage} mode='aspectFit' />
                              ) : (
                                <Text className='tm-ph-icon'>{bubbleData.typeIcon}</Text>
                              )}
                              <Text className='tm-ph-label'>{bubbleData.typeLabel}</Text>
                            </View>
                          )}
                        </View>

                        {/* 信息区 */}
                        <View className='tm-bbody'>
                          <View className='tm-brow1'>
                            <Text className='tm-bname'>{bubbleData.name}</Text>
                            <Text className='tm-btag' style={{ color: bubbleData.typeColor }}>
                              {bubbleData.typeLabel}
                            </Text>
                          </View>
                          <Text className='tm-bbrief'>{bubbleData.brief}</Text>
                          {(bubbleData.price || bubbleData.duration) && (
                            <View className='tm-bmeta'>
                              {bubbleData.price && <Text className='tm-bm'>💰 {bubbleData.price}</Text>}
                              {bubbleData.duration && <Text className='tm-bm'>⏱ {bubbleData.duration}</Text>}
                            </View>
                          )}
                          <View className='tm-bflags'>
                            {bubbleData.isStart && <Text className='tm-bflag tm-bflag-s'>★ 起点</Text>}
                            {bubbleData.isEnd && <Text className='tm-bflag tm-bflag-e'>★ 终点</Text>}
                          </View>
                        </View>
                      </View>


                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

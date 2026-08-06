import { View, Text, Image, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import { api } from '../../services/api'
import FutureBg from '../../components/future-bg'
import { getTempFileURL } from '../../utils/temp-url-cache'

interface Commodity {
  id: string
  name: string
  type: 'hero' | 'skin'
  cost: number
  imgUrl: string
  isOwned: boolean
}

const HERO_FRAG_CLOUD = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/英雄碎片.png'
const SKIN_FRAG_CLOUD = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/皮肤碎片.png'

// 皮肤预览 GIF（凤求凰）
const SKIN_PREVIEW_GIFS = {
  idle: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/pet/皮肤/待机.gif',
  thinking: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/pet/皮肤/思考.gif',
  dragging: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/pet/皮肤/拖拽.gif',
}

type PreviewTab = 'idle' | 'thinking' | 'dragging'

const HERO_CONFIG: Array<{ id: string; name: string; cost: number; cloudPath: string }> = [
  { id: 'h_gongsun', name: '公孙离', cost: 58, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/公孙离_幻舞玲珑_头像.png' },
  { id: 'h_daqiao', name: '大乔', cost: 58, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/大乔_沧海之曜_头像.png' },
  { id: 'h_xiaoqiao', name: '小乔', cost: 58, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/小乔_恋之微风_头像.png' },
  { id: 'h_duoliya', name: '朵莉亚', cost: 68, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/朵莉亚_人鱼之歌_头像.png' },
  { id: 'h_wangzhaojun', name: '王昭君', cost: 68, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/王昭君_冰雪之华_头像.png' },
  { id: 'h_ailin', name: '艾琳', cost: 68, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/艾琳_精灵之舞_头像.png' },
  { id: 'h_huamulan', name: '花木兰', cost: 78, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/花木兰_传说之刃_头像.png' },
  { id: 'h_peiqinhu', name: '裴擒虎', cost: 78, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/裴擒虎_六合虎拳_头像.png' },
  { id: 'h_kai', name: '铠', cost: 88, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/铠_破灭刀锋_头像.png' },
  { id: 'h_hanxin', name: '韩信', cost: 88, cloudPath: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/韩信_国士无双_头像.png' },
]

export default function Shop() {
  const [currentTab, setCurrentTab] = useState<'hero' | 'skin'>('hero')
  // 初始值优先从本地缓存读取，保证和个人中心一致
  const cachedAssets = Taro.getStorageSync('user_assets') || { heroFragments: 0, skinFragments: 0 }
  const [userAssets, setUserAssets] = useState({
    heroFragments: cachedAssets.heroFragments || 0,
    skinFragments: cachedAssets.skinFragments || 0,
  })
  const [goods, setGoods] = useState<Commodity[]>([])
  const [fragIcons, setFragIcons] = useState({ hero: '', skin: '' })

  // 皮肤预览弹窗状态
  const [showPreview, setShowPreview] = useState(false)
  const [previewTab, setPreviewTab] = useState<PreviewTab>('idle')
  const [previewUrls, setPreviewUrls] = useState<Record<PreviewTab, string>>({ idle: '', thinking: '', dragging: '' })

  useEffect(() => {
    loadShopData()
  }, [])

  // 页面显示时刷新资产（从个人中心/打卡页返回时同步最新数据）
  Taro.useDidShow(() => {
    refreshAssets()
  })

  // 单独刷新资产（用于 useDidShow）
  const refreshAssets = async () => {
    try {
      const data = await api.getUserAssets()
      const mapped = {
        heroFragments: data.hero_fragments || 0,
        skinFragments: data.skin_fragments || 0,
      }
      setUserAssets(mapped)
      Taro.setStorageSync('user_assets', mapped)
    } catch (err) {
      // API 失败时保持现有状态（本地缓存已是最新）
      console.error('刷新资产失败', err)
    }
  }

  const loadShopData = async () => {
    try {
      Taro.showLoading({ title: '加载中' })

      const [assets, heroFragIcon, skinFragIcon, ...heroUrls] = await Promise.all([
        api.getUserAssets().catch(() => null),
        getTempFileURL(HERO_FRAG_CLOUD).catch(() => null),
        getTempFileURL(SKIN_FRAG_CLOUD).catch(() => null),
        ...HERO_CONFIG.map(h => getTempFileURL(h.cloudPath).catch(() => null))
      ])

      setFragIcons({ hero: heroFragIcon || '', skin: skinFragIcon || '' })

      const heroGoods: Commodity[] = HERO_CONFIG.map((h, idx) => ({
        id: h.id,
        name: h.name,
        type: 'hero' as const,
        cost: h.cost,
        imgUrl: heroUrls[idx] || '',
        isOwned: false
      }))

      const skinGoods: Commodity[] = [
        { id: 's_libai_01', name: '凤求凰 (桌宠)', type: 'skin', cost: 88, imgUrl: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/皮肤头像/李白_凤求凰_头像.png', isOwned: false }
      ]

      setGoods([...heroGoods, ...skinGoods])

      // API 成功则更新，失败则保持本地缓存值
      if (assets) {
        const mapped = {
          heroFragments: assets.hero_fragments || 0,
          skinFragments: assets.skin_fragments || 0,
        }
        setUserAssets(mapped)
        Taro.setStorageSync('user_assets', mapped)
      }
      Taro.hideLoading()
    } catch (err) {
      Taro.hideLoading()
      console.error('加载商城失败', err)
    }
  }

  // 打开皮肤预览弹窗
  const openSkinPreview = async () => {
    setShowPreview(true)
    setPreviewTab('idle')
    try {
      const [idle, thinking, dragging] = await Promise.all([
        getTempFileURL(SKIN_PREVIEW_GIFS.idle),
        getTempFileURL(SKIN_PREVIEW_GIFS.thinking),
        getTempFileURL(SKIN_PREVIEW_GIFS.dragging),
      ])
      setPreviewUrls({
        idle: idle || '',
        thinking: thinking || '',
        dragging: dragging || '',
      })
    } catch (err) {
      console.error('加载皮肤预览失败', err)
    }
  }

  const handleExchange = (item: Commodity) => {
    if (item.isOwned) return

    const currentFrag = item.type === 'hero' ? userAssets.heroFragments : userAssets.skinFragments
    if (currentFrag < item.cost) {
      Taro.showToast({ title: '碎片不足', icon: 'none' })
      return
    }

    Taro.showModal({
      title: '确认兑换',
      content: `是否消耗 ${item.cost} 个${item.type === 'hero' ? '英雄' : '皮肤'}碎片兑换【${item.name}】？`,
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '兑换中' })
          try {
            const result = await api.exchangeItem(item.id)

            if (result.hero_fragments !== undefined && result.skin_fragments !== undefined) {
              setUserAssets({
                heroFragments: result.hero_fragments,
                skinFragments: result.skin_fragments
              })
              Taro.setStorageSync('user_assets', {
                heroFragments: result.hero_fragments,
                skinFragments: result.skin_fragments
              })
            }

            setGoods(prev => prev.map(g => g.id === item.id ? { ...g, isOwned: true } : g))

            Taro.hideLoading()
            Taro.showToast({ title: '兑换成功！', icon: 'success' })
          } catch (err: any) {
            Taro.hideLoading()
            Taro.showToast({ title: err.message || '兑换失败', icon: 'none' })
          }
        }
      }
    })
  }

  return (
    <View className='shop-container'>
      <FutureBg />
      {/* 顶部资产栏 */}
      <View className='sticky-header'>
        <View className='asset-display'>
          <View className='asset-pill'>
            {fragIcons.hero ? (
              <Image className='asset-pill-img' src={fragIcons.hero} mode='aspectFit' />
            ) : (
              <Text className='asset-pill-icon'>⚔️</Text>
            )}
            <Text className='asset-pill-text'>{userAssets.heroFragments}</Text>
          </View>
          <View className='asset-pill'>
            {fragIcons.skin ? (
              <Image className='asset-pill-img' src={fragIcons.skin} mode='aspectFit' />
            ) : (
              <Text className='asset-pill-icon'>👗</Text>
            )}
            <Text className='asset-pill-text'>{userAssets.skinFragments}</Text>
          </View>
        </View>

        {/* Tab 切换 */}
        <View className='tabs'>
          <View
            className={`tab ${currentTab === 'hero' ? 'active' : ''}`}
            onClick={() => setCurrentTab('hero')}
          >
            英雄兑换
          </View>
          <View
            className={`tab ${currentTab === 'skin' ? 'active' : ''}`}
            onClick={() => setCurrentTab('skin')}
          >
            皮肤兑换
          </View>
        </View>
      </View>

      {/* 商品列表区 */}
      <ScrollView className='goods-list' scrollY>
        {goods.filter(g => g.type === currentTab).map(item => {
          const canAfford = (item.type === 'hero' ? userAssets.heroFragments : userAssets.skinFragments) >= item.cost
          const isSkin = item.type === 'skin'

          return (
            <View className='commodity-card' key={item.id}>
              <View className='goods-img-wrap' onClick={isSkin ? openSkinPreview : undefined}>
                {item.imgUrl ? (
                  <Image className='goods-img' src={item.imgUrl} mode='aspectFill' />
                ) : (
                  <Text className='goods-img-placeholder'>🎁</Text>
                )}
                {isSkin && <View className='goods-preview-badge'>👁 预览</View>}
              </View>
              <View className='goods-info'>
                <Text className='goods-name'>{item.name}</Text>
                <View className='goods-cost-row'>
                  {item.type === 'hero' ? (
                    fragIcons.hero ? (
                      <Image className='goods-cost-img' src={fragIcons.hero} mode='aspectFit' />
                    ) : (
                      <Text className='goods-cost-icon'>⚔️</Text>
                    )
                  ) : (
                    fragIcons.skin ? (
                      <Image className='goods-cost-img' src={fragIcons.skin} mode='aspectFit' />
                    ) : (
                      <Text className='goods-cost-icon'>👗</Text>
                    )
                  )}
                  <Text className='goods-cost'>{item.cost}</Text>
                  <Text className='goods-cost-label'>{item.type === 'hero' ? '英雄碎片' : '皮肤碎片'}</Text>
                </View>
              </View>
              <Button
                className={`exchange-btn ${item.isOwned ? 'owned' : canAfford ? 'ready' : 'disabled'}`}
                onClick={() => handleExchange(item)}
              >
                {item.isOwned ? '已拥有' : '兑换'}
              </Button>
            </View>
          )
        })}
      </ScrollView>

      {/* 皮肤预览弹窗 */}
      {showPreview && (
        <View className='skin-preview-overlay' onClick={() => setShowPreview(false)}>
          <View className='skin-preview-card' onClick={(e) => e.stopPropagation()}>
            <View className='skin-preview-close' onClick={() => setShowPreview(false)}>
              <Text>✕</Text>
            </View>
            <Text className='skin-preview-title'>凤求凰 皮肤预览</Text>

            {/* Tab 切换 */}
            <View className='skin-preview-tabs'>
              {(['idle', 'thinking', 'dragging'] as PreviewTab[]).map(tab => (
                <View
                  key={tab}
                  className={`skin-preview-tab ${previewTab === tab ? 'active' : ''}`}
                  onClick={() => setPreviewTab(tab)}
                >
                  <Text>{tab === 'idle' ? '待机' : tab === 'thinking' ? '思考' : '拖拽'}</Text>
                </View>
              ))}
            </View>

            {/* GIF 展示区 */}
            <View className='skin-preview-stage'>
              {previewUrls[previewTab] ? (
                <Image className='skin-preview-gif' src={previewUrls[previewTab]} mode='aspectFit' />
              ) : (
                <Text className='skin-preview-loading'>加载中...</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

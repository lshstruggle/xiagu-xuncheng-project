// pages/backpack/index.tsx
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { REWARD_VISUAL } from '../../config/rewards'
import { getTempFileURL } from '../../utils/cloud-storage'
import './index.scss'

/** 券项 */
interface CouponItem {
  id: string
  type: string
  subType?: string
  name: string
  merchant: string
  discount?: string
  content?: string
  condition?: string
  validDays?: number
  obtainedAt: string
  expireAt: string
  used: boolean
  code: string
  typeEmoji?: string
  typeLabel?: string
  typeShort?: string
  bgColor?: string
  iconImage?: string
}

type TabType = 'coupon' | 'exchange'

const TAB_LABELS: Record<TabType, string> = {
  coupon: '优惠券',
  exchange: '兑换券',
}

export default function Backpack() {
  const [activeTab, setActiveTab] = useState<TabType>('coupon')
  const [list, setList] = useState<CouponItem[]>([])
  const [counts, setCounts] = useState({ coupon: 0, exchange: 0 })
  const [showDetail, setShowDetail] = useState(false)
  const [detailItem, setDetailItem] = useState<CouponItem | null>(null)

  /** 将cloud://路径转换为临时URL */
  const resolveCloudImage = async (cloudPath?: string): Promise<string> => {
    if (!cloudPath) return ''
    // 如果不是cloud://路径，直接返回
    if (!cloudPath.startsWith('cloud://')) {
      return cloudPath
    }
    // 提取文件路径部分
    const match = cloudPath.match(/cloud:\/\/[^/]+\/(.*)/)
    if (!match) return ''
    try {
      const tempUrl = await getTempFileURL(match[1])
      return tempUrl || ''
    } catch (e) {
      console.error('转换图片URL失败:', e)
      return ''
    }
  }

  /** 加载数据 */
  const load = useCallback(async () => {
    // 从本地存储加载券数据
    const rewards: CouponItem[] = Taro.getStorageSync('my_rewards') || []
    
    console.log('加载券数据:', rewards.length, '个券')

    // 分类计数
    setCounts({
      coupon: rewards.filter((r: CouponItem) => r.type === 'coupon' && !r.used).length,
      exchange: rewards.filter((r: CouponItem) => r.type === 'exchange' && !r.used).length,
    })

    await filterList(activeTab, rewards)
  }, [activeTab])

  /** 过滤列表 */
  const filterList = useCallback(async (tab: TabType, rewards: CouponItem[]) => {
    console.log(`过滤 ${tab} 类型的券`)
    const filteredRewards = rewards
      .filter((r: CouponItem) => r.type === tab)
      .sort((a, b) => (a.used ? 1 : 0) - (b.used ? 1 : 0))

    // 并行处理所有券的图片转换
    const processed = await Promise.all(
      filteredRewards.map(async (r: CouponItem) => {
        // 判断子类型选择合适的视觉配置
        let visKey = r.type
        if (r.type === 'coupon' && r.subType === 'hotel') visKey = 'coupon_hotel'
        if (r.type === 'exchange' && r.subType === 'esports') visKey = 'exchange_esports'
        if (r.type === 'exchange' && r.subType === 'blue') visKey = 'exchange_blue'
        // 没有 subType 的 exchange 保持默认 'exchange'（红buff兑换券）

        const vis = REWARD_VISUAL[visKey] || REWARD_VISUAL[r.type] || REWARD_VISUAL.coupon

        // 从配置中获取券图URL并转换为临时URL
        let iconImage = ''
        try {
          const imageUrl = vis.iconImage || r.iconImage
          if (imageUrl) {
            iconImage = await resolveCloudImage(imageUrl)
          }
        } catch (e) {
          console.error('获取券图失败:', e)
        }

        return {
          ...r,
          typeEmoji: vis.emoji,
          typeLabel: vis.label,
          typeShort: '券',
          bgColor: vis.bgColor,
          iconImage,
        }
      })
    )

    console.log('处理后的列表:', processed.length, '个券')
    setList(processed)
  }, [activeTab])

  /** 切换Tab */
  const switchTab = useCallback(async (tab: TabType) => {
    setActiveTab(tab)
    const rewards: CouponItem[] = Taro.getStorageSync('my_rewards') || []
    await filterList(tab, rewards)
  }, [filterList])

  /** 打开券详情 */
  const openDetail = useCallback(async (item: CouponItem) => {
    setDetailItem(item)
    setShowDetail(true)
  }, [])

  /** 关闭详情 */
  const closeDetail = useCallback(() => {
    setShowDetail(false)
  }, [])

  /** 使用券 */
  const useCoupon = useCallback(() => {
    if (!detailItem || detailItem.used) return

    Taro.showModal({
      title: '确认使用',
      content: `确定要使用"${detailItem.name}"吗？使用后无法撤回。`,
      success: (res) => {
        if (res.confirm) {
          const rewards: CouponItem[] = Taro.getStorageSync('my_rewards') || []
          const target = rewards.find((r: CouponItem) => r.id === detailItem.id)
          if (target) {
            target.used = true
            Taro.setStorageSync('my_rewards', rewards)
          }

          setDetailItem({ ...detailItem, used: true })
          setShowDetail(false)
          Taro.showToast({ title: '使用成功', icon: 'success' })
          load()
        }
      }
    })
  }, [detailItem, load])

  /** 返回 */
  const goBack = useCallback(() => {
    Taro.navigateBack()
  }, [])

  useDidShow(() => {
    load()
  })

  return (
    <View className='bp-page'>
      {/* 顶栏 */}
      <View className='bp-header'>
        <View className='bp-back' onClick={goBack}>←</View>
        <Text className='bp-title'>🎒 背包</Text>
        <View className='bp-ph' />
      </View>

      {/* Tab栏 */}
      <View className='bp-tabs'>
        <View
          className={`bp-tab ${activeTab === 'coupon' ? 'active' : ''}`}
          onClick={() => switchTab('coupon')}
        >
          优惠券
          {counts.coupon > 0 && <Text className='tab-badge'>{counts.coupon}</Text>}
        </View>
        <View
          className={`bp-tab ${activeTab === 'exchange' ? 'active' : ''}`}
          onClick={() => switchTab('exchange')}
        >
          兑换券
          {counts.exchange > 0 && <Text className='tab-badge'>{counts.exchange}</Text>}
        </View>
      </View>

      {/* 券列表 */}
      <ScrollView className='bp-scroll' scrollY>
        {list.length === 0 ? (
          <View className='bp-empty'>
            <Text className='empty-icon'>📭</Text>
            <Text className='empty-text'>暂无{TAB_LABELS[activeTab]}，去探索获取吧！</Text>
          </View>
        ) : (
          list.map((item, index) => (
            <View
              key={item.id || `item-${index}`}
              className={`ticket-card ${item.used ? 'used' : ''} ticket-type-${item.type}${item.subType ? '-' + item.subType : ''}`}
              data-type={`${item.type}${item.subType ? '-' + item.subType : ''}`}
              onClick={() => openDetail(item)}
            >
              {/* {console.log(`券${index}:`, item.name, 'iconImage:', !!item.iconImage)} */}
              {/* 券背景图：改为正常文档流元素 */}
              {item.iconImage ? (
                <>
                  {console.log('渲染图片:', item.iconImage.substring(0, 50))}
                  <View
                    className='ticket-bg-view'
                    style={{
                      backgroundImage: `url(${item.iconImage})`,
                      backgroundSize: '110% 120%',
                      backgroundPosition: 'center center',
                    }}
                  />
                </>
              ) : (
                <View className='ticket-placeholder' style={{ background: item.bgColor }}>
                  <Text className='tp-emoji'>{item.typeEmoji}</Text>
                  <Text className='tp-label'>{item.typeLabel}</Text>
                </View>
              )}
              
              {/* 文字信息叠加层（absolute定位覆盖在图片上） */}
              <View className='ticket-info'>
                <Text className='ticket-name'>{item.name}</Text>
                <Text className='ticket-merchant'>{item.merchant}</Text>
                <Text className='ticket-expire'>
                  {item.used ? '已使用' : `有效期至：${item.expireAt}`}
                </Text>
              </View>

              {/* 已使用水印 */}
              {item.used && (
                <View className='ticket-stamp'>
                  <Text className='stamp-txt'>已使用</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* 券详情弹窗 */}
      {showDetail && detailItem && (
        <>
          <View className='dt-mask on' onClick={closeDetail} />
          <View className='dt-panel on'>
            <View className='dt-head' style={{ background: detailItem.bgColor }}>
              {detailItem.iconImage ? (
                <Image className='dt-icon-img' src={detailItem.iconImage} mode='aspectFit' />
              ) : (
                <Text className='dt-emoji'>{detailItem.typeEmoji}</Text>
              )}
              <Text className='dt-type'>{detailItem.typeLabel}</Text>
              <View className='dt-close' onClick={closeDetail}>✕</View>
            </View>

            <View className='dt-body'>
              <Text className='dt-name'>{detailItem.name}</Text>
              <Text className='dt-merchant'>{detailItem.merchant}</Text>

              <View className='dt-row'>
                <Text className='dt-label'>优惠内容</Text>
                <Text className='dt-val'>{detailItem.discount || detailItem.content}</Text>
              </View>
              {detailItem.condition && (
                <View className='dt-row'>
                  <Text className='dt-label'>使用条件</Text>
                  <Text className='dt-val'>{detailItem.condition}</Text>
                </View>
              )}
              <View className='dt-row'>
                <Text className='dt-label'>获得日期</Text>
                <Text className='dt-val'>{detailItem.obtainedAt}</Text>
              </View>
              <View className='dt-row'>
                <Text className='dt-label'>有效期至</Text>
                <Text className='dt-val'>{detailItem.expireAt}</Text>
              </View>

              {/* 核销码 */}
              {!detailItem.used && (
                <View className='dt-code-box'>
                  <Text className='dt-code-tip'>核销码</Text>
                  <Text className='dt-code'>{detailItem.code}</Text>
                  <View className='dt-barcode'>
                    {Array.from({ length: 30 }).map((_, i) => (
                      <View
                        key={i}
                        className='bar'
                        style={{
                          width: i % 3 === 0 ? '4rpx' : '2rpx',
                          height: `${55 + (i % 5) * 8}rpx`,
                          background: i % 7 === 0 ? '#555' : '#ccc',
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}

              <View
                className={`dt-btn ${detailItem.used ? 'off' : ''}`}
                onClick={detailItem.used ? undefined : useCoupon}
              >
                {detailItem.used ? '已使用' : '出示给商家'}
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  )
}

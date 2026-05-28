import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import BookmarkCard from '../../components/bookmark-card'
import { ALL_EASTER_EGGS, HIDDEN_BOOKMARK } from '../../config/bond-traces-chengdu'
import FutureBg from '../../components/future-bg'
import './index.scss'

interface CollectedData {
  fragmentId: string
  collectDate: string
  traceId: string
}

interface BadgeData {
  badgeId: string
  name: string
  desc?: string
  image?: string
  obtainedAt?: string
  isNew?: boolean
}

// 全部勋章定义
const ALL_BADGES_DEF = [
  { badgeId: 'badge_kuanzhai', name: '宽窄守护者', desc: '打卡宽窄巷子获得', source: '宽窄巷子' },
  { badgeId: 'badge_caotang',  name: '诗圣传人',   desc: '打卡杜甫草堂获得', source: '杜甫草堂' },
  { badgeId: 'badge_wuhou',    name: '三顾茅庐',   desc: '打卡武侯祠获得',   source: '武侯祠' },
  { badgeId: 'badge_jinsha',   name: '古蜀探秘者', desc: '打卡金沙遗址获得', source: '金沙遗址博物馆' },
  { badgeId: 'badge_esports',  name: '电竞朝圣者', desc: '打卡电竞场馆获得', source: '量子光电竞中心' },
  { badgeId: 'badge_ag',       name: '银龙追随者', desc: '打卡AG电竞中心获得', source: 'AG电竞中心' },
]

export default function CollectionGallery() {
  // Tab状态
  const [activeTab, setActiveTab] = useState<'bookmark' | 'badge'>('bookmark')

  // 书签数据
  const [collectedIds, setCollectedIds] = useState<string[]>([])
  const [collectedData, setCollectedData] = useState<Record<string, CollectedData>>({})
  const [hiddenUnlocked, setHiddenUnlocked] = useState(false)

  // 勋章数据
  const [myBadges, setMyBadges] = useState<BadgeData[]>([])
  const [allBadges, setAllBadges] = useState<any[]>([])

  // 详情弹窗
  const [showDetail, setShowDetail] = useState(false)
  const [detailType, setDetailType] = useState<'bookmark' | 'badge'>('bookmark')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // 新勋章解锁动效
  const [unlockingBadge, setUnlockingBadge] = useState<any>(null)

  useEffect(() => {
    const params = getCurrentInstance().router?.params
    if (params?.tab === 'badge' || params?.tab === 'bookmark') {
      setActiveTab(params.tab as 'bookmark' | 'badge')
    }
    loadData()
  }, [])

  const loadData = () => {
    try {
      // 书签数据
      const stored = Taro.getStorageSync('collected_fragments') || '[]'
      const fragments: string[] = JSON.parse(stored)
      setCollectedIds(fragments)

      const storedData = Taro.getStorageSync('collected_fragments_data') || '{}'
      const data: Record<string, CollectedData> = JSON.parse(storedData)
      setCollectedData(data)

      const hidden = Taro.getStorageSync('hidden_bookmark_unlocked') || false
      setHiddenUnlocked(hidden)

      // 勋章数据
      const badgesRaw = Taro.getStorageSync('my_badges')
      const badges: BadgeData[] = badgesRaw ? (typeof badgesRaw === 'string' ? JSON.parse(badgesRaw) : badgesRaw) : []
      setMyBadges(badges)

      // 合并勋章定义和已获得状态
      const merged = ALL_BADGES_DEF.map(def => {
        const found = badges.find(b => b.badgeId === def.badgeId)
        return {
          ...def,
          obtained: !!found,
          image: found?.image || '',
          obtainedAt: found?.obtainedAt || '',
          isNew: found?.isNew || false,
        }
      })
      setAllBadges(merged)
    } catch (e) {
      console.error('加载数据失败', e)
    }
  }

  // 书签进度
  const bookmarkTotal = ALL_EASTER_EGGS.length
  const bookmarkCount = collectedIds.filter(id =>
    ALL_EASTER_EGGS.some(t => t.fragmentId === id)
  ).length
  const bookmarkPct = Math.round((bookmarkCount / bookmarkTotal) * 100)

  // 勋章进度
  const badgeTotal = ALL_BADGES_DEF.length
  const badgeCount = myBadges.length
  const badgePct = Math.round((badgeCount / badgeTotal) * 100)

  // 点击书签
  const handleBookmarkTap = (trace: any) => {
    const isCollected = collectedIds.includes(trace.fragmentId)
    if (isCollected) {
      setSelectedItem(trace)
      setDetailType('bookmark')
      setShowDetail(true)
    } else {
      Taro.showToast({
        title: `前往${trace.bondData.locationContext.split('，')[0]}附近解锁`,
        icon: 'none',
        duration: 2000
      })
    }
  }

  // 点击隐藏书签
  const handleHiddenTap = () => {
    if (hiddenUnlocked) {
      setSelectedItem(HIDDEN_BOOKMARK)
      setDetailType('bookmark')
      setShowDetail(true)
    } else {
      Taro.showToast({
        title: `集齐${bookmarkTotal}张羁绊书签后解锁`,
        icon: 'none'
      })
    }
  }

  // 点击勋章
  const handleBadgeTap = (badge: any) => {
    if (badge.obtained) {
      // 如果是新勋章，先播放解锁动效
      if (badge.isNew) {
        setUnlockingBadge(badge)
        // 清除isNew标记
        const badges = Taro.getStorageSync('my_badges') || []
        const target = badges.find((b: any) => b.badgeId === badge.badgeId)
        if (target) {
          target.isNew = false
          Taro.setStorageSync('my_badges', badges)
        }
        // 更新本地状态
        setAllBadges(prev => prev.map(b => b.badgeId === badge.badgeId ? { ...b, isNew: false } : b))

        // 3秒后切换到详情
        setTimeout(() => {
          setUnlockingBadge(null)
          setSelectedItem({ ...badge, isNew: false })
          setDetailType('badge')
          setShowDetail(true)
        }, 3000)
      } else {
        setSelectedItem(badge)
        setDetailType('badge')
        setShowDetail(true)
      }
    } else {
      Taro.showToast({
        title: `打卡${badge.source}可获得`,
        icon: 'none',
        duration: 2000
      })
    }
  }

  // 关闭详情
  const closeDetail = () => {
    setShowDetail(false)
    setSelectedItem(null)
  }

  // 分享
  const shareItem = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }

  return (
    <View className='collection-page'>
      <FutureBg />

      {/* 顶部标题 */}
      <View className='col-header'>
        <Text className='col-title'>收藏</Text>
        <Text className='col-subtitle'>你的探索印记与峡谷记忆</Text>
      </View>

      {/* Tab切换 */}
      <View className='col-tabs'>
        <View
          className={`col-tab ${activeTab === 'bookmark' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmark')}
        >
          <Text className='tab-icon'>📖</Text>
          <Text className='tab-text'>羁绊书签</Text>
        </View>
        <View
          className={`col-tab ${activeTab === 'badge' ? 'active' : ''}`}
          onClick={() => setActiveTab('badge')}
        >
          <Text className='tab-icon'>🎖️</Text>
          <Text className='tab-text'>成就勋章</Text>
        </View>
      </View>

      {/* ========== 书签Tab ========== */}
      {activeTab === 'bookmark' && (
        <View className='tab-content'>
          {/* 书签进度条 */}
          <View className='progress-section'>
            <View className='progress-row'>
              <Text className='progress-label'>📖 书签收集</Text>
              <Text className='progress-num'>{bookmarkCount}/{bookmarkTotal}</Text>
            </View>
            <View className='progress-bar'>
              <View className='progress-fill bookmark-fill' style={{ width: `${bookmarkPct}%` }} />
            </View>
          </View>

          {/* 书签网格 */}
          <ScrollView className='content-scroll' scrollY>
            <View className='grid-container'>
              {ALL_EASTER_EGGS.map((trace, index) => {
                const isCollected = collectedIds.includes(trace.fragmentId)
                const data = collectedData[trace.fragmentId]
                return (
                  <View
                    key={trace.id}
                    className='grid-item'
                    onClick={() => handleBookmarkTap(trace)}
                  >
                    <BookmarkCard
                      data={trace.bookmarkData}
                      rarity={trace.rarity}
                      rarityLabel={trace.rarityLabel}
                      rarityColor={trace.rarityColor}
                      collected={isCollected}
                      showDetail={false}
                      hintText={trace.hintText}
                      collectDate={data?.collectDate}
                    />
                    <View className='item-number'>No.{index + 1}</View>
                  </View>
                )
              })}

              {/* 隐藏书签 */}
              <View className='grid-item hidden-item' onClick={handleHiddenTap}>
                <BookmarkCard
                  data={HIDDEN_BOOKMARK.bookmarkData}
                  rarity='limited'
                  rarityLabel={HIDDEN_BOOKMARK.rarityLabel}
                  rarityColor={HIDDEN_BOOKMARK.rarityColor}
                  collected={hiddenUnlocked}
                  showDetail={false}
                  hintText={HIDDEN_BOOKMARK.unlockCondition}
                />
                <View className='item-number special'>★限定</View>
              </View>
            </View>

            <View className='tab-footer'>
              <Text className='footer-hint'>靠近标记位置可触发羁绊记忆</Text>
              <Text className='footer-hint'>每段记忆都是这座城市的电竞故事</Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ========== 勋章Tab ========== */}
      {activeTab === 'badge' && (
        <View className='tab-content'>
          {/* 勋章进度条 */}
          <View className='progress-section'>
            <View className='progress-row'>
              <Text className='progress-label'>🎖️ 勋章收集</Text>
              <Text className='progress-num'>{badgeCount}/{badgeTotal}</Text>
            </View>
            <View className='progress-bar'>
              <View className='progress-fill badge-fill' style={{ width: `${badgePct}%` }} />
            </View>
          </View>

          {/* 勋章网格 */}
          <ScrollView className='content-scroll' scrollY>
            <View className='badge-grid'>
              {allBadges.map((badge) => (
                <View
                  key={badge.badgeId}
                  className={`badge-cell ${badge.obtained ? '' : 'locked'}`}
                  onClick={() => handleBadgeTap(badge)}
                >
                  {/* 圆形勋章图标 */}
                  <View className='badge-circle-wrap'>
                    <View className={`badge-circle ${badge.obtained ? 'obtained' : ''}`}>
                      {badge.obtained && badge.image ? (
                        <Image className='badge-img' src={badge.image} mode='aspectFit' />
                      ) : badge.obtained ? (
                        <Text className='badge-emoji'>🎖️</Text>
                      ) : (
                        <Text className='badge-lock'>🔒</Text>
                      )}
                    </View>
                    {/* 已获得光效 */}
                    {badge.obtained && <View className='badge-glow' />}
                    {/* NEW角标 */}
                    {badge.isNew && (
                      <View className='badge-new-tag'>
                        <Text className='new-text'>NEW</Text>
                      </View>
                    )}
                  </View>

                  {/* 名称 */}
                  <Text className='badge-name'>{badge.obtained ? badge.name : '???'}</Text>

                  {/* 来源提示 */}
                  <Text className='badge-source'>
                    {badge.obtained ? badge.obtainedAt : badge.source}
                  </Text>
                </View>
              ))}
            </View>

            <View className='tab-footer'>
              <Text className='footer-hint'>打卡对应地标可获得成就勋章</Text>
              <Text className='footer-hint'>集齐全部勋章解锁隐藏成就</Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ========== 勋章解锁全屏动效 ========== */}
      {unlockingBadge && (
        <View className='unlock-overlay'>
          <View className='unlock-bg'></View>

          <View className='unlock-content'>
            {/* 粒子 */}
            <View className='unlock-particles active'>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} className='uk-p' style={{ '--i': i } as any}></View>
              ))}
            </View>

            {/* 勋章 */}
            <View className='unlock-badge-area'>
              <View className='unlock-badge show'>
                <View className='unlock-circle'>
                  {unlockingBadge.image ? (
                    <Image className='unlock-img' src={unlockingBadge.image} mode='aspectFit' />
                  ) : (
                    <Text className='unlock-emoji'>🎖️</Text>
                  )}
                </View>
                <View className='unlock-ring-1'></View>
                <View className='unlock-ring-2'></View>
                <View className='unlock-ring-3'></View>
              </View>
            </View>

            {/* 文字 */}
            <View className='unlock-info'>
              <Text className='unlock-label'>🏆 成就解锁</Text>
              <Text className='unlock-name'>{unlockingBadge.name}</Text>
              <Text className='unlock-desc'>{unlockingBadge.desc}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ========== 详情弹窗 ========== */}
      {showDetail && selectedItem && (
        <View className='detail-modal' onClick={closeDetail}>
          <View className='detail-content' onClick={(e) => e.stopPropagation()}>
            <View className='detail-close' onClick={closeDetail}>✕</View>

            {/* 书签详情 */}
            {detailType === 'bookmark' && (
              <>
                <BookmarkCard
                  data={selectedItem.bookmarkData}
                  rarity={selectedItem.rarity || 'limited'}
                  rarityLabel={selectedItem.rarityLabel}
                  rarityColor={selectedItem.rarityColor}
                  collected={true}
                  showDetail={true}
                  animated={true}
                />
                {selectedItem.bondData && (
                  <View className='detail-story'>
                    <Text className='story-title'>📖 记忆故事</Text>
                    <Text className='story-content'>{selectedItem.bondData.story}</Text>
                    {selectedItem.bondData.playerQuote && (
                      <View className='story-quote'>
                        <Text className='quote-mark'>&ldquo;</Text>
                        <Text className='quote-text'>{selectedItem.bondData.playerQuote}</Text>
                        <Text className='quote-mark'>&rdquo;</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}

            {/* 勋章详情 */}
            {detailType === 'badge' && (
              <View className='badge-detail'>
                <View className='bd-icon-area'>
                  <View className='bd-circle'>
                    {selectedItem.image ? (
                      <Image className='bd-img' src={selectedItem.image} mode='aspectFit' />
                    ) : (
                      <Text className='bd-emoji'>🎖️</Text>
                    )}
                  </View>
                  <View className='bd-glow-ring' />
                </View>

                <Text className='bd-name'>{selectedItem.name}</Text>
                <Text className='bd-desc'>{selectedItem.desc}</Text>

                <View className='bd-info-list'>
                  <View className='bd-info-row'>
                    <Text className='bd-info-label'>获得方式</Text>
                    <Text className='bd-info-value'>打卡{selectedItem.source}</Text>
                  </View>
                  <View className='bd-info-row'>
                    <Text className='bd-info-label'>获得日期</Text>
                    <Text className='bd-info-value'>{selectedItem.obtainedAt || '-'}</Text>
                  </View>
                  <View className='bd-info-row'>
                    <Text className='bd-info-label'>稀有度</Text>
                    <Text className='bd-info-value bd-rarity'>
                      {selectedItem.badgeId === 'badge_jinsha' || selectedItem.badgeId === 'badge_ag'
                        ? '⭐ 珍贵' : '普通'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 操作按钮 */}
            <View className='detail-actions'>
              <View className='action-btn' onClick={closeDetail}>
                <Text className='btn-icon'>📥</Text>
                <Text className='btn-text'>收起</Text>
              </View>
              <View className='action-btn primary' onClick={shareItem}>
                <Text className='btn-icon'>📤</Text>
                <Text className='btn-text'>分享</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

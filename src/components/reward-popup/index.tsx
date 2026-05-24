// components/reward-popup/index.tsx
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useCallback, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { POI_REWARDS, REWARD_VISUAL, RewardItem } from '../../config/rewards'
import { POI_SCORE } from '../../config/explore-score'
import { getTempFileURL } from '../../utils/cloud-storage'
import './index.scss'

/** 阶段类型 */
type StageType = 'idle' | 'buff' | 'burst' | 'broadcast' | 'badge-unlock' | 'reveal' | 'simple' | 'done'

/** 勋章动效阶段 */
type BadgePhase = '' | 'flash' | 'locked' | 'breaking' | 'medal' | 'info'

/** POI信息 */
interface POIInfo {
  id: number
  name: string
  type: string
}

// 地图图标云存储 File ID（本地定义避免与导入冲突）
const localMapIconFileIDs: Record<string, string> = {
  redBuff: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/红buff.png',
  blueBuff: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/蓝buff.png',
  tower: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/防御塔.png',
  spiritLighthouse: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/泉水 (1).png',
  arena: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/比赛场馆 (1).png',
}

/** Buff类型视觉配置（使用云存储图标） */
const BUFF_VISUAL: Record<string, { image: string; color: string; glow: string; word: string }> = {
  red_buff: { image: localMapIconFileIDs.redBuff, color: '#FF4444', glow: 'rgba(255,68,68,0.5)', word: '红Buff' },
  blue_buff: { image: localMapIconFileIDs.blueBuff, color: '#4488FF', glow: 'rgba(68,136,255,0.5)', word: '蓝Buff' },
  tower: { image: localMapIconFileIDs.tower, color: '#FFCC00', glow: 'rgba(255,204,0,0.5)', word: '防御塔' },
  spirit_lighthouse: { image: localMapIconFileIDs.spiritLighthouse, color: '#00E5FF', glow: 'rgba(0,229,255,0.5)', word: '泉水' },
  arena: { image: localMapIconFileIDs.arena, color: '#FF6600', glow: 'rgba(255,102,0,0.5)', word: '赛场' },
}

/** 券类型视觉 */
const COUPON_VIS: Record<string, { emoji: string; short: string; tagColor: string; bg: string }> = {
  coupon: { emoji: '🎫', short: '惠', tagColor: '#FF6B6B', bg: 'linear-gradient(135deg,#5a1515,#3a0a0a)' },
  exchange: { emoji: '🎁', short: '兑', tagColor: '#4FC3F7', bg: 'linear-gradient(135deg,#151550,#0a0a30)' },
  experience: { emoji: '✨', short: '验', tagColor: '#66BB6A', bg: 'linear-gradient(135deg,#153a15,#0a200a)' },
  badge: { emoji: '🎖️', short: '章', tagColor: '#FFD54F', bg: 'linear-gradient(135deg,#2a2210,#1a1508)' },
}

/** 奖励项扩展 */
interface DisplayReward extends RewardItem {
  typeEmoji: string
  typeShort: string
  tagColor: string
  bgGradient: string
  shortDesc: string
  iconImage?: string
}

/** 勋章奖励数据 */
interface BadgeReward {
  type: 'badge'
  name: string
  badgeId: string
  desc?: string
  image?: string
  typeEmoji: string
  typeShort: string
  tagColor: string
  bgGradient: string
}

export interface RewardPopupRef {
  trigger: (poi: POIInfo) => void
}

const RewardPopup = forwardRef<RewardPopupRef>((_, ref) => {
  // ===== 状态 =====
  const [stage, setStage] = useState<StageType>('idle')
  const [buPhase, setBuPhase] = useState<BadgePhase>('')
  const [poiName, setPoiName] = useState('')
  const [scoreGain, setScoreGain] = useState(0)
  const [hasRewards, setHasRewards] = useState(false)
  const [ticketRewards, setTicketRewards] = useState<DisplayReward[]>([])
  const [hasBadgeReward, setHasBadgeReward] = useState(false)
  const [badgeRewardData, setBadgeRewardData] = useState<BadgeReward | null>(null)

  // Buff视觉
  const [buffImage, setBuffImage] = useState('')
  const [buffColor, setBuffColor] = useState('#FF4444')
  const [buffGlow, setBuffGlow] = useState('rgba(255,68,68,0.5)')
  const [buffWord, setBuffWord] = useState('红Buff')

  // 播报条
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastSub, setBroadcastSub] = useState('')
  const [broadcastOut, setBroadcastOut] = useState(false)

  // 定时器引用
  const timersRef = useRef<number[]>([])
  
  // 使用ref存储奖励数据，避免闭包问题
  const ticketRewardsRef = useRef<DisplayReward[]>([])
  const badgeRewardDataRef = useRef<BadgeReward | null>(null)
  const scoreGainRef = useRef(0)
  const poiNameRef = useRef('')

  // ===== 工具函数 =====

  /** 将cloud://路径转换为临时URL */
  const resolveCloudImage = async (cloudPath?: string): Promise<string> => {
    if (!cloudPath || !cloudPath.startsWith('cloud://')) {
      return cloudPath || ''
    }
    const match = cloudPath.match(/cloud:\/\/[^/]+\/(.*)/)
    if (!match) return cloudPath
    const tempUrl = await getTempFileURL(match[1])
    return tempUrl || cloudPath
  }

  /** 延迟执行 */
  const delay = useCallback((ms: number, fn: () => void) => {
    const timer = setTimeout(fn, ms)
    timersRef.current.push(timer as unknown as number)
  }, [])

  /** 清理定时器 */
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }, [])

  // ===== 存储函数 =====

  /** 保存奖励 */
  const saveRewards = useCallback(() => {
    // 使用ref获取最新数据，避免闭包问题
    const rewards = ticketRewardsRef.current
    console.log('[RewardPopup] 开始保存奖励, ticketRewards数量:', rewards.length)
    
    const existing: any[] = Taro.getStorageSync('my_rewards') || []
    console.log('[RewardPopup] 现有奖励数量:', existing.length)
    
    const now = new Date()
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

    // 保存券类奖励
    rewards.forEach(r => {
      console.log('[RewardPopup] 保存券:', r.name)
      existing.push({
        ...r,
        id: `${r.type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        obtainedAt: dateStr,
        expireAt: calcExpire(r.validDays || 7),
        used: false,
        code: genCode(),
      })
    })
    
    Taro.setStorageSync('my_rewards', existing)
    console.log('[RewardPopup] 奖励已保存, 总数量:', existing.length)

    // 保存勋章奖励
    const badge = badgeRewardDataRef.current
    if (badge) {
      const badges: any[] = Taro.getStorageSync('my_badges') || []
      if (!badges.find((b: any) => b.badgeId === badge.badgeId)) {
        badges.push({
          badgeId: badge.badgeId,
          name: badge.name,
          desc: badge.desc,
          image: badge.image,
          obtainedAt: dateStr,
          isNew: true,
        })
        Taro.setStorageSync('my_badges', badges)
      }
    }
  }, [])

  /** 增加探索度 */
  const saveScore = useCallback(() => {
    const gain = scoreGainRef.current
    const current = Taro.getStorageSync('explore_score_base') || 0
    Taro.setStorageSync('explore_score_base', current + gain)
  }, [])

  /** 计算过期日期 */
  const calcExpire = (days: number): string => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  /** 生成核销码 */
  const genCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-'
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // ===== 流程控制 =====

  /** 触发奖励弹窗 */
  const trigger = useCallback(async (poi: POIInfo) => {
    if (!poi || stage !== 'idle') return

    clearTimers()

    const gain = POI_SCORE[poi.type] || 1
    const config = POI_REWARDS[poi.id]
    const buff = BUFF_VISUAL[poi.type] || BUFF_VISUAL.red_buff

    // 分离勋章和券奖励
    let allRewards: DisplayReward[] = []
    let tickets: DisplayReward[] = []
    let badge: BadgeReward | null = null

    if (config && config.rewards && config.rewards.length > 0) {
      allRewards = await Promise.all(
        config.rewards.map(async (r) => {
          const vis = COUPON_VIS[r.type] || COUPON_VIS.coupon
          const iconImage = await resolveCloudImage(r.image)
          return {
            ...r,
            typeEmoji: vis.emoji,
            typeShort: vis.short,
            tagColor: vis.tagColor,
            bgGradient: vis.bg,
            shortDesc: r.discount || r.content || r.desc || '',
            iconImage,
          }
        })
      )

      // 分离勋章和券
      const badgeItem = allRewards.find(r => r.type === 'badge')
      if (badgeItem) {
        badge = {
          type: 'badge',
          name: badgeItem.name,
          badgeId: badgeItem.badgeId || '',
          desc: badgeItem.desc,
          image: badgeItem.iconImage,
          typeEmoji: badgeItem.typeEmoji,
          typeShort: badgeItem.typeShort,
          tagColor: badgeItem.tagColor,
          bgGradient: badgeItem.bgGradient,
        }
      }
      tickets = allRewards.filter(r => r.type !== 'badge')
    }

    const actualHasRewards = tickets.length > 0 || !!badge

    // 同步更新ref，避免闭包问题
    ticketRewardsRef.current = tickets
    badgeRewardDataRef.current = badge
    scoreGainRef.current = gain
    poiNameRef.current = poi.name

    setPoiName(poi.name)
    setScoreGain(gain)
    setHasRewards(actualHasRewards)
    setTicketRewards(tickets)
    setHasBadgeReward(!!badge)
    setBadgeRewardData(badge)
    setBuPhase('')
    setBuffImage(buff.image)
    setBuffColor(buff.color)
    setBuffGlow(buff.glow)
    setBuffWord(buff.word)
    setBroadcastTitle('')
    setBroadcastSub('')
    setBroadcastOut(false)
    setStage('buff')

    // 震动
    Taro.vibrateShort({ type: 'heavy' })

    if (actualHasRewards) {
      runRewardFlow(poi, buff, gain, !!badge, tickets.length > 0)
    } else {
      runSimpleFlow(poi, buff, gain)
    }
  }, [stage, clearTimers])

  /** 有奖励流程 */
  const runRewardFlow = (poi: POIInfo, buff: any, gain: number, hasBadge: boolean, hasTickets: boolean) => {
    // 0.8s后：Buff碎裂
    delay(800, () => {
      Taro.vibrateLong()
      setStage('burst')
    })

    // 1.5s后：播报条滑入
    delay(1500, () => {
      setBroadcastTitle(`获得${buff.word}！`)
      setBroadcastSub(poi.name)
      setStage('broadcast')
    })

    // 2.5s后：播报条滑出
    delay(2500, () => {
      setBroadcastOut(true)
    })

    // 2.8s后：分支处理
    delay(2800, () => {
      if (hasBadge) {
        // 有勋章，先走勋章动效
        setStage('badge-unlock')
        runBadgeSequence()
      } else {
        // 无勋章，直接展示券
        setStage('reveal')
      }
    })
  }

  /** ★ 勋章专属动效时序 ★ */
  const runBadgeSequence = () => {
    // 闪白
    setBuPhase('flash')
    Taro.vibrateShort({ type: 'heavy' })

    // 锁链勋章出现
    delay(400, () => {
      setBuPhase('locked')
    })

    // 锁链断裂
    delay(1400, () => {
      setBuPhase('breaking')
      Taro.vibrateLong()
    })

    // 勋章浮现
    delay(2100, () => {
      setBuPhase('medal')
      Taro.vibrateShort({ type: 'medium' })
    })

    // 文字+按钮
    delay(3200, () => {
      setBuPhase('info')
    })
  }

  /** 勋章动效结束后继续 */
  const onBadgeContinue = () => {
    if (ticketRewards.length > 0) {
      // 有券，进入券展示
      setStage('reveal')
    } else {
      // 无券，直接结束
      finishAndSave()
    }
  }

  /** 无奖励简洁流程 */
  const runSimpleFlow = (poi: POIInfo, buff: any, gain: number) => {
    // 0.8s后：播报条
    delay(800, () => {
      setBroadcastTitle('探索印记 +1')
      setBroadcastSub(poi.name)
      setStage('broadcast')
    })

    // 1.5s后：简洁提示
    delay(1500, () => {
      setBroadcastOut(true)
      setStage('simple')
    })

    // 3.5s后：自动关闭
    delay(3500, () => {
      scoreGainRef.current = gain
      saveScore()
      setStage('idle')
      Taro.eventCenter.trigger('reward_confirmed', {
        rewards: [],
        scoreGain: gain,
        poiName: poi.name,
        hasRewards: false,
      })
    })
  }

  /** 完成并保存 */
  const finishAndSave = useCallback(() => {
    console.log('[RewardPopup] finishAndSave被调用')
    saveRewards()
    saveScore()
    clearTimers()
    setStage('idle')
    setBuPhase('')
    Taro.vibrateShort({ type: 'medium' })
    Taro.eventCenter.trigger('reward_confirmed', {
      ticketRewards: ticketRewardsRef.current,
      badgeReward: badgeRewardDataRef.current,
      scoreGain: scoreGainRef.current,
      poiName: poiNameRef.current,
      hasRewards: true,
    })
  }, [saveRewards, saveScore, clearTimers])

  /** 确认收入背包 */
  const onConfirm = useCallback(() => {
    console.log('[RewardPopup] 点击收入背包按钮')
    finishAndSave()
  }, [finishAndSave])

  /** 遮罩点击 */
  const onMaskTap = useCallback(() => {
    // 有奖励时点遮罩不关闭（必须点收入背包）
    // 无奖励时点遮罩可关闭
    if (!hasRewards && stage !== 'idle') {
      scoreGainRef.current = scoreGain
      saveScore()
      clearTimers()
      setStage('idle')
      setBuPhase('')
      Taro.eventCenter.trigger('reward_confirmed', {
        rewards: [],
        scoreGain,
        poiName,
        hasRewards: false,
      })
    }
  }, [hasRewards, stage, scoreGain, poiName, clearTimers])

  // 暴露方法
  useImperativeHandle(ref, () => ({ trigger }))

  // 清理定时器
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  // ===== 渲染 =====
  if (stage === 'idle') return null

  return (
    <View className='reward-popup'>
      {/* 遮罩 */}
      <View className={`rp-mask ${stage !== 'idle' ? 'on' : ''}`} onClick={onMaskTap} />

      {/* ===== Buff弹出阶段 ===== */}
      {(stage === 'buff' || stage === 'burst') && (
        <View className={`rp-buff-stage ${stage === 'buff' || stage === 'burst' ? 'on' : ''}`}>
          {/* 冲击波环 */}
          <View className={`buff-shockwave ${stage === 'buff' ? 'active' : ''}`} />

          {/* Buff图标 */}
          <View
            className={`buff-icon-wrap ${!hasRewards ? 'simple' : ''} ${stage === 'burst' ? 'exploding' : 'entering'}`}
          >
            <View
              className='buff-icon'
              style={{
                background: `radial-gradient(circle, ${buffColor} 0%, rgba(0,0,0,0.8) 100%)`,
                boxShadow: `0 0 40rpx ${buffGlow}, 0 0 80rpx ${buffGlow}, inset 0 0 20rpx rgba(255,255,255,0.1)`,
              }}
            >
              <Image className='buff-image' src={buffImage} mode='aspectFit' />
            </View>
          </View>

          {/* 碎裂粒子（仅合作商户） */}
          {hasRewards && (
            <View className={`burst-particles ${stage === 'burst' ? 'active' : ''}`}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  className='bp'
                  style={{
                    background: buffColor,
                    boxShadow: `0 0 8rpx ${buffColor}`,
                    '--i': i,
                  } as any}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ===== 播报条 ===== */}
      {(stage === 'broadcast' || stage === 'badge-unlock' || stage === 'reveal') && (
        <View className={`rp-broadcast ${stage === 'broadcast' || stage === 'badge-unlock' || stage === 'reveal' ? 'on' : ''}`}>
          <View
            className={`broadcast-bar ${broadcastOut ? 'out' : 'in'}`}
            style={{
              borderTopColor: buffColor,
              borderBottomColor: buffColor,
              boxShadow: `0 0 20rpx ${buffGlow}`,
            }}
          >
            <View className='bar-left'>
              <Image className='bar-image' src={buffImage} mode='aspectFit' />
            </View>
            <View className='bar-content'>
              <Text className='bar-title'>{broadcastTitle}</Text>
              <Text className='bar-sub'>{broadcastSub}</Text>
            </View>
            <View className='bar-score'>
              <Text className='bar-plus' style={{ color: buffColor, textShadow: `0 0 12rpx ${buffGlow}` }}>
                +{scoreGain}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ===== ★ 勋章专属全屏动效 ★ ===== */}
      {stage === 'badge-unlock' && badgeRewardData && (
        <View className={`badge-unlock-full ${stage === 'badge-unlock' ? 'on' : ''}`}>
          {/* 闪白 */}
          <View className={`bu-flash ${buPhase === 'flash' ? 'active' : ''}`} />

          {/* 暗金背景 */}
          <View className='bu-bg' />

          {/* 锁链勋章轮廓 */}
          <View className={`bu-locked ${buPhase === 'locked' || buPhase === 'breaking' ? 'show' : ''}`}>
            <View className='bu-chain-circle'>
              <Text className='bu-chain-icon'>🔒</Text>
            </View>
            {/* 锁链线条 */}
            <View className='bu-chain c1' />
            <View className='bu-chain c2' />
            <View className='bu-chain c3' />
            <View className='bu-chain c4' />
          </View>

          {/* 锁链碎裂 */}
          <View className={`bu-break-particles ${buPhase === 'breaking' ? 'active' : ''}`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} className='bk-p' style={{ '--i': i } as any} />
            ))}
          </View>

          {/* 勋章浮现 */}
          <View className={`bu-medal-area ${buPhase === 'medal' || buPhase === 'info' ? 'show' : ''}`}>
            <View className='bu-medal'>
              <View className='bu-medal-circle'>
                {badgeRewardData.image ? (
                  <Image className='bu-medal-img' src={badgeRewardData.image} mode='aspectFit' />
                ) : (
                  <Text className='bu-medal-emoji'>🎖️</Text>
                )}
              </View>
              {/* 金光脉冲 */}
              <View className='bu-pulse-1' />
              <View className='bu-pulse-2' />
              <View className='bu-pulse-3' />
            </View>
            {/* 环绕粒子 */}
            <View className='bu-orbit-particles'>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} className='bu-op' style={{ '--i': i, '--total': 8 } as any} />
              ))}
            </View>
          </View>

          {/* 文字信息 */}
          <View className={`bu-info ${buPhase === 'info' ? 'show' : ''}`}>
            <Text className='bu-info-label'>🏆 成就解锁</Text>
            <Text className='bu-info-name'>{badgeRewardData.name}</Text>
            <Text className='bu-info-desc'>{badgeRewardData.desc}</Text>
          </View>

          {/* 继续按钮 */}
          <View className={`bu-continue ${buPhase === 'info' ? 'show' : ''}`} onClick={onBadgeContinue}>
            <Text className='bu-continue-text'>
              {ticketRewards.length > 0 ? '查看更多奖励 →' : '⭐ 纳入收藏'}
            </Text>
          </View>
        </View>
      )}

      {/* ===== 券面展示（勋章动效结束后/无勋章时直接展示） ===== */}
      {stage === 'reveal' && ticketRewards.length > 0 && (
        <View className={`rp-reveal ${stage === 'reveal' ? 'on' : ''}`}>
          <View className='reveal-panel'>
            <Text className='reveal-title'>
              {hasBadgeReward ? '🎉 同时获得' : '🎉 获得奖励'}
            </Text>

            {/* 券面图标列表 */}
            <View className='reveal-items'>
              {ticketRewards.map((item, index) => (
                <View key={index} className='reveal-item' style={{ animationDelay: `${index * 0.2 + 0.3}s` }}>
                  {/* 圆形图标 */}
                  <View className='ri-icon-wrap'>
                    <View className='ri-icon' style={{ background: item.bgGradient }}>
                      {item.iconImage ? (
                        <Image className='ri-icon-img' src={item.iconImage} mode='aspectFit' />
                      ) : (
                        <Text className='ri-emoji'>{item.typeEmoji}</Text>
                      )}
                    </View>
                    {/* 类型角标 */}
                    <View className='ri-type-badge' style={{ background: item.tagColor }}>
                      <Text className='ri-type-text'>{item.typeShort}</Text>
                    </View>
                  </View>

                  {/* 名称 */}
                  <Text className='ri-name'>{item.name}</Text>
                  <Text className='ri-desc'>{item.shortDesc}</Text>
                </View>
              ))}
            </View>

            {/* 收入背包按钮 */}
            <View className='reveal-btn' onClick={onConfirm}>
              <Text className='btn-icon'>🎒</Text>
              <Text className='btn-text'>全部收入背包</Text>
            </View>
          </View>
        </View>
      )}

      {/* ===== 无奖励时的简洁提示（非合作商户） ===== */}
      {stage === 'simple' && (
        <View className={`rp-simple ${stage === 'simple' ? 'on' : ''}`}>
          <View className='simple-card'>
            <Text className='simple-icon'>📍</Text>
            <Text className='simple-text'>打卡成功</Text>
            <Text className='simple-poi'>{poiName}</Text>
            <View className='simple-score'>
              <Text className='ss-label'>探索度</Text>
              <Text className='ss-value' style={{ color: buffColor }}>
                +{scoreGain}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
})

export default RewardPopup

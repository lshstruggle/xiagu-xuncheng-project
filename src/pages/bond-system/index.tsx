import { View, Text, Image, ScrollView, Button, Input } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import { api } from '../../services/api'
import { getTempFileURL } from '../../utils/temp-url-cache'

const GIF_CLICKED = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/pet/clicked.gif'

// --- 【预留空位区：填入素材 URL 后即可生效】 ---
const ASSETS: Record<string, { audio: string; gif: string; merchImg: string }> = {
  libai: {
    audio: '',
    gif: GIF_CLICKED,
    merchImg: ''
  },
  zhuge: {
    audio: '',
    gif: GIF_CLICKED,
    merchImg: ''
  }
}
// 兜底：使用已有的彩蛋语音做演示
const DEMO_AUDIO_MAP: Record<string, string> = {
  libai: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/bond_cd_01.wav',
  zhuge: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/bond_cd_02.wav'
}
// ---------------------------------------------------

interface HeroBond {
  id: string
  name: string
  avatar: string
  bondValue: number
  level: number
}

interface HowToGainItem {
  icon: string
  title: string
  desc: string
  value: string
}

const HOW_TO_GAIN: HowToGainItem[] = [
  { icon: '📍', title: '每日打卡', desc: '在景点完成打卡', value: '+10' },
  { icon: '💬', title: 'AI 对话', desc: '与英雄伙伴聊天互动', value: '+5' },
  { icon: '🥚', title: '探索彩蛋', desc: '发现隐藏彩蛋故事', value: '+15' },
  { icon: '🗺️', title: '完成路线', desc: '走完一条完整探索路线', value: '+20' }
]

// 羁绊里程碑节点配置（Lv.1~10）
interface MilestoneNode {
  level: number
  icon: string
  title: string
  descTemplate: string
  type: 'reward' | 'milestone'
  rewardType?: 'voice' | 'gif' | 'merch'
}

const getMilestoneNodes = (heroName: string): MilestoneNode[] => [
  { level: 1, icon: '🌱', title: '羁绊初识', descTemplate: `与 ${heroName} 的羁绊之旅刚刚开始，一起去探索更多城市吧`, type: 'milestone' },
  { level: 2, icon: '🎵', title: '限定台词解锁', descTemplate: `达到 Lv.2 可聆听 ${heroName} 的专属语音`, type: 'reward', rewardType: 'voice' },
  { level: 3, icon: '💫', title: '羁绊深入', descTemplate: `${heroName} 开始对你敞开心扉，羁绊值稳步提升中`, type: 'milestone' },
  { level: 4, icon: '🔥', title: '羁绊共鸣', descTemplate: `你们之间的默契逐渐加深，${heroName} 似乎有话想对你说`, type: 'milestone' },
  { level: 5, icon: '✨', title: '专属桌宠动作', descTemplate: `达到 Lv.5 解锁 ${heroName} 的全新 GIF 互动`, type: 'reward', rewardType: 'gif' },
  { level: 6, icon: '🌟', title: '羁绊升温', descTemplate: `${heroName} 愿意与你分享更多旅途中的故事`, type: 'milestone' },
  { level: 7, icon: '💎', title: '羁绊信赖', descTemplate: `${heroName} 已完全信任你，成为了真正的旅伴`, type: 'milestone' },
  { level: 8, icon: '⚡', title: '羁绊默契', descTemplate: '你们配合得天衣无缝，每一次探索都充满惊喜', type: 'milestone' },
  { level: 9, icon: '🏆', title: '羁绊誓约', descTemplate: '即将抵达羁绊的巅峰，终极奖励就在眼前', type: 'milestone' },
  { level: 10, icon: '🎁', title: '限定实体周边', descTemplate: `达到 Lv.10 免费领取 ${heroName} 官方定制徽章/立牌`, type: 'reward', rewardType: 'merch' },
]

export default function BondSystem() {
  const [heroes, setHeroes] = useState<HeroBond[]>([])
  const [activeHeroId, setActiveHeroId] = useState<string>('libai')
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [animatedBond, setAnimatedBond] = useState(0)
  const [isUpgrading, setIsUpgrading] = useState(false)

  // 实体周边表单状态
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // 弹窗状态
  const [showHowToGain, setShowHowToGain] = useState(false)
  const [showGifPreview, setShowGifPreview] = useState(false)
  const [gifUrl, setGifUrl] = useState('')

  // 音频实例引用
  const audioRef = useRef<any>(null)

  useEffect(() => {
    loadHeroBonds()
  }, [])

  const loadHeroBonds = async () => {
    try {
      Taro.showLoading({ title: '加载中' })
      const data = await api.getHeroBonds()
      const mapped: HeroBond[] = data.map(h => ({
        id: h.id,
        name: h.name,
        avatar: h.avatar,
        bondValue: h.bond_value,
        level: h.bond_level
      }))
      setHeroes(mapped)
      Taro.hideLoading()
    } catch (err) {
      Taro.hideLoading()
      console.error('获取羁绊数据失败', err)
      // 降级：使用本地 Mock 数据保证页面不白屏
      const fallback: HeroBond[] = [
        { id: 'libai', name: '李白', avatar: 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/131/131.jpg', bondValue: 950, level: 5 },
        { id: 'zhuge', name: '诸葛亮', avatar: 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/190/190.jpg', bondValue: 50, level: 1 }
      ]
      setHeroes(fallback)
    }
  }

  const activeHero = heroes.find(h => h.id === activeHeroId) || heroes[0]

  // 每 200 羁绊升 1 级，满级 10 级
  const maxBondForCurrentLevel = (activeHero?.level || 1) * 200
  const targetProgress = activeHero
    ? Math.min((activeHero.bondValue / maxBondForCurrentLevel) * 100, 100)
    : 0

  // 进度条数字动画
  useEffect(() => {
    if (!activeHero) return
    const duration = 800
    const startBond = animatedBond
    const endBond = activeHero.bondValue
    const startTime = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      // easeOutQuart
      const ease = 1 - Math.pow(1 - t, 4)
      const current = Math.round(startBond + (endBond - startBond) * ease)
      setAnimatedBond(current)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    // 进度条宽度动画（延迟触发以产生先后感）
    setAnimatedProgress(0)
    const timer = setTimeout(() => setAnimatedProgress(targetProgress), 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHeroId, activeHero?.bondValue])

  // 切换英雄时触发升级闪光（如果刚升级）
  useEffect(() => {
    if (!activeHero) return
    setIsUpgrading(true)
    const timer = setTimeout(() => setIsUpgrading(false), 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHero?.level])

  // 播放音频逻辑
  const handlePlayAudio = () => {
    let audioUrl = ASSETS[activeHero.id]?.audio
    if (!audioUrl) {
      audioUrl = DEMO_AUDIO_MAP[activeHero.id] || ''
    }
    if (!audioUrl) {
      Taro.showToast({ title: '音频敬请期待', icon: 'none' })
      return
    }

    // 清理旧实例
    if (audioRef.current) {
      audioRef.current.stop()
      audioRef.current.destroy()
    }

    const ctx = Taro.createInnerAudioContext()
    audioRef.current = ctx
    ctx.src = audioUrl
    ctx.play()
    Taro.showToast({ title: `正在播放 ${activeHero.name} 的限定台词...`, icon: 'none' })

    ctx.onEnded(() => {
      ctx.destroy()
      audioRef.current = null
    })
    ctx.onError(() => {
      Taro.showToast({ title: '音频播放失败', icon: 'none' })
      ctx.destroy()
      audioRef.current = null
    })
  }

  // 预览 GIF 逻辑
  const handlePreviewGif = async () => {
    let rawUrl = ASSETS[activeHero.id]?.gif
    if (!rawUrl) {
      Taro.showToast({ title: '动效敬请期待', icon: 'none' })
      return
    }
    // 云路径转临时 URL
    if (rawUrl.startsWith('cloud://')) {
      const temp = await getTempFileURL(rawUrl)
      if (temp) rawUrl = temp
    }
    setGifUrl(rawUrl)
    setShowGifPreview(true)
  }

  // 表单校验
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = '请输入至少2个字符的姓名'
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.phone = '请输入有效的11位手机号'
    }
    if (!formData.address || formData.address.trim().length < 6) {
      errors.address = '请输入至少6个字符的详细地址'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 提交周边收件信息
  const handleSubmitForm = async () => {
    if (!validateForm()) return

    Taro.showLoading({ title: '提交中' })
    try {
      await api.submitMerchOrder({
        hero_id: activeHero.id,
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      })

      Taro.hideLoading()
      setShowAddressForm(false)
      setFormData({ name: '', phone: '', address: '' })
      setFormErrors({})
      Taro.showToast({ title: '领取成功！周边将在7个工作日内寄出', icon: 'success', duration: 2000 })
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    }
  }

  // 关闭弹窗时清理
  const closeAddressForm = () => {
    setShowAddressForm(false)
    setFormErrors({})
  }

  if (!activeHero) return null

  return (
    <View className='bond-container'>
      {/* 1. 顶部英雄切换器 */}
      <ScrollView className='hero-selector' scrollX>
        {heroes.map(hero => (
          <View
            key={hero.id}
            className={`hero-avatar-wrap ${activeHeroId === hero.id ? 'active' : ''}`}
            onClick={() => setActiveHeroId(hero.id)}
          >
            <Image className='hero-avatar' src={hero.avatar} mode='aspectFill' />
            <Text className='hero-name'>{hero.name}</Text>
            {activeHeroId === hero.id && <View className='active-indicator'></View>}
          </View>
        ))}
      </ScrollView>

      {/* 2. 羁绊进度看板 */}
      <View className={`bond-dashboard ${isUpgrading ? 'upgrading' : ''}`}>
        <View className='dashboard-header'>
          <View className='level-badge'>
            <Text className='level-text'>Lv.{activeHero.level}</Text>
          </View>
          <Text className='bond-value'>
            <Text className='bond-value-current'>{animatedBond}</Text>
            <Text className='bond-value-max'> / {maxBondForCurrentLevel}</Text>
          </Text>
        </View>
        <View className='progress-bar-bg'>
          <View
            className='progress-bar-fill'
            style={{ width: `${animatedProgress}%` }}
          >
            <View className='progress-glow'></View>
          </View>
        </View>
        {activeHero.level >= 10 && (
          <View className='max-level-tag'>已达最高羁绊等级</View>
        )}
      </View>

      {/* 3. 奖励时间轴 */}
      <ScrollView className='timeline-container' scrollY>
        {/* 连接线背景 */}
        <View className='timeline-track'>
          <View
            className='timeline-track-fill'
            style={{ height: `${Math.min((activeHero.level / 10) * 100, 100)}%` }}
          ></View>
        </View>

        {/* 里程碑节点（Lv.1~10） */}
        {getMilestoneNodes(activeHero.name).map(node => {
          const isUnlocked = activeHero.level >= node.level
          const isMilestone = node.type === 'milestone'

          return (
            <View
              key={node.level}
              className={`timeline-node ${isUnlocked ? 'unlocked' : 'locked'} ${isMilestone ? 'milestone' : ''}`}
            >
              {!isMilestone && (
                <View className='node-badge'>
                  <Text className='node-icon'>{node.icon}</Text>
                </View>
              )}
              <View className='node-content'>
                <View className='node-header'>
                  <Text className='node-title'>
                    {node.title}
                    <Text className='node-level-tag'> Lv.{node.level}</Text>
                  </Text>
                  {isUnlocked && <Text className='node-status'>已解锁</Text>}
                </View>
                <Text className='node-desc'>{node.descTemplate}</Text>

                {/* 奖励节点按钮 */}
                {isUnlocked && node.rewardType === 'voice' && (
                  <Button className='action-btn' onClick={handlePlayAudio}>🎵 点击试听</Button>
                )}
                {isUnlocked && node.rewardType === 'gif' && (
                  <Button className='action-btn' onClick={handlePreviewGif}>✨ 预览动效</Button>
                )}
                {isUnlocked && node.rewardType === 'merch' && (
                  <>
                    {ASSETS[activeHero.id]?.merchImg ? (
                      <Image className='merch-preview' src={ASSETS[activeHero.id].merchImg} mode='aspectFit' />
                    ) : (
                      <View className='merch-preview-placeholder'>
                        <Text>🎁</Text>
                      </View>
                    )}
                    <Button className='action-btn highlight' onClick={() => setShowAddressForm(true)}>
                      🎁 立即领取
                    </Button>
                  </>
                )}
              </View>
            </View>
          )
        })}
      </ScrollView>

      {/* 底部悬浮：如何提升羁绊 */}
      <View className='floating-hint' onClick={() => setShowHowToGain(true)}>
        <Text className='floating-hint-icon'>💡</Text>
        <Text className='floating-hint-text'>如何提升羁绊？</Text>
      </View>

      {/* 4. 实体周边收货地址表单 (Modal) */}
      {showAddressForm && (
        <View className='modal-overlay' onClick={closeAddressForm}>
          <View className='modal-content address-form' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>🎁 填写收货信息</Text>
            <Text className='modal-subtitle'>领取 {activeHero.name} 限定实体周边</Text>

            <View className='form-group'>
              <Text className='form-label'>收件人姓名</Text>
              <Input
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                value={formData.name}
                onInput={(e) => {
                  setFormData({ ...formData, name: e.detail.value })
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                }}
                placeholder='请输入真实姓名'
              />
              {formErrors.name && <Text className='form-error'>{formErrors.name}</Text>}
            </View>
            <View className='form-group'>
              <Text className='form-label'>联系电话</Text>
              <Input
                className={`form-input ${formErrors.phone ? 'error' : ''}`}
                type='number'
                value={formData.phone}
                onInput={(e) => {
                  setFormData({ ...formData, phone: e.detail.value })
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' })
                }}
                placeholder='请输入手机号'
                maxlength={11}
              />
              {formErrors.phone && <Text className='form-error'>{formErrors.phone}</Text>}
            </View>
            <View className='form-group'>
              <Text className='form-label'>详细地址</Text>
              <Input
                className={`form-input ${formErrors.address ? 'error' : ''}`}
                value={formData.address}
                onInput={(e) => {
                  setFormData({ ...formData, address: e.detail.value })
                  if (formErrors.address) setFormErrors({ ...formErrors, address: '' })
                }}
                placeholder='省市区及详细门牌号'
              />
              {formErrors.address && <Text className='form-error'>{formErrors.address}</Text>}
            </View>

            <View className='modal-actions'>
              <Button className='modal-btn cancel' onClick={closeAddressForm}>取消</Button>
              <Button className='modal-btn submit' onClick={handleSubmitForm}>确认提交</Button>
            </View>
          </View>
        </View>
      )}

      {/* 5. 羁绊获取途径弹窗 */}
      {showHowToGain && (
        <View className='modal-overlay' onClick={() => setShowHowToGain(false)}>
          <View className='modal-content how-to-gain' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>💡 如何提升羁绊？</Text>
            <View className='gain-list'>
              {HOW_TO_GAIN.map((item, idx) => (
                <View className='gain-item' key={idx} style={{ animationDelay: `${idx * 100}ms` }}>
                  <Text className='gain-icon'>{item.icon}</Text>
                  <View className='gain-info'>
                    <Text className='gain-title'>{item.title}</Text>
                    <Text className='gain-desc'>{item.desc}</Text>
                  </View>
                  <Text className='gain-value'>{item.value}</Text>
                </View>
              ))}
            </View>
            <Button className='modal-btn submit full' onClick={() => setShowHowToGain(false)}>
              知道了
            </Button>
          </View>
        </View>
      )}

      {/* 6. GIF 预览弹窗 */}
      {showGifPreview && (
        <View className='modal-overlay' onClick={() => setShowGifPreview(false)}>
          <View className='gif-preview-card' onClick={(e) => e.stopPropagation()}>
            <View className='gif-preview-close' onClick={() => setShowGifPreview(false)}>
              <Text>✕</Text>
            </View>
            <Text className='gif-preview-title'>{activeHero.name} 专属动作</Text>
            <Image className='gif-preview-img' src={gifUrl} mode='aspectFit' />
          </View>
        </View>
      )}
    </View>
  )
}

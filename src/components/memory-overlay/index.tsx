import { View, Text, ScrollView, Image, CoverView } from '@tarojs/components'
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import Taro from '@tarojs/taro'
import LongPressBtn from '../long-press-btn'
import BookmarkCard from '../bookmark-card'
import { ALL_EASTER_EGGS, HIDDEN_BOOKMARK, BOND_TRACES_CHENGDU } from '../../config/bond-traces-chengdu'
import { playMemoryTTS, stopAudio } from '../../services/tts-player'
import { api } from '../../services/api'
import './index.scss'

interface MemoryOverlayProps {
  heroId?: string
  heroName?: string
  heroAvatar?: string
  collectedIds?: string[]
  onCollected?: (data: {
    traceId: string
    fragmentId: string
    rarity: string
    badgeId: string | null
    newCollectedIds: string[]
  }) => void
  onHiddenUnlocked?: (data: { bookmarkId: string }) => void
  onClosed?: () => void
}

export interface MemoryOverlayRef {
  trigger: (traceData: any) => void
}

function MemoryOverlayComponent({
  heroId = 'li_bai',
  heroName = '李白',
  heroAvatar = '',
  collectedIds = [],
  onCollected,
  onHiddenUnlocked,
  onClosed
}: MemoryOverlayProps, ref: React.Ref<MemoryOverlayRef>) {
  const [active, setActive] = useState(false)
  const [stage, setStage] = useState<'discover' | 'dialog' | 'collect' | 'bookmark' | 'hidden'>('discover')
  const [currentTrace, setCurrentTrace] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [collectedCount, setCollectedCount] = useState(collectedIds.length)
  const totalCount = ALL_EASTER_EGGS.length

  // 阶段一：发现
  const [particles, setParticles] = useState<any[]>([])

  // 阶段三：对话
  const [displayText, setDisplayText] = useState('')
  const [fullText, setFullText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [dialogComplete, setDialogComplete] = useState(false)
  const [showQuote, setShowQuote] = useState(false)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [showEggReply, setShowEggReply] = useState(false)
  const [eggReplyText, setEggReplyText] = useState('')
  const [scrollTop, setScrollTop] = useState(0)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

  // 滚动到底部辅助函数 - 交替变化值确保触发
  const scrollToBottom = () => {
    setScrollTop(prev => prev >= 99999 ? 99998 : 99999)
  }

  // 阶段四：碎片
  const [fragmentEntered, setFragmentEntered] = useState(false)
  const [orbitParticles, setOrbitParticles] = useState<any[]>([])

  // 隐藏书签
  const [mergeStarted, setMergeStarted] = useState(false)
  const [burstActive, setBurstActive] = useState(false)
  const [hiddenContentShow, setHiddenContentShow] = useState(false)

  const typeTimer = useRef<NodeJS.Timeout | null>(null)
  const typeIndex = useRef(0)
  const pendingHidden = useRef(false)
  const enterDialogTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    generateEdgeParticles()
    generateOrbitParticles()
    return () => {
      clearTypeTimer()
      if (autoScrollRef.current) {
        clearTimeout(autoScrollRef.current)
      }
      if (enterDialogTimer.current) {
        clearTimeout(enterDialogTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    setCollectedCount(collectedIds.length)
  }, [collectedIds])

  // 金句显示后滚动到底部
  useEffect(() => {
    if (showQuote) {
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [showQuote])

  // 暴露trigger方法给父组件
  useImperativeHandle(ref, () => ({
    trigger
  }))

  // ============ 外部调用入口 ============
  const trigger = (traceData: any) => {
    if (!traceData || active) return

    const index = ALL_EASTER_EGGS.findIndex(t => t.id === traceData.id)

    setActive(true)
    setStage('discover')
    setCurrentTrace(traceData)
    setCurrentIndex(index >= 0 ? index : 0)
    setDisplayText('')
    setIsTyping(false)
    setDialogComplete(false)
    setShowQuote(false)
    setShowEasterEgg(false)
    setShowEggReply(false)
    setEggReplyText('')
    setFragmentEntered(false)

    // 震动反馈
    Taro.vibrateShort({ type: 'heavy' })
    setTimeout(() => Taro.vibrateLong(), 100)
    setTimeout(() => Taro.vibrateShort({ type: 'heavy' }), 400)
  }

  // ============ 阶段一：发现 ============
  const generateEdgeParticles = () => {
    const particles = []
    for (let i = 0; i < 15; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2
      })
    }
    setParticles(particles)
  }

  const onDiscoverTap = () => {
    enterDialogStage()
  }

  // ============ 阶段二+三：对话 ============
  const enterDialogStage = () => {
    const trace = currentTrace
    const dialogText = trace?.aiDialogs?.[heroId] || trace?.aiDialogs?.['li_bai'] || ''

    setStage('dialog')
    setFullText(dialogText)
    setDisplayText('')
    setIsTyping(true)
    setDialogComplete(false)
    setShowQuote(false)
    setShowEasterEgg(false)
    setScrollTop(0)
    setScrolledToBottom(false)

    // 播放回忆模式语音 - 使用预生成的云存储语音
    const eggId = trace?.id
    if (eggId && api.isUsingCloudStorage(eggId)) {
      console.log('[Memory] 播放预生成语音:', eggId)
      playMemoryTTS(eggId).catch((err) => {
        console.error('[Memory] 语音播放失败:', err)
      })
    }

    enterDialogTimer.current = setTimeout(() => {
      startTypewriter(dialogText)
    }, 1200)
  }

  // 使用ref来跟踪打字状态，避免闭包问题
  const isTypingRef = useRef(false)

  const startTypewriter = (text: string) => {
    clearTypeTimer()
    typeIndex.current = 0
    setIsTyping(true)
    isTypingRef.current = true

    const pauseChars = ['。', '！', '？', '…', '——', '\n']
    let index = 0

    const typeNext = () => {
      // 检查是否已被跳过（使用ref获取最新状态）
      if (!isTypingRef.current) {
        return
      }

      if (index >= text.length) {
        onTypeComplete()
        return
      }

      index++
      setDisplayText(text.substring(0, index))

      // 每打5个字或最后几个字时滚动到底部
      if (index % 5 === 0 || index >= text.length - 3) {
        scrollToBottom()
      }

      const currentChar = text[index - 1]
      let delay = 200  // 放慢打字速度（原来是70）

      if (pauseChars.includes(currentChar)) {
        delay = currentChar === '\n' ? 400 : 350
      }
      if (currentChar === '…') {
        delay = 500
      }

      typeTimer.current = setTimeout(typeNext, delay)
    }

    typeNext()
  }

  // 监听滚动，判断是否已到底部
  const handleDialogScroll = (e: any) => {
    const { scrollTop: st, scrollHeight } = e.detail
    const viewHeight = 280 // dialog-scroll 的大概可视高度 (50vh ≈ 280rpx)
    const isBottom = st + viewHeight + 30 >= scrollHeight
    setScrolledToBottom(isBottom)
  }

  const onTypeComplete = () => {
    isTypingRef.current = false
    setIsTyping(false)
    setDialogComplete(true)
    setScrolledToBottom(true)

    // 打字完成后再滚动一次确保到底
    setTimeout(() => {
      scrollToBottom()
    }, 100)

    // 延迟显示金句
    setTimeout(() => setShowQuote(true), 500)

    const trace = currentTrace
    if (trace?.spirit_data?.easter_egg) {
      setTimeout(() => setShowEasterEgg(true), 1500)
    }
  }

  const onSkipDialog = () => {
    // 先设置ref和state为false，阻止打字继续进行
    isTypingRef.current = false
    setIsTyping(false)
    clearTypeTimer()
    
    // 强制显示完整文本
    setDisplayText(fullText)
    setDialogComplete(true)
    setScrolledToBottom(true)
    
    // 跳过后立即滚动到底部
    setTimeout(() => {
      scrollToBottom()
    }, 50)
    
    // 延迟显示金句
    setTimeout(() => setShowQuote(true), 300)

    const trace = currentTrace
    if (trace?.spirit_data?.easter_egg) {
      setTimeout(() => setShowEasterEgg(true), 800)
    }
  }

  const onEasterEggChoice = (choice: string) => {
    const easterEgg = currentTrace?.spirit_data?.easter_egg
    const reply = easterEgg?.follow_up_replies?.[choice] || '有趣的选择。'

    setShowEasterEgg(false)
    setShowEggReply(true)
    setEggReplyText(reply)
    
    // 滚动到底部显示彩蛋回复
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }

  const onDialogContinue = () => {
    enterCollectStage()
  }

  const clearTypeTimer = () => {
    if (typeTimer.current) {
      clearTimeout(typeTimer.current)
      typeTimer.current = null
    }
    // 同时清除 enterDialogStage 的延迟定时器
    if (enterDialogTimer.current) {
      clearTimeout(enterDialogTimer.current)
      enterDialogTimer.current = null
    }
  }

  // ============ 阶段四+五：碎片收集 ============
  const enterCollectStage = () => {
    setStage('collect')
    setFragmentEntered(false)

    setTimeout(() => {
      setFragmentEntered(true)
    }, 200)
  }

  const generateOrbitParticles = () => {
    const particles = []
    for (let i = 0; i < 12; i++) {
      particles.push({
        id: i,
        angle: (360 / 12) * i,
        radius: 280 + Math.random() * 40,
        size: 6 + Math.random() * 8,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2
      })
    }
    setOrbitParticles(particles)
  }

  const onCollectProgress = (progress: number) => {
    if (Math.floor(progress) % 20 === 0 && progress > 0) {
      Taro.vibrateShort({ type: 'light' })
    }
  }

  const onCollectComplete = () => {
    Taro.vibrateLong()

    const trace = currentTrace
    const newCollected = [...collectedIds, trace.fragmentId]

    onCollected?.({
      traceId: trace.id,
      fragmentId: trace.fragmentId,
      rarity: trace.rarity,
      badgeId: trace.badgeId || null,
      newCollectedIds: newCollected
    })

    setTimeout(() => {
      enterBookmarkStage(newCollected)
    }, 800)
  }

  // ============ 阶段六：书签解锁 ============
  const enterBookmarkStage = (newCollectedIds: string[]) => {
    setStage('bookmark')

    // 隐藏书签只在集齐前4个基础书签后触发，AG彩蛋（5-7号）不触发
    const baseFragmentIds = BOND_TRACES_CHENGDU.map(t => t.fragmentId)
    const hasAllBase = baseFragmentIds.every(id => newCollectedIds.includes(id))
    if (hasAllBase) {
      pendingHidden.current = true
    }
  }

  const onBookmarkConfirm = () => {
    if (pendingHidden.current) {
      pendingHidden.current = false
      enterHiddenStage()
    } else {
      closeOverlay()
    }
  }

  const onBookmarkShare = () => {
    Taro.showToast({ title: '已保存到相册', icon: 'success' })
  }

  // ============ 隐藏书签解锁 ============
  const enterHiddenStage = () => {
    setStage('hidden')
    setMergeStarted(false)
    setBurstActive(false)
    setHiddenContentShow(false)

    setTimeout(() => setMergeStarted(true), 500)
    setTimeout(() => {
      setBurstActive(true)
      Taro.vibrateLong()
    }, 2000)
    setTimeout(() => setHiddenContentShow(true), 3000)
  }

  const onHiddenConfirm = () => {
    onHiddenUnlocked?.({ bookmarkId: HIDDEN_BOOKMARK.id })
    closeOverlay()
  }

  // ============ 关闭 ============
  const closeOverlay = () => {
    // 停止语音播放
    stopAudio()
    setActive(false)
    setStage('discover')
    clearTypeTimer()
    onClosed?.()
  }

  if (!active) return null

  return (
    <View className={`memory-overlay ${active ? 'active' : ''}`}>
      {/* 阶段一：发现提示 */}
      {stage === 'discover' && (
        <View className='stage-discover'>
          <View className='edge-particles'>
            {particles.map(p => (
              <View
                key={p.id}
                className='particle'
                style={{
                  left: `${p.x}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`
                }}
              />
            ))}
          </View>
          <View className='discover-bar' onClick={onDiscoverTap}>
            <View className='discover-bar-inner'>
              <Text className='discover-icon'>✨</Text>
              <Text className='discover-text'>检测到一段峡谷记忆…</Text>
              <Text className='discover-arrow'>轻触探索 →</Text>
            </View>
          </View>
        </View>
      )}

      {/* 阶段二+三：对话 */}
      {stage === 'dialog' && (
        <View className='stage-dialog'>
          <View className='dialog-mask'></View>
          
          <View className='dialog-panel'>
            <View className='dialog-header'>
              <View className='mode-badge'>
                <Text className='mode-text-h'>回</Text>
                <Text className='mode-text-h'>忆</Text>
                <Text className='mode-text-h'>模</Text>
                <Text className='mode-text-h'>式</Text>
              </View>
              <View className='fragment-counter'>
                碎片 {collectedCount}/{totalCount}
              </View>
            </View>

            <View className='dialog-scroll-wrapper'>
              <ScrollView 
                className='dialog-scroll' 
                scrollY 
                scrollWithAnimation 
                scrollTop={scrollTop}
                onScroll={handleDialogScroll}
              >
                <View className='dialog-content'>
                  <View className='hero-info'>
                    {heroAvatar && <Image className='hero-avatar' src={heroAvatar} mode='aspectFill' />}
                    <Text className='hero-name'>{heroName}</Text>
                  </View>

                  <View className='memory-bubble'>
                    <Text className='memory-text'>{displayText}</Text>
                    {isTyping && <Text className='typing-cursor'>|</Text>}
                  </View>

                  {showQuote && (
                    <View className='quote-block show'>
                      <View className='quote-line'></View>
                      <Text className='quote-text'>"{currentTrace?.bondData?.playerQuote}"</Text>
                      <Text className='quote-source'>—— 灵感来源于电竞赛事公开报道</Text>
                    </View>
                  )}

                  {showEggReply && (
                    <View className='memory-bubble egg-reply show'>
                      <Text className='memory-text'>{eggReplyText}</Text>
                    </View>
                  )}

                  {/* 底部占位锚点，确保能滚到最底 */}
                  <View style={{ height: '20px' }} />
                </View>
              </ScrollView>

              {/* 向下滑动提示箭头 */}
              {!scrolledToBottom && !dialogComplete && (
                <View className='scroll-hint'>
                  <Text className='scroll-arrow'>⌄ 下滑查看更多</Text>
                </View>
              )}
            </View>

            <View className='dialog-footer'>
              {isTyping && (
                <View className='btn-skip' onClick={onSkipDialog}>
                  跳过打字 ▶▶
                </View>
              )}
              {!isTyping && dialogComplete && !showEasterEgg && (
                <View className='btn-continue' onClick={onDialogContinue}>
                  继续 →
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 彩蛋弹窗 - 独立层级，使用CoverView覆盖原生组件 */}
      {showEasterEgg && stage === 'dialog' && currentTrace?.spirit_data?.easter_egg && (
        <>
          {/* CoverView覆盖Map原生组件 */}
          <CoverView
            className='easter-egg-cover-overlay'
            onClick={() => setShowEasterEgg(false)}
          />
          <View className='easter-egg-overlay' onClick={() => setShowEasterEgg(false)}>
            <View className='easter-egg show' onClick={(e) => e.stopPropagation()}>
              <View className='egg-question'>
                <Text>{currentTrace.spirit_data.easter_egg.question}</Text>
              </View>
              <View className='egg-options'>
                {currentTrace.spirit_data.easter_egg.options.map((opt: string) => (
                  <View key={opt} className='egg-option' onClick={() => onEasterEggChoice(opt)}>
                    {opt}
                  </View>
                ))}
              </View>
              <View className='egg-skip-hint'>点击空白处跳过</View>
            </View>
          </View>
        </>
      )}

      {/* 阶段四+五：碎片浮现 + 收集 */}
      {stage === 'collect' && (
        <View className='stage-collect'>
          <View className='collect-mask'></View>
          <View className={`fragment-wrapper ${fragmentEntered ? 'entered' : ''}`}>
            <View className='orbit-ring'>
              {orbitParticles.map(p => (
                <View
                  key={p.id}
                  className='orbit-particle'
                  style={{
                    '--angle': `${p.angle}deg`,
                    '--radius': `${p.radius}rpx`,
                    '--duration': `${p.duration}s`,
                    '--size': `${p.size}rpx`,
                    '--delay': `${p.delay}s`
                  } as any}
                />
              ))}
            </View>
            <View className='fragment-card' style={{ '--glow-color': currentTrace?.rarityColor } as any}>
              <View className='fragment-icon'>📜</View>
              <Text className='fragment-text'>{currentTrace?.fragmentContent}</Text>
              <View className='fragment-divider'></View>
              <Text className='fragment-label'>— 记忆碎片 —</Text>
              <Text className='fragment-number'>No.{currentIndex + 1}/{totalCount}</Text>
            </View>
          </View>
          <View className='collect-btn-area'>
            <LongPressBtn
              duration={1500}
              text='长按收集这段记忆'
              color={currentTrace?.rarityColor}
              onProgress={onCollectProgress}
              onComplete={onCollectComplete}
            />
          </View>
        </View>
      )}

      {/* 阶段六：书签解锁 */}
      {stage === 'bookmark' && (
        <View className='stage-bookmark'>
          <View className='bookmark-mask'></View>
          <View className='bookmark-unlock-title'>
            <Text className='unlock-line'>———</Text>
            <Text className='unlock-text'>✦ 羁绊书签 · 解锁 ✦</Text>
            <Text className='unlock-line'>———</Text>
          </View>
          <View className='bookmark-reveal-area'>
            {currentTrace && (
              <BookmarkCard
                data={currentTrace.bookmarkData}
                rarity={currentTrace.rarity}
                rarityLabel={currentTrace.rarityLabel}
                rarityColor={currentTrace.rarityColor}
                collected={true}
                showDetail={true}
                animated={true}
              />
            )}
          </View>
          <View className='bookmark-actions'>
            <View className='action-btn primary' onClick={onBookmarkConfirm}>
              📥 收入图鉴
            </View>
            <View className='action-btn secondary' onClick={onBookmarkShare}>
              📤 分享给好友
            </View>
          </View>
        </View>
      )}

      {/* 隐藏书签解锁 */}
      {stage === 'hidden' && (
        <View className='stage-hidden'>
          <View className='hidden-mask'></View>
          <View className='hidden-merge'>
            {[0, 1, 2, 3].map(i => (
              <View key={i} className={`merge-card ${mergeStarted ? 'merge' : ''}`} style={{ '--i': i } as any} />
            ))}
          </View>
          <View className={`hidden-burst ${burstActive ? 'active' : ''}`}>
            <View className='burst-ring'></View>
          </View>
          <View className={`hidden-content ${hiddenContentShow ? 'show' : ''}`}>
            <Text className='hidden-achievement'>🏆 成就解锁</Text>
            <Text className='hidden-title'>「成都 · 峡谷编年史」</Text>
            <View className='hidden-bookmark-area'>
              <BookmarkCard
                data={HIDDEN_BOOKMARK.bookmarkData}
                rarity='limited'
                rarityLabel={HIDDEN_BOOKMARK.rarityLabel}
                rarityColor={HIDDEN_BOOKMARK.rarityColor}
                collected={true}
                showDetail={true}
                animated={true}
              />
            </View>
            <View className='hidden-quote'>"每一步都算数。"</View>
            <View className='bookmark-actions'>
              <View className='action-btn primary' onClick={onHiddenConfirm}>
                📥 收入图鉴
              </View>
              <View className='action-btn secondary' onClick={onBookmarkShare}>
                📤 分享到朋友圈
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const MemoryOverlay = forwardRef(MemoryOverlayComponent)
export default MemoryOverlay

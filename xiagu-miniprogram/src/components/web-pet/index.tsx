import { View, Text, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../../services/api'
import { playBase64Audio } from '../../services/tts-player'
import { doLogin, isLoggedIn } from '../../services/auth'
import { petFileIDs, getCachedImageByFileID } from '../../utils/cloud-assets'
import './index.scss'

type PetState = 'idle' | 'thinking' | 'dragging' | 'clicked'

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

const welcomeDialogues = [
  '召唤师，欢迎来到成都，有什么问题尽管问我！',
  '大河之剑天上来！今日成都，有何奇遇？',
  '成都风物，古今交融，想听哪段故事？',
  '今日天气正好，适合出城游览，要我带路吗？',
  '召唤师，前方有彩蛋！靠近看看？',
]

interface WebPetProps {
  heroAvatarUrl?: string
  heroName?: string
  /** 拖拽状态变化回调：开始拖拽时传 true，结束时传 false */
  onDragStateChange?: (isDragging: boolean) => void
}

export default function WebPet({ heroAvatarUrl, heroName = '李白', onDragStateChange }: WebPetProps) {
  const [state, setState] = useState<PetState>('idle')
  const [pos, setPos] = useState({ x: 8, y: 240 })
  const [isReady, setIsReady] = useState(false)

  // 气泡与对话
  const [dialogue, setDialogue] = useState('')
  const [showBubble, setShowBubble] = useState(false)
  const [isChatMode, setIsChatMode] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)

  // 屏幕尺寸 & 桌宠像素尺寸
  const screenRef = useRef({ width: 375, height: 667 })
  const petSizeRef = useRef(80) // 160rpx 对应的 px，初始化时计算

  // 拖拽
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0, isDrag: false, currentX: 0, currentY: 0 })

  // 定时器
  const twTimer = useRef<any>(null)
  const twIndex = useRef(0)
  const idleTimer = useRef<any>(null)
  const drinkTimer = useRef<any>(null)
  const dialogueEndCb = useRef<(() => void) | null>(null)
  const scrollRef = useRef<any>(null)

  // ========== 初始化位置 ==========
  useEffect(() => {
    const sys = Taro.getSystemInfoSync()
    screenRef.current = { width: sys.windowWidth, height: sys.windowHeight }
    petSizeRef.current = Math.round(160 * (sys.windowWidth / 750))
    const safeLeft = sys.safeArea?.left || 0
    const x = Math.max(safeLeft - 10, 0)
    const y = Math.round(sys.windowHeight * 0.35)
    setPos({ x, y })
    dragRef.current.currentX = x
    dragRef.current.currentY = y
    setIsReady(true)

    setIsUserLoggedIn(isLoggedIn())
    preloadPetImages()
  }, [])

  // 预加载桌宠GIF临时链接
  const preloadPetImages = async () => {
    try {
      const fileList = Object.values(petFileIDs).map(fileID => ({ fileID, maxAge: 7200 }))
      const res = await Taro.cloud.getTempFileURL({ fileList })
      if (res.fileList) {
        res.fileList.forEach((item: any) => {
          if (item.tempFileURL && item.fileID) {
            // URL已缓存到云存储SDK内部，无需额外处理
          }
        })
      }
    } catch (e) {
      console.warn('预加载桌宠图片失败', e)
    }
  }

  // 获取当前状态对应的GIF URL
  const getPetSrc = (): string => {
    const fileID = petFileIDs[state]
    if (!fileID) return ''
    const cached = getCachedImageByFileID(fileID)
    if (cached) return cached
    // 同步获取不到则异步获取
    Taro.cloud.getTempFileURL({
      fileList: [{ fileID, maxAge: 7200 }]
    }).then((res: any) => {
      if (res.fileList?.[0]?.tempFileURL) {
        // 触发re-render
        setState(prev => prev)
      }
    }).catch(() => {})
    return ''
  }

  // ========== 打字机效果 ==========
  const startTypewriter = useCallback((text: string, onEnd?: () => void) => {
    if (twTimer.current) clearInterval(twTimer.current)
    twIndex.current = 0
    dialogueEndCb.current = onEnd || null
    setDialogue('')
    setShowBubble(true)

    twTimer.current = setInterval(() => {
      if (twIndex.current < text.length) {
        twIndex.current++
        setDialogue(text.slice(0, twIndex.current))
      } else {
        clearInterval(twTimer.current)
        if (dialogueEndCb.current) {
          dialogueEndCb.current()
          dialogueEndCb.current = null
        }
      }
    }, 50)
  }, [])

  // ========== 自动欢迎语（每20秒） ==========
  useEffect(() => {
    idleTimer.current = setInterval(() => {
      if (state === 'idle' && !showBubble && !isWaiting && !isChatMode) {
        const text = welcomeDialogues[Math.floor(Math.random() * welcomeDialogues.length)]
        startTypewriter(text, () => {
          setTimeout(() => {
            if (!isWaiting && !isChatMode) setShowBubble(false)
          }, 6000)
        })
      }
    }, 20000)
    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current)
    }
  }, [state, showBubble, isWaiting, isChatMode, startTypewriter])

  // ========== 喝酒动画：idle 时每隔 25~40 秒随机切换到 clicked 持续 3 秒 ==========
  useEffect(() => {
    const scheduleDrink = () => {
      const delay = 25000 + Math.random() * 15000 // 25~40s
      drinkTimer.current = setTimeout(() => {
        if (state === 'idle' && !showBubble && !isWaiting && !isChatMode && !dragRef.current.isDrag) {
          setState('clicked')
          setTimeout(() => {
            if (!dragRef.current.isDrag && !showBubble && !isWaiting) {
              setState('idle')
            }
          }, 3000)
        }
        scheduleDrink()
      }, delay)
    }
    scheduleDrink()
    return () => {
      if (drinkTimer.current) clearTimeout(drinkTimer.current)
    }
  }, [state, showBubble, isWaiting, isChatMode])

  // 聊天记录变化自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        const query = Taro.createSelectorQuery()
        query.select('.web-pet-chat-scroll').boundingClientRect()
        query.select('.web-pet-chat-scroll').scrollOffset()
        query.exec((res) => {
          if (res[1]) {
            Taro.createSelectorQuery()
              .select('.web-pet-chat-scroll')
              .node()
              .exec((nodeRes) => {
                // scroll-view的scroll-into-view方式更可靠
              })
          }
        })
      }, 100)
    }
  }, [chatHistory, dialogue, isWaiting])

  // 卸载清理
  useEffect(() => {
    return () => {
      if (twTimer.current) clearInterval(twTimer.current)
      if (idleTimer.current) clearInterval(idleTimer.current)
      if (drinkTimer.current) clearTimeout(drinkTimer.current)
    }
  }, [])

  // ========== 拖拽 ==========
  const handleTouchStart = (e: any) => {
    onDragStateChange?.(true)
    const touch = e.touches[0]
    dragRef.current.startX = touch.clientX
    dragRef.current.startY = touch.clientY
    dragRef.current.initX = dragRef.current.currentX
    dragRef.current.initY = dragRef.current.currentY
    dragRef.current.isDrag = false
  }

  const handleTouchMove = (e: any) => {
    // 与页面中 draggable-mode-switch 保持一致：使用 onTouchMove + e.stopPropagation()
    e.stopPropagation()
    const touch = e.touches[0]
    if (!touch) return

    const dx = touch.clientX - dragRef.current.startX
    const dy = touch.clientY - dragRef.current.startY

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.isDrag = true
      setState('dragging')
    }

    if (dragRef.current.isDrag) {
      const { width, height } = screenRef.current
      const size = petSizeRef.current
      const nextX = Math.max(0, Math.min(width - size, dragRef.current.initX + dx))
      const nextY = Math.max(0, Math.min(height - size, dragRef.current.initY + dy))

      dragRef.current.currentX = nextX
      dragRef.current.currentY = nextY
      setPos({ x: nextX, y: nextY })
    }
  }

  const handleTouchEnd = (e: any) => {
    onDragStateChange?.(false)
    if (dragRef.current.isDrag) {
      dragRef.current.isDrag = false
      setState('idle')
      snapToEdge()
    }
  }

  const handleTouchCancel = () => {
    onDragStateChange?.(false)
    if (dragRef.current.isDrag) {
      dragRef.current.isDrag = false
      setState('idle')
      snapToEdge()
    }
  }

  // 边缘吸附（更贴近边界）
  const snapToEdge = () => {
    const { width } = screenRef.current
    const size = petSizeRef.current
    const centerX = dragRef.current.currentX + size / 2
    const targetX = centerX < width / 2 ? 0 : width - size
    animateTo(targetX, dragRef.current.currentY)
  }

  // 简单动画过渡
  const animateTo = (targetX: number, targetY: number) => {
    const startX = dragRef.current.currentX
    const startY = dragRef.current.currentY
    const duration = 300
    const startTime = Date.now()

    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      const currentX = startX + (targetX - startX) * ease
      const currentY = startY + (targetY - startY) * ease
      dragRef.current.currentX = currentX
      dragRef.current.currentY = currentY
      setPos({ x: currentX, y: currentY })

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }

  // ========== 点击桌宠 ==========
  const handleClick = () => {
    if (dragRef.current.isDrag) return
    setShowBubble(prev => {
      if (!prev) {
        setIsChatMode(false)
        startTypewriter(welcomeDialogues[Math.floor(Math.random() * welcomeDialogues.length)])
      }
      return !prev
    })
    setState('idle')
  }

  // ========== 切换到聊天模式 ==========
  const handleStartChat = () => {
    setIsChatMode(true)
    setDialogue('')
    setInputText('')
  }

  // ========== 关闭气泡 ==========
  const handleClose = () => {
    if (twTimer.current) clearInterval(twTimer.current)
    setShowBubble(false)
    setIsChatMode(false)
    setInputText('')
    setDialogue('')
    setIsWaiting(false)
  }

  // ========== 发送消息 ==========
  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || isWaiting) return

    // 未登录检查
    if (!isUserLoggedIn) {
      Taro.showModal({
        title: '需要登录',
        content: '登录后即可与李白对话',
        confirmText: '立即登录',
        success: (res) => {
          if (res.confirm) {
            doLogin().then(() => {
              setIsUserLoggedIn(isLoggedIn())
            })
          }
        }
      })
      return
    }

    setInputText('')
    setChatHistory(prev => [...prev, { role: 'user', content: text }])
    setIsWaiting(true)
    setState('thinking')
    setDialogue('')

    try {
      const result = await api.chat({
        hero_id: 'libai',
        message: text,
        city_code: 'CD',
        need_tts: true,
      })

      setChatHistory(prev => [...prev, { role: 'ai', content: result.reply }])
      setIsWaiting(false)

      // 异步播放语音
      if (result.audio_ready && result.audio_base64) {
        playBase64Audio(result.audio_base64).catch((e: any) => {
          console.warn('语音播放失败', e)
        })
      }
    } catch (error) {
      console.error('发送消息失败', error)
      setIsWaiting(false)
      setChatHistory(prev => [...prev, {
        role: 'ai',
        content: '哈哈，峡谷信号不太好，容我饮一杯再与你细说！'
      }])
    } finally {
      setTimeout(() => setState('idle'), 8000)
    }
  }

  // 气泡位置判断
  const isLeftSide = dragRef.current.currentX + petSizeRef.current / 2 < screenRef.current.width / 2

  if (!isReady) return null

  return (
    <>
      {/* 预加载图层：隐藏渲染所有GIF，防止切换闪烁 */}
      <View className='web-pet-preload'>
        <Image src={getCachedImageByFileID(petFileIDs.idle) || ''} className='web-pet-preload-img' />
        <Image src={getCachedImageByFileID(petFileIDs.thinking) || ''} className='web-pet-preload-img' />
        <Image src={getCachedImageByFileID(petFileIDs.dragging) || ''} className='web-pet-preload-img' />
        <Image src={getCachedImageByFileID(petFileIDs.clicked) || ''} className='web-pet-preload-img' />
      </View>

      <View
        className='web-pet-container'
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* ===== 欢迎语气泡（纯文字） ===== */}
        {showBubble && !isChatMode && (
          <View className={`web-pet-bubble-welcome ${isLeftSide ? 'right' : 'left'}`}>
            <View className='web-pet-bubble-close' onClick={handleClose}>✕</View>
            <Text className='web-pet-bubble-text'>{dialogue}</Text>
            <View className='web-pet-bubble-start' onClick={handleStartChat}>
              <Text className='web-pet-bubble-start-text'>→ 问我点什么</Text>
            </View>
            <View className={`web-pet-bubble-arrow ${isLeftSide ? 'arrow-right' : 'arrow-left'}`} />
          </View>
        )}

        {/* ===== 聊天模式气泡 ===== */}
        {showBubble && isChatMode && (
          <View className={`web-pet-chat ${isLeftSide ? 'chat-right' : 'chat-left'}`}>
            <View className='web-pet-chat-close' onClick={handleClose}>✕</View>

            {/* 消息列表 */}
            <View className='web-pet-chat-scroll'>
              {chatHistory.map((msg, i) => (
                <View key={i} className={`web-pet-msg ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                  {msg.role === 'ai' && heroAvatarUrl && (
                    <Image className='web-pet-msg-avatar' src={heroAvatarUrl} mode='aspectFill' />
                  )}
                  <View className={`web-pet-msg-bubble ${msg.role}`}>
                    <Text className='web-pet-msg-text'>{msg.content}</Text>
                  </View>
                </View>
              ))}
              {isWaiting && !dialogue && (
                <View className='web-pet-msg msg-ai'>
                  {heroAvatarUrl && <Image className='web-pet-msg-avatar' src={heroAvatarUrl} mode='aspectFill' />}
                  <View className='web-pet-msg-bubble ai'>
                    <Text className='web-pet-msg-text loading'>思考中...</Text>
                  </View>
                </View>
              )}
            </View>

            {/* 输入区 */}
            {isUserLoggedIn ? (
              <View className='web-pet-chat-input-wrap'>
                <Input
                  className='web-pet-chat-input'
                  placeholder='说点什么...'
                  value={inputText}
                  onInput={(e) => setInputText(e.detail.value)}
                  onConfirm={handleSend}
                  confirmType='send'
                />
                <View className='web-pet-chat-send' onClick={handleSend}>
                  <Text className='web-pet-send-icon'>➤</Text>
                </View>
              </View>
            ) : (
              <View className='web-pet-chat-login' onClick={() => {
                doLogin().then(() => setIsUserLoggedIn(isLoggedIn()))
              }}>
                <Text className='web-pet-login-text'>微信登录后与李白对话</Text>
              </View>
            )}

            <View className={`web-pet-chat-arrow ${isLeftSide ? 'arrow-right' : 'arrow-left'}`} />
          </View>
        )}

        {/* ===== 桌宠本体 ===== */}
        <View
          className={`web-pet-body ${state === 'dragging' ? 'wiggling' : ''}`}
          onClick={handleClick}
        >
          <Image
            className='web-pet-gif'
            src={getPetSrc()}
            mode='aspectFit'
            lazyLoad={false}
          />
        </View>
      </View>
    </>
  )
}

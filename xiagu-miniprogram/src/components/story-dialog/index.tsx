/**
 * 峡谷寻城记 - 沉浸式故事对话组件
 * 适配：微信小程序（Taro框架）
 * 支持：半身立绘、地图可见、实景图、低频选择分支
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react'
import Taro from '@tarojs/taro'
import {
  View,
  Text,
  Image,
  ScrollView,
  Video
} from '@tarojs/components'
import './index.scss'
import './styles/transitions.scss'

// 工具函数导入
import { getTempFileURL } from '../../utils/temp-url-cache'

// 子组件导入
import StoryMediaViewer from './components/StoryMediaViewer'
import TTSWaveAnimation from './components/TTSWaveAnimation'
import ParticleBackground from './components/ParticleBackground'

// Hooks导入
import { useGestureControl } from './hooks/useGestureControl'
import { useHapticFeedback } from './hooks/useHapticFeedback'
import { useTransitionAnimation } from './hooks/useTransitionAnimation'

// ============ 类型定义 ============
interface StoryMedia {
  type: 'scene' | 'player' | 'match'  // 实景图/选手照片/比赛画面
  url: string
  caption?: string
  tag?: string  // 如"成都·宽窄巷子" / "AG超玩会·2023赛季"
}

interface StoryChoice {
  id: string
  text: string
  nextNodeId?: string
}

interface StoryNode {
  id: string
  type: 'dialog' | 'choice' | 'checkin' | 'ending' | 'transition'
  chapter?: string
  isKeyNode?: boolean  // 是否是关键节点（影响沉浸深度）
  location?: {
    name: string
    address: string
    lat: number
    lng: number
    radius?: number
  }
  dialog?: {
    speaker: string
    speakerAvatar?: string        // 圆形头像URL
    speakerIllustration?: string  // 半身立绘URL
    content: string
    emotion?: 'normal' | 'happy' | 'sad' | 'excited' | 'thoughtful'
    ttsAudio?: string
    media?: StoryMedia            // 实景图/选手照片
  }
  choices?: StoryChoice[]
  nextNodeId?: string
  checkinReward?: {
    bondPoints: number
    fragments: string[]
    poetryLines: string[]
  }
  ending?: {
    type: 'perfect' | 'good' | 'normal' | 'incomplete'
    title: string
    content: string
    rewards: {
      bondPoints: number
      badge?: string
      fragments?: string[]
    }
  }
}

interface StoryDialogProps {
  node: StoryNode
  totalNodes?: number       // 总节点数，用于进度展示
  currentIndex?: number     // 当前节点序号
  chapterTitle?: string     // 当前章节标题
  nextNode?: StoryNode      // 下一个节点（用于显示下一站提示）
  onNext: () => void
  onChoice: (choiceId: string) => void
  onNavigateToNext?: () => void  // 导航到下一站的回调（路径规划模式）
  useRoutePlanning?: boolean     // 是否使用路径规划功能
  autoPlay?: boolean
  isLastNodeAtLocation?: boolean  // 是否是当前地点的最后一个节点
  onCompleteStory?: () => void  // 故事完成回调（切换到自由模式）
  disableSkip?: boolean     // 是否禁用跳过打字效果，强制逐字输出
  completedChapters?: string[]  // 已完成的章节ID（用于结局海报奖励展示）
}

// ============ 工具函数 ============

// 判断文本长度类型
const getTextLengthType = (text: string): 'short' | 'long' => {
  return text.length > 40 ? 'long' : 'short'
}

// 判断是否使用沉浸模式 - 已禁用背景加深
const shouldUseImmersiveMode = (node: StoryNode): boolean => {
  // 取消沉浸模式背景加深，始终返回 false
  return false
}

// ============ 组件主体 ============
export default function StoryDialog({
  node,
  totalNodes = 1,
  currentIndex = 0,
  chapterTitle,
  nextNode,
    onNext,
    onChoice,
    onNavigateToNext,
  useRoutePlanning = false,
  autoPlay = true,
  isLastNodeAtLocation = false,
  onCompleteStory,
  disableSkip = false,
  completedChapters = []
}: StoryDialogProps) {

  // ---- State ----
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)
  const [showNextLocationHint, setShowNextLocationHint] = useState(false)
  const [typingFinished, setTypingFinished] = useState(false)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)  // 全屏视频播放状态
  const [videoUrl, setVideoUrl] = useState('')  // 视频URL

  // ---- Refs ----
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<Taro.InnerAudioContext | null>(null)
  // 使用 ref 同步记录提示状态，避免异步状态延迟问题
  const nextLocationHintRef = useRef(false)
  // 按钮点击锁定，防止手势事件重复触发
  const buttonClickLockRef = useRef(false)
  // 标记是否是用户跳过剧情
  const userSkippedRef = useRef(false)
  // 使用 ref 同步记录打字状态，避免异步状态延迟问题
  const isTypingRef = useRef(false)
  // 使用 ref 存储当前 node，确保手势控制获取最新状态
  const nodeRef = useRef(node)
  const isLastNodeAtLocationRef = useRef(isLastNodeAtLocation)
  const handleBubbleTapRef = useRef<() => void>()
  // 使用 ref 存储 hint timeout，避免重复触发
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 标记当前节点的 hint 是否已经显示过（确保每个节点只显示一次）
  const hintShownRef = useRef(false)
  // 标记视频是否已处理（防止重复调用 onNext）
  const videoHandledRef = useRef(false)

  // ============ 修复一：正确同步 ref ============
  // 在 useEffect 中同步所有 props 到 ref
  useEffect(() => {
    nodeRef.current = node
  }, [node])

  useEffect(() => {
    isLastNodeAtLocationRef.current = isLastNodeAtLocation
  }, [isLastNodeAtLocation])

  // ---- Hooks ----
  // 震动效果已禁用
  const { getTransitionClass, transition } = useTransitionAnimation()

  // ---- 初始化音频上下文 ----
  useEffect(() => {
    audioContextRef.current = Taro.createInnerAudioContext()

    audioContextRef.current.onPlay(() => setIsPlaying(true))
    audioContextRef.current.onStop(() => setIsPlaying(false))
    audioContextRef.current.onEnded(() => setIsPlaying(false))
    audioContextRef.current.onError(() => {
      setIsPlaying(false)
      // Taro.showToast({
      //   title: '',
      //   icon: 'none',
      //   duration: 1500
      // })
    })

    return () => {
      // 组件卸载时清理
      if (audioContextRef.current) {
        audioContextRef.current.destroy()
      }
    }
  }, [])

  // ============ 修复五：节点变化时正确重置 ============
  useEffect(() => {
    // ✅ 优先清理：先清理 timeout，防止之前的 setTimeout 回调执行
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
      hintTimeoutRef.current = null
    }

    // 节点变化时重置所有状态
    setDisplayText('')
    setIsTyping(false)
    isTypingRef.current = false
    setShowChoices(false)
    setShowNextLocationHint(false)
    setTypingFinished(false) // ✅ 重置打字完成标志
    nextLocationHintRef.current = false
    setShowVideoPlayer(false) // 重置视频播放状态
    setVideoUrl('')
    videoHandledRef.current = false // 重置视频处理标志
    // 注意：hintShownRef 由 startTypingEffect 统一管理

    if (typeTimerRef.current) {
      clearInterval(typeTimerRef.current)
      typeTimerRef.current = null
    }

    // 重置跳过标记
    userSkippedRef.current = false

    // 停止上一个节点的音频
    if (audioContextRef.current) {
      audioContextRef.current.stop()
      setIsPlaying(false)
    }

    // 判断沉浸模式
    setIsImmersive(shouldUseImmersiveMode(node))

    // 注意：剧情模式下所有震动效果已禁用

    // 开始新节点的打字
    if (node.dialog?.content) {
      startTypingEffect(node.dialog.content)
    }

    // 自动播放TTS
    if (autoPlay && node.dialog?.ttsAudio) {
      // 先停止当前播放的音频
      if (audioContextRef.current && isPlaying) {
        audioContextRef.current.stop()
      }
      // 延迟100ms后播放新音频，确保前一个音频已停止
      setTimeout(() => {
        playTTS(node.dialog!.ttsAudio!).catch(err => {
          console.error('[StoryDialog] 自动播放TTS失败:', err)
        })
      }, 100)
    }
  }, [node.id]) // ✅ 只依赖 node.id，确保只在节点真正变化时触发

  // ============ 修复二：监听 typingFinished 从 true→false 的时机 ============
  useEffect(() => {
    if (!typingFinished) {
      // ✅ 每次打字开始（typingFinished变为false），重置hint标记
      hintShownRef.current = false
    }
  }, [typingFinished])

  // ============ 修复三：独立的卡片显示 useEffect ============
  useEffect(() => {
    // 只有打字完成时才处理
    if (!typingFinished) return
    // 必须是 transition 节点
    if (node.type !== 'transition') return
    // 必须是当前地点最后一个节点
    if (!isLastNodeAtLocation) return
    // 防重复
    if (hintShownRef.current) return

    hintShownRef.current = true

    // ✅ 修复四：根据文本长度动态调整阅读缓冲时间
    // 给用户阅读最后一句话的时间，文本越长，延迟越长
    // 可根据需要调整以下数值（单位：毫秒）
    const contentLength = node.dialog?.content?.length || 0
    const READING_DELAY = contentLength > 100 ? 12000 : contentLength > 60 ? 7000 : 5000
    // ↑ 长文本(>100字)2500ms | 中等文本(60-100字)2000ms | 短文本(<60字)1500ms

    hintTimeoutRef.current = setTimeout(() => {
      setShowNextLocationHint(true)
      hintTimeoutRef.current = null
    }, READING_DELAY)

    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
      }
    }
  }, [
    typingFinished,        // ✅ 依赖打字完成状态
    node.type,             // ✅ 依赖节点类型
    node.id,               // ✅ 依赖节点 id 以检测变化
    isLastNodeAtLocation   // ✅ 依赖父组件传入的最新值
  ])

  // ============ 修复一：在 startTypingEffect 中强制重置 ============
  const startTypingEffect = useCallback((text: string) => {
    // 清除上一个计时器
    if (typeTimerRef.current) {
      clearInterval(typeTimerRef.current)
      typeTimerRef.current = null
    }
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
      hintTimeoutRef.current = null
    }

    // ✅ 每次开始打字，无条件重置所有 hint 相关状态
    hintShownRef.current = false
    setShowNextLocationHint(false)
    setTypingFinished(false)

    setIsTyping(true)
    isTypingRef.current = true

    let index = 0

    // 根据文本长度动态调整打字速度（恢复较快速度）
    // 长文本 80ms/字，短文本 100ms/字
    const speed = text.length > 60 ? 80 : 100

    typeTimerRef.current = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        // 打字完成
        setIsTyping(false)
        isTypingRef.current = false
        if (typeTimerRef.current) {
          clearInterval(typeTimerRef.current)
        }
        // ✅ 只设置完成标志，不处理任何业务逻辑
        setTypingFinished(true)

        // 显示选项（这个可以留在这里，因为不依赖 ref）
        const currentNode = nodeRef.current
        if (currentNode.type === 'choice' && currentNode.choices?.length) {
          setTimeout(() => setShowChoices(true), 200)
        }
      }
    }, speed)
  }, []) // ✅ 空依赖，不捕获任何会变化的值

  // ---- 立即显示全文 ----
  const showFullText = useCallback(() => {
    // 标记为用户跳过
    userSkippedRef.current = true
    if (typeTimerRef.current) {
      clearInterval(typeTimerRef.current)
    }
    setDisplayText(node.dialog?.content || '')
    setIsTyping(false)
    isTypingRef.current = false
    if (node.type === 'choice' && node.choices?.length) {
      setTimeout(() => setShowChoices(true), 100)
    }
    // 注意：景点转移提示由打字完成回调统一处理，避免重复显示
  }, [node, isLastNodeAtLocation, nextNode])

  // ---- 点击气泡处理 ----
  const handleBubbleTap = useCallback(() => {
    // 使用 ref 获取最新状态，避免闭包问题
    const currentlyTyping = isTypingRef.current
    const currentNode = nodeRef.current
    const currentIsLastNode = isLastNodeAtLocationRef.current
    
    // 严格检查：transition 类型节点永远不响应点击，无论任何状态
    if (currentNode.type === 'transition') {
      return
    }
    
    // 如果按钮点击锁定中，忽略此次点击（防止事件冒泡导致的重复触发）
    if (buttonClickLockRef.current) {
      return
    }
    // 如果景点转移提示正在显示，阻止点击并提示用户（使用 ref 避免异步延迟）
    if (nextLocationHintRef.current) {
      Taro.showToast({
        title: '请点击"知道了，出发！"按钮',
        icon: 'none',
        duration: 1500
      })
      return
    }
    if (currentlyTyping) {
      // 如果禁用了跳过，则不响应点击，强制等待逐字输出完成
      if (disableSkip) {
        return
      }
      // 转移地点节点不允许任何操作，只能等待自动播放
      if (currentIsLastNode) {
        return
      }
      // 普通节点：立即显示完整文字（不逐字输出）
      if (typeTimerRef.current) {
        clearInterval(typeTimerRef.current)
      }
      setDisplayText(currentNode.dialog?.content || '')
      setIsTyping(false)
      isTypingRef.current = false
      // 选择节点：立即显示选项
      if (currentNode.type === 'choice' && currentNode.choices?.length) {
        setTimeout(() => setShowChoices(true), 100)
      }
      return
    }
    if (currentNode.type === 'choice' || currentNode.type === 'ending') {
      // 选择节点和结局节点不响应点击继续
      return
    }
    
    // 检查当前节点是否有视频需要播放
    const media = currentNode.dialog?.media
    if (media && media.type === 'match' && media.url && media.url.endsWith('.mp4')) {
      // 有视频，进入视频播放模式
      // 如果是云存储链接，需要转换为临时链接
      if (media.url.startsWith('cloud://')) {
        getTempFileURL(media.url).then(url => {
          if (url) {
            setVideoUrl(url)
            setShowVideoPlayer(true)
          } else {
            // 获取临时链接失败，直接进入下一步
            onNext()
          }
        }).catch(() => {
          // 出错时直接进入下一步
          onNext()
        })
      } else {
        setVideoUrl(media.url)
        setShowVideoPlayer(true)
      }
      return
    }
    
    // 普通节点：进入下一步
    onNext()
  }, [onNext, disableSkip])

  // ---- TTS播放控制 ----
  const playTTS = useCallback(async (audioUrl: string) => {
    if (!audioContextRef.current) return

    const audio = audioContextRef.current
    
    // 停止当前播放的音频
    if (isPlaying) {
      audio.stop()
    }
    
    // 处理云存储URL，转换为临时HTTPS链接
    let finalUrl = audioUrl
    if (audioUrl.startsWith('cloud://')) {
      try {
        console.log('[StoryTTS] 转换云存储URL:', audioUrl)
        const { fileList } = await Taro.cloud.getTempFileURL({
          fileList: [audioUrl]
        })
        if (fileList && fileList[0] && fileList[0].tempFileURL) {
          finalUrl = fileList[0].tempFileURL
          console.log('[StoryTTS] 临时URL:', finalUrl)
        } else {
          throw new Error('获取云存储临时URL失败')
        }
      } catch (err) {
        console.error('[StoryTTS] 云存储URL转换失败:', err)
        // Taro.showToast({ title: '语音加载失败', icon: 'none' })
        return
      }
    }
    
    // 延迟一小段时间确保音频已停止，然后播放新音频
    setTimeout(() => {
      audio.src = finalUrl
      audio.play()
    }, 100)
  }, [isPlaying])

  const handleTTSTap = useCallback(async () => {
    if (node.dialog?.ttsAudio) {
      try {
        await playTTS(node.dialog.ttsAudio)
      } catch (err) {
        console.error('[StoryDialog] 手动播放TTS失败:', err)
        // Taro.showToast({ title: '语音播放失败', icon: 'none' })
      }
    }
  }, [node.dialog?.ttsAudio, playTTS])

  // ---- 选项选择处理 ----
  const handleChoiceTap = useCallback((choice: StoryChoice) => {
    // 震动效果已禁用
    setShowChoices(false)
    onChoice(choice.id)
  }, [onChoice])



  // ---- 视频播放处理 ----
  const handleVideoEnded = useCallback(() => {
    if (videoHandledRef.current) return // 防止重复调用
    videoHandledRef.current = true
    setShowVideoPlayer(false)
    setVideoUrl('')
    onNext() // 视频结束后自动进入下一个节点
  }, [onNext])

  const handleVideoSkip = useCallback(() => {
    if (videoHandledRef.current) return // 防止重复调用
    videoHandledRef.current = true
    setShowVideoPlayer(false)
    setVideoUrl('')
    onNext() // 跳过视频后进入下一个节点
  }, [onNext])

  // 同步更新 ref 和 state
  useEffect(() => {
    nextLocationHintRef.current = showNextLocationHint
  }, [showNextLocationHint])

  // 同步更新 handler refs
  useEffect(() => {
    handleBubbleTapRef.current = handleBubbleTap
  }, [handleBubbleTap])

  // ---- 处理前往下一站 ----
  const handleGoToNextLocation = useCallback((e: any) => {
    // 阻止事件冒泡，防止触发对话框点击
    e?.stopPropagation?.()
    // 设置锁定，防止手势事件重复触发
    buttonClickLockRef.current = true

    // ✅ 点击出发时，主动重置hint状态，为下一次显示做准备
    setShowNextLocationHint(false)
    hintShownRef.current = false
    nextLocationHintRef.current = false

    // 延迟释放锁定，确保手势事件已处理完毕
    setTimeout(() => {
      buttonClickLockRef.current = false
    }, 300)

    // 根据是否使用路径规划决定调用哪个回调
    if (useRoutePlanning) {
      // 使用路径规划：调用导航回调
      console.log('[StoryDialog] 使用路径规划，调用 onNavigateToNext')
      onNavigateToNext?.()
    } else {
      // 不使用路径规划：直接调用 onNext 推进剧情
      console.log('[StoryDialog] 不使用路径规划，直接调用 onNext')
      onNext()
    }
  }, [onNavigateToNext, onNext, useRoutePlanning])
  // ---- 手势控制 ----
  // 使用 ref 包装 handler，确保始终调用最新版本的函数
  const { dragOffset, gestureHandlers } = useGestureControl({
    onTap: () => handleBubbleTapRef.current?.()
  })

  // ---- 构建进度点数组 ----
  const progressDots = Array.from(
    { length: Math.min(totalNodes, 5) },
    (_, i) => i
  )

  // ============ 渲染：下一站提示（景点转移卡片）- 全新设计版 ============
  const renderNextLocationHint = () => {
    if (!showNextLocationHint) return null
    const location = nextNode?.location || node.location
    if (!location) return null

    return (
      <View
        className='next-location-overlay'
        // ✅ 点击遮罩不关闭，防止误触
        catchMove
      >
        {/* 背景粒子层 */}
        <View className='next-location-particles'>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              className='nl-particle'
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </View>

        {/* 主卡片 */}
        <View className='next-location-card'>

          {/* 顶部装饰线 */}
          <View className='nl-card-top-line' />

          {/* 图标区域 */}
          <View className='nl-icon-area'>
            <View className='nl-icon-outer-ring'>
              <View className='nl-icon-inner-ring'>
                <Text className='nl-icon'>🧭</Text>
              </View>
            </View>
            {/* 图标光晕 */}
            <View className='nl-icon-glow' />
          </View>

          {/* 标题 */}
          <View className='nl-title-area'>
            <View className='nl-title-decoration' />
            <Text className='nl-title'>下一站</Text>
            <View className='nl-title-decoration' />
          </View>

          {/* 地点信息卡 */}
          <View className='nl-location-card'>
            {/* 左侧竖线装饰 */}
            <View className='nl-location-bar' />
            <View className='nl-location-content'>
              <Text className='nl-location-name'>{location.name}</Text>
              <View className='nl-location-divider' />
              <Text className='nl-location-address'>{location.address}</Text>
            </View>
            {/* 右侧地图图标 */}
            <View className='nl-location-map-icon'>
              <Text className='nl-map-emoji'>📍</Text>
            </View>
          </View>

          {/* 提示文字 */}
          <View className='nl-hint-area'>
            <View className='nl-hint-dot' />
            <Text className='nl-hint-text'>
              前往该地点后，剧情将继续展开
            </Text>
          </View>

          {/* 出发按钮 */}
          <View
            className='nl-action-btn'
            onClick={handleGoToNextLocation}
          >
            {/* 按钮内发光 */}
            <View className='nl-btn-glow' />
            <Text className='nl-btn-icon'>⚔</Text>
            <Text className='nl-btn-text'>知道了，出发！</Text>
          </View>

          {/* 底部提示 */}
          <Text className='nl-footer-text'>
            点击出发按钮继续你的峡谷征途
          </Text>

        </View>
      </View>
    )
  }

  // ============ 渲染：结局节点 ============
  const renderEnding = () => {
    if (!node.ending) return null
    const { title, content, rewards } = node.ending

    // 根据已完成章节计算本次应得的海报
    const posterItems: Array<{ id: string; name: string; url: string }> = []
    const hasPoetryChapters = completedChapters.includes('ch1') || completedChapters.includes('ch2') || completedChapters.includes('ch3')
    const hasEsportsChapter = completedChapters.includes('ch4')

    if (hasEsportsChapter) {
      posterItems.push({
        id: 'poster_niliu_shanghai',
        name: '逆流而上海报',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/海报/逆流而上海报.png'
      })
    }
    if (hasPoetryChapters && hasEsportsChapter) {
      posterItems.push({
        id: 'poster_kuaile_dianjing',
        name: '快乐电竞海报',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/海报/快乐电竞.png'
      })
    }

    return (
      <View 
        className='story-ending-overlay'
        onClick={(e) => e.stopPropagation()} // 阻止遮罩层点击事件穿透
        catchMove // 阻止触摸事件穿透
      >
        {/* 背景粒子 */}
        <View className='ending-particles'>
          <View className='ep-particle' />
          <View className='ep-particle' />
          <View className='ep-particle' />
          <View className='ep-particle' />
          <View className='ep-particle' />
          <View className='ep-particle' />
        </View>

        {/* 主卡片 */}
        <View className='ending-card' onClick={(e) => e.stopPropagation()}>
          {/* 顶部金色装饰线 */}
          <View className='ending-card-top-line' />

          {/* 图标区域 */}
          <View className='ending-icon-area'>
            <View className='ending-icon-outer-ring'>
              <View className='ending-icon-inner-ring'>
                <Text className='ending-icon'>✦</Text>
              </View>
            </View>
            <View className='ending-icon-glow' />
          </View>

          {/* 标题区域：横线 + 文字 + 横线 */}
          <View className='ending-title-area'>
            <View className='ending-title-decoration' />
            <Text className='ending-title'>{title}</Text>
            <View className='ending-title-decoration' />
          </View>

          {/* 内容文本卡 */}
          <View className='ending-content-card'>
            <View className='ending-content-bar' />
            <ScrollView scrollY className='ending-content-scroll'>
              <Text className='ending-content-text'>{content}</Text>
            </ScrollView>
          </View>

          {/* 奖励区域 */}
          {rewards && (
            <View className='ending-rewards-wrap'>
              {/* 今日收获标题行 */}
              <View className='ending-rewards-header'>
                <View className='ending-rewards-line' />
                <Text className='ending-rewards-label'>今日收获</Text>
                <View className='ending-rewards-line' />
              </View>

              {/* 羁绊值 */}
              <View className='ending-reward-item'>
                <View className='ending-reward-icon-wrap'>
                  <Text className='ending-reward-icon'>⚡</Text>
                </View>
                <View className='ending-reward-content'>
                  <Text className='ending-reward-name'>羁绊值</Text>
                  <Text className='ending-reward-value'>+{rewards.bondPoints}</Text>
                </View>
              </View>

              {/* 徽章 */}
              {rewards.badge && (
                <View className='ending-reward-item'>
                  <View className='ending-reward-icon-wrap'>
                    <Text className='ending-reward-icon'>🏅</Text>
                  </View>
                  <View className='ending-reward-content'>
                    <Text className='ending-reward-name'>专属徽章</Text>
                    <Text className='ending-reward-value ending-reward-value--badge'>
                      已解锁
                    </Text>
                  </View>
                </View>
              )}

              {/* 碎片列表 */}
              {rewards.fragments?.map((fragment, idx) => (
                <View key={idx} className='ending-reward-item'>
                  <View className='ending-reward-icon-wrap'>
                    <Text className='ending-reward-icon'>📜</Text>
                  </View>
                  <View className='ending-reward-content'>
                    <Text className='ending-reward-name'>{fragment}</Text>
                    <Text className='ending-reward-value'>×1</Text>
                  </View>
                </View>
              ))}

              {/* 海报奖励 */}
              {posterItems.map((poster, idx) => (
                <View key={idx} className='ending-reward-item'>
                  <View className='ending-reward-icon-wrap'>
                    <Text className='ending-reward-icon'>🖼️</Text>
                  </View>
                  <View className='ending-reward-content'>
                    <Text className='ending-reward-name'>{poster.name}</Text>
                    <View
                      className='ending-reward-preview-btn'
                      onClick={(e) => {
                        e.stopPropagation()
                        Taro.previewImage({
                          current: poster.url,
                          urls: posterItems.map((p) => p.url)
                        })
                      }}
                    >
                      <Text className='preview-btn-text'>预览</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 完成按钮 */}
          <View 
            className='ending-action-btn' 
            onClick={(e) => {
              e.stopPropagation() // 阻止事件冒泡
              console.log('🎬 完成按钮被点击')
              if (onCompleteStory) {
                onCompleteStory()
              } else {
                onNext()
              }
            }}
          >
            <View className='ending-btn-glow' />
            <Text className='ending-btn-icon'>🎋</Text>
            <Text className='ending-btn-text'>完成今日征程</Text>
          </View>

          {/* 底部提示 */}
          <Text className='ending-footer-text'>
            诗酒趁年华，电竞永不弃
          </Text>
        </View>
      </View>
    )
  }

  // ============ 渲染：媒体区域（实景图/选手照片）============
  const [mediaClosed, setMediaClosed] = useState(false)

  const handleMediaClose = useCallback(() => {
    setMediaClosed(true)
    // 只关闭图片，不推进剧情
  }, [])

  const renderMedia = () => {
    const media = node.dialog?.media
    if (!media || mediaClosed) return null

    // 如果是视频类型（以.mp4结尾），不显示图片卡片，由视频播放器处理
    if (media.type === 'match' && media.url && media.url.endsWith('.mp4')) {
      return null
    }

    // 支持单张或多张
    const mediaList = Array.isArray(media) ? media : [media]

    return (
      <StoryMediaViewer
        mediaList={mediaList}
        compact={true}
        onClose={handleMediaClose}
      />
    )
  }

  // ============ 渲染：英雄立绘 ============
  const renderHeroIllustration = () => {
    const illustration = node.dialog?.speakerIllustration
    if (!illustration) return null

    const emotion = node.dialog?.emotion || 'normal'

    return (
      <View className='hero-illustration-container'>
        <Image
          className={`hero-illustration-img emotion-${emotion}`}
          src={illustration}
          mode='aspectFit'
        />
        {/* 立绘底部光晕 */}
        <View className='hero-glow-effect' />
      </View>
    )
  }

  // ============ 渲染：对话气泡主体 ============
  const renderDialogBubble = () => {
    const dialog = node.dialog
    if (!dialog) return null

    const textContent = displayText
    const textType = getTextLengthType(dialog.content)
    const isKeyNode = node.isKeyNode || false
    const illustration = dialog.speakerIllustration
    const emotion = dialog?.emotion || 'normal'

    return (
      <View className='dialog-main-area'>
        {/* 英雄立绘 - 放在对话框上方 */}
        {illustration && (
          <View className='hero-illustration-above'>
            <Image
              className={`hero-illustration-above-img emotion-${emotion}`}
              src={illustration}
              mode='aspectFit'
            />
          </View>
        )}

        {/* 说话人信息行 */}
        <View className='speaker-info-row'>
          {/* 圆形头像 */}
          {dialog.speakerAvatar && (
            <Image
              className='speaker-avatar-small'
              src={dialog.speakerAvatar}
              mode='aspectFill'
            />
          )}
          {/* 名字标签 */}
          <View className='speaker-name-tag'>
            <Text className='speaker-name'>{dialog.speaker}</Text>
          </View>
        </View>

        {/* 主气泡 - transition 节点禁用点击事件以完全静默 */}
        <View
          className={`dialog-bubble ${isKeyNode ? 'key-node' : ''}`}
          {...(node.type === 'transition' ? {} : { onClick: handleBubbleTap })}
        >
          {/* 顶部装饰线 */}
          <View className='bubble-top-line' />

          {/* 对话文字 */}
          <Text className={`dialog-text text-${textType}`}>
            {textContent}
            {/* 打字光标 */}
            {isTyping && <Text className='typing-cursor' />}
          </Text>

          {/* 气泡底部 */}
          <View className='bubble-footer'>
            {/* 进度点 */}
            <View className='node-progress'>
              {progressDots.map((_, idx) => (
                <View
                  key={idx}
                  className={`progress-dot ${
                    idx === currentIndex % 5 ? 'active' : ''
                  }`}
                />
              ))}
            </View>

            {/* 继续提示（打字完成后显示）- transition 节点不显示 */}
            {!isTyping && node.type !== 'choice' && node.type !== 'ending' && node.type !== 'transition' && (
              <View className='continue-hint'>
                <View className='continue-arrow' />
                <Text className='continue-text'>继续</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }

  // ============ 渲染：选择分支 ============
  const renderChoices = () => {
    if (!showChoices || !node.choices?.length) return null

    return (
      <View className='story-choices-container'>
        {/* 选项提示语 */}
        <View className='choices-prompt'>
          <Text className='choices-prompt-text'>— 你的选择 —</Text>
        </View>

        {/* 选项列表 */}
        {node.choices.map((choice, index) => (
          <View
            key={choice.id}
            className='choice-btn'
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => handleChoiceTap(choice)}
          >
            <Text className='choice-text'>{choice.text}</Text>
            <Text className='choice-arrow'>›</Text>
          </View>
        ))}
      </View>
    )
  }

  // ============ 主渲染 ============
  return (
    <>
      <View
        className={`story-dialog-overlay ${isImmersive ? 'immersive-mode' : ''} ${getTransitionClass()}`}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
          transition: dragOffset.x !== 0 || dragOffset.y !== 0 ? 'none' : 'transform 0.3s ease'
        }}
        // 当景点转移提示显示或当前是transition节点时，禁用手势控制
        {...(showNextLocationHint || node.type === 'transition' ? {} : gestureHandlers)}
      >
        <>
          {/* 粒子背景效果 */}
          <ParticleBackground
            active={isImmersive}
            theme={
              node.dialog?.emotion === 'excited' ? 'red' :
              node.isKeyNode ? 'gold' : 'gold'
            }
            intensity={isImmersive ? 'medium' : 'low'}
          />

          {/* 顶部控制区 */}
          <View className='story-top-controls'>

            {/* TTS播放按钮 - transition 节点禁用 */}
            {node.dialog?.ttsAudio && node.type !== 'transition' && (
              <View
                className={`tts-control-btn ${isPlaying ? 'playing' : ''}`}
                onClick={handleTTSTap}
              >
                <TTSWaveAnimation
                  isPlaying={isPlaying}
                  color='#F5C518'
                  size='small'
                />
                <Text className='tts-text'>
                  {isPlaying ? '播放中' : '播放语音'}
                </Text>
              </View>
            )}


          </View>

          {/* 章节徽章 */}
          {chapterTitle && (
            <View className='story-chapter-badge'>
              <Text className='chapter-icon'>⚔</Text>
              <Text className='chapter-text'>{chapterTitle}</Text>
            </View>
          )}

          {/* 地点提示 */}
          {node.location?.name && (
            <View className='story-location-hint'>
              <View className='location-dot' />
              <Text className='location-name'>{node.location.name}</Text>
            </View>
          )}

          {/* 实景图/选手照片 */}
          {renderMedia()}

          {/* 根据节点类型渲染不同内容 */}
          {node.type === 'ending' && renderEnding()}
          {(node.type === 'dialog' || node.type === 'choice' || node.type === 'checkin' || node.type === 'transition') && (
            <>
              {/* 对话气泡 */}
              {renderDialogBubble()}
              {/* 选择分支 */}
              {renderChoices()}
            </>
          )}
        </>
      </View>

      {/* 下一站提示 - 放在外层，避免受transform影响 */}
      {renderNextLocationHint()}

      {/* 全屏视频播放器 */}
      {showVideoPlayer && videoUrl && (
        <View className='story-video-overlay'>
          <View className='story-video-container'>
            <Video
              className='story-video-player'
              src={videoUrl}
              autoplay
              controls
              objectFit='contain'
              showProgress
              showFullscreenBtn
              showPlayBtn
              showCenterPlayBtn
              enableProgressGesture
              vslideGestureInFullscreen
              onEnded={handleVideoEnded}
              onError={(e) => {
                console.error('视频播放错误:', e)
                Taro.showToast({ title: '视频加载失败', icon: 'none' })
                handleVideoEnded()
              }}
            />
          </View>
          <View className='story-video-skip' onClick={handleVideoSkip}>
            <Text className='story-skip-text'>跳过</Text>
          </View>
        </View>
      )}
    </>
  )
}

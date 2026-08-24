import { useState, useCallback, useEffect, useRef } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import { api, type TTSSegment } from '@/services/api'
import { playAIChatSegments, stopAIChatAudio } from '@/services/tts-player'
import './ChatPanel.scss'

interface Message {
  role: 'user' | 'assistant'
  content: string
  mode?: string
  ttsSegments?: TTSSegment[]
}

interface ChatPanelProps {
  visible: boolean
  heroId: string
  cityCode: string
  poiId?: string
  onClose: () => void
}

export default function ChatPanel({ visible, heroId, cityCode, poiId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const chatGeneration = useRef(0)

  useEffect(() => () => stopAIChatAudio(), [])

  useEffect(() => {
    if (!visible) stopAIChatAudio()
  }, [visible])

  // 发送消息
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return

    const userMsg = inputText.trim()
    const generation = ++chatGeneration.current
    stopAIChatAudio()
    setInputText('')

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])

    // 显示加载态
    setIsLoading(true)

    try {
      // 调用AI对话接口（同时返回文本+语音）
      const result = await api.chat({
        hero_id: heroId,
        message: userMsg,
        mode: 'normal',
        city_code: cityCode,
        poi_id: poiId,
        need_tts: true,  // 请求TTS语音
      })

      if (generation !== chatGeneration.current) return
      const segments = result.tts?.available ? result.tts.segments : []
      const aiMsg: Message = {
        role: 'assistant',
        content: result.reply,
        mode: result.mode,
        ttsSegments: segments,
      }
      setMessages(prev => [...prev, aiMsg])

      // Text is already rendered. Playback failure intentionally leaves it intact.
      if (segments.length > 0) {
        setIsSpeaking(true)
        try {
          await playAIChatSegments(segments, heroId)
        } catch (e) {
          console.warn('语音播放失败', e)
        }
        if (generation === chatGeneration.current) setIsSpeaking(false)
      }

    } catch (error) {
      // 降级显示
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '哈哈，峡谷信号不太好，容我饮一杯再与你细说！',
        mode: 'normal',
      }])
    }

    setIsLoading(false)
  }, [inputText, isLoading, heroId, cityCode, poiId])

  // Click replays the cached/generated sentence queue without asking chat again.
  const playMessageAudio = useCallback(async (msg: Message) => {
    if (!msg.ttsSegments?.length || isSpeaking) return
    
    setIsSpeaking(true)
    try {
      await playAIChatSegments(msg.ttsSegments, heroId)
    } catch (e) {
      console.warn('播放失败', e)
    }
    setIsSpeaking(false)
  }, [heroId, isSpeaking])

  const closePanel = () => {
    chatGeneration.current++
    stopAIChatAudio()
    onClose()
  }

  if (!visible) return null

  return (
    <View className="chat-panel">
      {/* 拖拽把手 */}
      <View className="chat-panel__handle">
        <View className="chat-panel__handle-bar" />
      </View>

      {/* 英雄信息 */}
      <View className="chat-panel__header">
        <Image className="chat-panel__avatar" src={`/assets/hero/${heroId}-avatar.png`} />
        <View className="chat-panel__hero-info">
          <Text className="chat-panel__hero-name">李白 · 青莲剑仙</Text>
          {isSpeaking && <Text className="chat-panel__speaking">🔊 正在说话...</Text>}
        </View>
        <View className="chat-panel__close" onClick={closePanel}>✕</View>
      </View>

      {/* 消息列表 */}
      <ScrollView 
        className="chat-panel__messages" 
        scrollY 
        scrollWithAnimation
        scrollIntoView={`msg-${messages.length - 1}`}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            id={`msg-${i}`}
            className={`chat-bubble chat-bubble--${msg.role} ${msg.mode === 'memory' ? 'chat-bubble--memory' : ''}`}
            onClick={() => msg.role === 'assistant' && playMessageAudio(msg)}
          >
            {msg.role === 'assistant' && (
              <Image className="chat-bubble__avatar" src={`/assets/hero/${heroId}-avatar.png`} />
            )}
            <View className="chat-bubble__content">
              <Text className="chat-bubble__text">{msg.content}</Text>
              {!!msg.ttsSegments?.length && (
                <Text className="chat-bubble__audio-icon">🔊 点击播放</Text>
              )}
            </View>
          </View>
        ))}

        {/* 加载态 */}
        {isLoading && (
          <View className="chat-bubble chat-bubble--assistant">
            <Image className="chat-bubble__avatar" src={`/assets/hero/${heroId}-avatar.png`} />
            <View className="chat-bubble__content">
              <Text className="chat-bubble__typing">李白正在思考中 ···</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 快捷标签 */}
      <ScrollView className="chat-panel__quick-tags" scrollX>
        {['附近美食', '推荐路线', '历史故事', '拍照打卡'].map(tag => (
          <View 
            key={tag} 
            className="chat-panel__tag"
            onClick={() => { setInputText(tag); }}
          >
            <Text>{tag}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 输入栏 */}
      <View className="chat-panel__input-bar">
        <Input
          className="chat-panel__input"
          placeholder="输入消息..."
          value={inputText}
          onInput={(e) => setInputText(e.detail.value)}
          onConfirm={() => sendMessage()}
          confirmType="send"
        />
        <View className="chat-panel__send-btn" onClick={sendMessage}>
          <Text>发送</Text>
        </View>
      </View>
    </View>
  )
}

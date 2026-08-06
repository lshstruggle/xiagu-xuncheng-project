import { useState, useCallback } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import { api } from '@/services/api'
import { playBase64Audio, stopAudio } from '@/services/tts-player'
import './ChatPanel.scss'

interface Message {
  role: 'user' | 'assistant'
  content: string
  mode?: string
  hasAudio?: boolean
  audioBase64?: string
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

  // 发送消息
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return

    const userMsg = inputText.trim()
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

      // 添加AI回复
      const aiMsg: Message = {
        role: 'assistant',
        content: result.reply,
        mode: result.mode,
        hasAudio: result.audio_ready,
        audioBase64: result.audio_base64,
      }
      setMessages(prev => [...prev, aiMsg])

      // 自动播放语音
      if (result.audio_ready && result.audio_base64) {
        setIsSpeaking(true)
        try {
          await playBase64Audio(result.audio_base64)
        } catch (e) {
          console.warn('语音播放失败', e)
        }
        setIsSpeaking(false)
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

  // 点击消息播放语音
  const playMessageAudio = useCallback(async (msg: Message) => {
    if (!msg.hasAudio || !msg.audioBase64 || isSpeaking) return
    
    setIsSpeaking(true)
    try {
      await playBase64Audio(msg.audioBase64)
    } catch (e) {
      console.warn('播放失败', e)
    }
    setIsSpeaking(false)
  }, [isSpeaking])

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
        <View className="chat-panel__close" onClick={onClose}>✕</View>
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
              {msg.hasAudio && (
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

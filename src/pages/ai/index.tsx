import { View, Text, Input, Button, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface Message {
  id: string
  type: 'ai' | 'user' | 'memory'
  content: string
  memoryTitle?: string
}

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'ai',
    content: '今朝有酒今朝醉，明日愁来明日愁。召唤师，有何贵干？'
  },
  {
    id: '2',
    type: 'user',
    content: '李白，我想听你讲讲长安的故事'
  },
  {
    id: '3',
    type: 'memory',
    content: '你们曾在王者峡谷并肩作战，那一夜李白用青莲剑歌斩获五杀，你们约定要一起冲上王者。',
    memoryTitle: '✨ 检测到一段峡谷记忆...'
  },
  {
    id: '4',
    type: 'ai',
    content: '长安...那是我魂牵梦绕之地。金阙晓钟开万户，玉阶仙仗拥千官。可惜如今，只剩剑与酒相伴。'
  }
]

const quickTags = ['讲个故事', '陪我聊天', '念首诗', '峡谷回忆']

export default function AI() {
  const [inputValue, setInputValue] = useState('')
  const [messages] = useState<Message[]>(mockMessages)

  const handleSend = () => {
    if (inputValue.trim()) {
      console.log('Sending:', inputValue)
      setInputValue('')
    }
  }

  const handleTagClick = (tag: string) => {
    setInputValue(tag)
  }

  return (
    <View className='ai-container'>
      {/* Hero Info */}
      <View className='hero-info'>
        <View className='hero-avatar-wrap'>
          <View className='hero-avatar'>
            <Text className='avatar-emoji'>🗡️</Text>
          </View>
          <View className='online-indicator'></View>
        </View>
        <View className='hero-detail'>
          <Text className='hero-name'>李白·青莲剑仙</Text>
          <View className='bond-level'>
            <Text className='bond-text'>羁绊 Lv.7</Text>
            <View className='bond-bar-bg'>
              <View className='bond-bar'>
                <View className='bond-fill' style={{ width: '68%' }}></View>
              </View>
            </View>
            <Text className='bond-percent'>68%</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView className='messages-area' scrollY>
        {messages.map((message) => (
          <View key={message.id}>
            {message.type === 'memory' && (
              <View className='memory-bubble'>
                <View className='memory-header'>
                  <Text className='memory-icon'>✨</Text>
                  <Text className='memory-title'>{message.memoryTitle}</Text>
                </View>
                <Text className='memory-content'>{message.content}</Text>
              </View>
            )}
            {message.type === 'user' && (
              <View className='user-bubble-wrap'>
                <View className='user-bubble'>
                  <Text className='user-text'>{message.content}</Text>
                </View>
                <View className='user-avatar-small'>
                  <Image 
                    className='user-avatar-img' 
                    src='https://game.gtimg.cn/images/yxzj/img201606/heroimg/109/109.jpg'
                  />
                </View>
              </View>
            )}
            {message.type === 'ai' && (
              <View className='ai-bubble-wrap'>
                <View className='ai-avatar-small'>
                  <Text>🗡️</Text>
                </View>
                <View className='ai-bubble'>
                  <Text className='ai-text'>{message.content}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View className='input-area'>
        <ScrollView className='quick-tags' scrollX showScrollbar={false}>
          {quickTags.map((tag) => (
            <View 
              key={tag} 
              className='tag-item'
              onClick={() => handleTagClick(tag)}
            >
              <Text className='tag-text'>{tag}</Text>
            </View>
          ))}
        </ScrollView>
        <View className='input-row'>
          <View className='input-wrap'>
            <Input
              className='input'
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              placeholder='说点什么...'
              placeholderClass='input-placeholder'
            />
            <Text className='mic-icon'>🎤</Text>
          </View>
          <Button 
            className={`send-btn ${inputValue.trim() ? 'active' : ''}`}
            onClick={handleSend}
          >
            <Text className='send-icon'>📤</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

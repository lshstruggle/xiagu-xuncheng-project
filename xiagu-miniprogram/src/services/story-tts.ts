/**
 * 故事TTS音频服务
 * 集成GPT-SoVITS模型，为故事对话生成语音
 */

import Taro from '@tarojs/taro'

// TTS配置
const TTS_CONFIG = {
  // GPT-SoVITS API配置（需要替换为实际的API地址）
  API_BASE_URL: 'https://your-tts-api.com',
  // 李白声音模型ID
  LIBAI_MODEL_ID: 'libai-v4',
  // 音频格式
  AUDIO_FORMAT: 'mp3',
  // 默认语速（与训练推理参数一致）
  DEFAULT_SPEED: 1.1,
  // 推理参数（与xiagu-server配置保持一致）
  INFERENCE_PARAMS: {
    batch_size: 120,
    sample_steps: 32,
    split_interval: 0.3,
    top_k: 90,
    top_p: 1.0,
    temperature: 1.0,
    repetition_penalty: 1.7
  }
}

// 音频缓存
const audioCache: Map<string, string> = new Map()

/**
 * 生成TTS音频
 * @param text 要合成的文本
 * @param emotion 情感类型
 * @returns 音频URL或base64
 */
export async function generateTTS(
  text: string,
  emotion: 'normal' | 'happy' | 'sad' | 'excited' | 'thoughtful' = 'normal'
): Promise<string | null> {
  // 检查缓存
  const cacheKey = `${text}_${emotion}`
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!
  }

  try {
    // 方法1: 调用GPT-SoVITS API（推荐）
    // const audioUrl = await callGPTSoVITS(text, emotion)
    
    // 方法2: 使用预生成的音频文件
    const audioUrl = await getPreloadedAudio(text, emotion)
    
    if (audioUrl) {
      audioCache.set(cacheKey, audioUrl)
    }
    
    return audioUrl
  } catch (error) {
    console.error('TTS生成失败:', error)
    return null
  }
}

/**
 * 调用GPT-SoVITS API
 * 需要部署自己的GPT-SoVITS服务
 */
async function callGPTSoVITS(
  text: string,
  emotion: string
): Promise<string | null> {
  try {
    const response = await Taro.request({
      url: `${TTS_CONFIG.API_BASE_URL}/tts`,
      method: 'POST',
      data: {
        text,
        model_id: TTS_CONFIG.LIBAI_MODEL_ID,
        emotion,
        format: TTS_CONFIG.AUDIO_FORMAT,
        speed: TTS_CONFIG.DEFAULT_SPEED
      },
      header: {
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200 && response.data) {
      // 返回音频URL或base64数据
      return response.data.audio_url || response.data.audio_base64
    }
    
    return null
  } catch (error) {
    console.error('GPT-SoVITS API调用失败:', error)
    return null
  }
}

/**
 * 获取预加载的音频
 * 可以提前用GPT-SoVITS生成好所有故事音频，上传到云存储
 */
async function getPreloadedAudio(
  text: string,
  emotion: string
): Promise<string | null> {
  // 文本哈希，用于生成文件名
  const textHash = hashText(text)
  const fileName = `tts/libai/${emotion}/${textHash}.mp3`
  
  try {
    // 从云存储获取临时链接
    const { fileList } = await Taro.cloud.getTempFileURL({
      fileList: [`cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/${fileName}`]
    })
    
    if (fileList && fileList.length > 0 && fileList[0].tempFileURL) {
      return fileList[0].tempFileURL
    }
    
    return null
  } catch (error) {
    console.log('预加载音频不存在:', fileName)
    return null
  }
}

/**
 * 简单的文本哈希函数
 */
function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36).substring(0, 8)
}

/**
 * 批量预生成TTS音频
 * 用于提前生成整个故事的音频
 */
export async function batchGenerateTTS(
  texts: Array<{ text: string; emotion: string; nodeId: string }>
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}
  
  for (const item of texts) {
    const audioUrl = await generateTTS(item.text, item.emotion as any)
    if (audioUrl) {
      results[item.nodeId] = audioUrl
    }
  }
  
  return results
}

/**
 * 预加载故事的TTS音频
 */
export async function preloadStoryTTS(storyId: string): Promise<void> {
  // 这里可以预加载整个故事的音频
  console.log(`预加载故事 ${storyId} 的TTS音频`)
  
  // 示例：预加载前几章的音频
  // const story = getStoryById(storyId)
  // if (story) {
  //   const firstChapters = story.chapters.slice(0, 2)
  //   for (const chapter of firstChapters) {
  //     for (const nodeId of chapter.nodes) {
  //       const node = story.nodes[nodeId]
  //       if (node.dialog?.content) {
  //         await generateTTS(node.dialog.content, node.dialog.emotion)
  //       }
  //     }
  //   }
  // }
}

/**
 * 清除TTS缓存
 */
export function clearTTSCache(): void {
  audioCache.clear()
}

/**
 * 获取缓存大小
 */
export function getTTSCacheSize(): number {
  return audioCache.size
}

/**
 * 使用微信内置TTS（备选方案）
 */
export function useWechatTTS(text: string): void {
  // 微信小程序内置语音合成
  // 注意：需要用户点击触发
  const innerAudioContext = Taro.createInnerAudioContext()
  
  // 这里可以使用微信的语音合成API
  // 或者使用第三方的语音合成服务
  
  // 示例：播放一段提示音表示TTS开始
  // innerAudioContext.src = 'cloud://.../tts-start.mp3'
  // innerAudioContext.play()
}

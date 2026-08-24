import Taro from '@tarojs/taro'
import { api, type TTSSegment } from './api'

// 全局音频实例
const innerAudio = Taro.createInnerAudioContext()

/**
 * 播放Base64编码的WAV音频（AI对话返回的）
 */
export async function playBase64Audio(base64Data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fs = Taro.getFileSystemManager()
    const tempPath = `${Taro.env.USER_DATA_PATH}/tts_${Date.now()}.wav`

    // base64写入临时文件
    fs.writeFile({
      filePath: tempPath,
      data: base64Data,
      encoding: 'base64',
      success: () => {
        innerAudio.src = tempPath
        
        innerAudio.onEnded(() => {
          // 播放完成后清理临时文件
          fs.unlink({ filePath: tempPath, fail: () => {} })
          resolve()
        })
        
        innerAudio.onError((err) => {
          fs.unlink({ filePath: tempPath, fail: () => {} })
          reject(err)
        })
        
        innerAudio.play()
      },
      fail: (err) => reject(err),
    })
  })
}

/**
 * 停止当前播放
 */
export function stopAudio() {
  innerAudio.stop()
}

/**
 * 是否正在播放
 */
export function isPlaying(): boolean {
  return !innerAudio.paused
}

let aiPlaybackGeneration = 0
let aiTempFilePath = ''
const aiSegmentCache = new Map<string, ArrayBuffer>()

function cleanupAITempFile() {
  if (!aiTempFilePath) return
  Taro.getFileSystemManager().unlink({ filePath: aiTempFilePath, fail: () => {} })
  aiTempFilePath = ''
}

function playWavBytes(bytes: ArrayBuffer, generation: number, onStart?: () => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = `${Taro.env.USER_DATA_PATH}/ai_tts_${Date.now()}_${generation}.wav`
    cleanupAITempFile()
    aiTempFilePath = filePath
    Taro.getFileSystemManager().writeFile({
      filePath,
      data: bytes,
      success: () => {
        if (generation !== aiPlaybackGeneration) {
          cleanupAITempFile()
          resolve()
          return
        }
        innerAudio.stop()
        innerAudio.offEnded()
        innerAudio.offError()
        innerAudio.src = filePath
        innerAudio.onEnded(() => {
          cleanupAITempFile()
          resolve()
        })
        innerAudio.onError((error) => {
          cleanupAITempFile()
          reject(error)
        })
        innerAudio.play()
        onStart?.()
      },
      fail: reject,
    })
  })
}

async function getAISegmentAudio(segment: TTSSegment, heroId: string): Promise<ArrayBuffer> {
  const cached = aiSegmentCache.get(segment.ticket)
  if (cached) return cached
  const audio = await api.getTTSSegment({
    hero_id: heroId,
    text: segment.text,
    ticket: segment.ticket,
  })
  aiSegmentCache.set(segment.ticket, audio)
  return audio
}

/**
 * Plays ordered AI segments.  When a sentence starts, the next sentence is
 * requested immediately so TTS inference overlaps with playback.
 */
export async function playAIChatSegments(segments: TTSSegment[], heroId: string): Promise<void> {
  const generation = ++aiPlaybackGeneration
  innerAudio.stop()
  cleanupAITempFile()
  for (let index = 0; index < segments.length; index++) {
    if (generation !== aiPlaybackGeneration) return
    const audio = await getAISegmentAudio(segments[index], heroId)
    if (generation !== aiPlaybackGeneration) return
    let nextRequestStarted = false
    await playWavBytes(audio, generation, () => {
      if (!nextRequestStarted && index + 1 < segments.length) {
        nextRequestStarted = true
        // A failure is handled when that segment becomes the current one.
        void getAISegmentAudio(segments[index + 1], heroId).catch(() => undefined)
      }
    })
  }
}

/** Cancels playback and prevents a late HTTP response from starting audio. */
export function stopAIChatAudio() {
  aiPlaybackGeneration++
  innerAudio.stop()
  cleanupAITempFile()
}

/**
 * 播放远程URL音频（回忆模式预生成语音）
 * 微信小程序需要先下载再播放
 */
export async function playRemoteAudio(url: string): Promise<void> {
  console.log('[TTS] 开始下载远程音频:', url)

  try {
    // 先下载音频文件
    const downloadRes = await Taro.downloadFile({
      url: url,
      header: {
        'Authorization': `Bearer ${Taro.getStorageSync('token') || ''}`
      }
    })

    if (downloadRes.statusCode !== 200) {
      throw new Error(`下载失败: ${downloadRes.statusCode}`)
    }

    const tempFilePath = downloadRes.tempFilePath
    console.log('[TTS] 音频下载完成:', tempFilePath)

    // 停止当前播放
    innerAudio.stop()

    // 重置事件监听
    innerAudio.offEnded()
    innerAudio.offError()

    // 设置本地音频源
    innerAudio.src = tempFilePath

    return new Promise((resolve, reject) => {
      innerAudio.onEnded(() => {
        console.log('[TTS] 音频播放完成')
        resolve()
      })

      innerAudio.onError((err) => {
        console.error('[TTS] 音频播放失败:', err)
        reject(err)
      })

      // 开始播放
      console.log('[TTS] 开始播放本地音频')
      innerAudio.play()
    })
  } catch (err) {
    console.error('[TTS] 下载或播放失败:', err)
    throw err
  }
}

/**
 * 播放回忆模式彩蛋语音（根据彩蛋ID）
 * 支持微信云存储cloud://文件ID和HTTPS URL
 */
export async function playMemoryTTS(eggId: string): Promise<void> {
  const { api } = await import('./api')
  let audioUrl = api.getMemoryTTSUrl(eggId)
  
  // 检查是否使用云存储
  const isCloud = api.isUsingCloudStorage(eggId)
  console.log(`[TTS] 播放回忆语音: ${eggId}, 来源: ${isCloud ? '云存储' : '本地服务器'}`)
  
  // 如果是微信云存储文件ID (cloud://)，需要获取临时URL
  if (audioUrl.startsWith('cloud://')) {
    try {
      const { fileList } = await Taro.cloud.getTempFileURL({
        fileList: [audioUrl]
      })
      if (fileList && fileList[0] && fileList[0].tempFileURL) {
        audioUrl = fileList[0].tempFileURL
        console.log('[TTS] 云存储临时URL:', audioUrl)
      } else {
        throw new Error('获取云存储文件临时URL失败')
      }
    } catch (err) {
      console.error('[TTS] 云存储URL转换失败:', err)
      throw err
    }
  }
  
  return playRemoteAudio(audioUrl)
}

/**
 * 预加载回忆模式语音（可选优化）
 * 在彩蛋触发前提前下载，减少播放延迟
 */
export async function preloadMemoryTTS(eggId: string): Promise<string | null> {
  const { api } = await import('./api')
  const audioUrl = api.getMemoryTTSUrl(eggId)
  
  try {
    console.log('[TTS] 预加载语音:', eggId)
    const downloadRes = await Taro.downloadFile({
      url: audioUrl,
      header: {
        'Authorization': `Bearer ${Taro.getStorageSync('token') || ''}`
      }
    })
    
    if (downloadRes.statusCode === 200) {
      console.log('[TTS] 预加载完成:', eggId)
      return downloadRes.tempFilePath
    }
  } catch (err) {
    console.error('[TTS] 预加载失败:', err)
  }
  return null
}

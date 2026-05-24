/**
 * 自由模式欢迎剧情
 * 用户选择自由模式后显示的欢迎剧情
 */

import Taro from '@tarojs/taro'
import type { StoryNode } from '../types/story'

// 自由模式欢迎剧情节点
export const freeModeWelcomeNode: StoryNode = {
  id: 'free-mode-welcome',
  type: 'dialog',
  dialog: {
    speaker: '李白',
    speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
    speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
    content: '自由漫步？正合我意！这成都城中，宽窄巷子有着蓝buff般的悠然，太古里藏着红buff般的热烈，武侯祠如防御塔守护千年风骨，凤凰山似高地水晶见证热血。羁绊碎片散落各处，选手故事等你发掘——来，陪我饮尽这杯诗酒，再打一局！',
    emotion: 'excited',
    // 纯云存储路径，与剧情模式一致
    ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-welcome/free-mode-welcome.wav'
  },
  nextNodeId: undefined
}

// 检查是否需要显示欢迎剧情
export function shouldShowFreeModeWelcome(): boolean {
  try {
    const hasShown = Taro.getStorageSync('free_mode_welcome_shown')
    return !hasShown
  } catch (e) {
    console.error('检查欢迎剧情状态失败:', e)
    return true
  }
}

// 标记欢迎剧情已显示
export function markFreeModeWelcomeShown(): void {
  try {
    Taro.setStorageSync('free_mode_welcome_shown', true)
  } catch (e) {
    console.error('标记欢迎剧情已显示失败:', e)
  }
}

// 重置欢迎剧情（用于测试）
export function resetFreeModeWelcome(): void {
  try {
    Taro.removeStorageSync('free_mode_welcome_shown')
  } catch (e) {
    console.error('重置欢迎剧情失败:', e)
  }
}

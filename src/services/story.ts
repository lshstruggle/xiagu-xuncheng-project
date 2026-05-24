/**
 * 故事探索服务层
 * 管理故事进度、地点触发、奖励发放
 */

import Taro from '@tarojs/taro'
import type {
  StoryLine,
  StoryNode,
  UserStoryProgress,
  StoryTriggerResult,
  StoryMode
} from '../types/story'
import { libaiChengduStory } from '../data/stories/libai-chengdu'

// 本地存储键名
const STORAGE_KEYS = {
  STORY_PROGRESS: 'story_progress',
  EXPLORE_MODE: 'explore_mode',
  COMPLETED_STORIES: 'completed_stories'
}

// 故事线注册表
const STORY_REGISTRY: Record<string, StoryLine> = {
  'libai-chengdu': libaiChengduStory
}

/**
 * 获取所有可用的故事线
 */
export function getAvailableStories(): StoryLine[] {
  return Object.values(STORY_REGISTRY)
}

/**
 * 根据ID获取故事线
 */
export function getStoryById(storyId: string): StoryLine | undefined {
  return STORY_REGISTRY[storyId]
}

/**
 * 获取指定英雄的故事线
 * 支持通过 heroId 或 heroName 匹配
 */
export function getStoryByHero(heroId: string): StoryLine | undefined {
  return Object.values(STORY_REGISTRY).find(story => 
    story.heroId === heroId || story.heroName === heroId
  )
}

/**
 * 获取当前探索模式
 */
export function getExploreMode(): StoryMode {
  try {
    return Taro.getStorageSync(STORAGE_KEYS.EXPLORE_MODE) || 'free'
  } catch {
    return 'free'
  }
}

/**
 * 设置探索模式
 */
export function setExploreMode(mode: StoryMode): void {
  Taro.setStorageSync(STORAGE_KEYS.EXPLORE_MODE, mode)
}

/**
 * 获取当前进行中的故事进度
 */
export function getCurrentStoryProgress(): UserStoryProgress | null {
  try {
    return Taro.getStorageSync(STORAGE_KEYS.STORY_PROGRESS) || null
  } catch {
    return null
  }
}

/**
 * 保存故事进度
 */
export function saveStoryProgress(progress: UserStoryProgress): void {
  Taro.setStorageSync(STORAGE_KEYS.STORY_PROGRESS, {
    ...progress,
    lastUpdateTime: Date.now()
  })
}

/**
 * 清除故事进度
 */
export function clearStoryProgress(): void {
  Taro.removeStorageSync(STORAGE_KEYS.STORY_PROGRESS)
}

/**
 * 开始新的故事
 */
export function startStory(storyId: string, heroId: string): UserStoryProgress {
  const story = getStoryById(storyId)
  if (!story) {
    throw new Error(`故事线不存在: ${storyId}`)
  }

  const firstChapter = story.chapters[0]
  const firstNode = firstChapter?.nodes[0]

  const progress: UserStoryProgress = {
    storyId,
    heroId,
    currentNodeId: firstNode || '',
    currentChapterId: firstChapter?.id || '',
    completedNodes: [],
    completedChapters: [],
    collectedItems: [],
    choices: {},
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    status: 'ongoing'
  }

  saveStoryProgress(progress)
  return progress
}

/**
 * 获取当前节点
 */
export function getCurrentNode(progress: UserStoryProgress): StoryNode | null {
  const story = getStoryById(progress.storyId)
  if (!story) return null
  return story.nodes[progress.currentNodeId] || null
}

/**
 * 推进到下一个节点
 */
export function advanceStory(
  progress: UserStoryProgress,
  choiceId?: string
): UserStoryProgress {
  const story = getStoryById(progress.storyId)
  if (!story) return progress

  const currentNode = story.nodes[progress.currentNodeId]
  if (!currentNode) return progress

  // 标记当前节点为已完成
  if (!progress.completedNodes.includes(currentNode.id)) {
    progress.completedNodes.push(currentNode.id)
  }

  // 记录选择
  if (choiceId && currentNode.choices) {
    progress.choices[currentNode.id] = choiceId
  }

  // 确定下一个节点
  let nextNodeId: string | undefined

  if (choiceId && currentNode.choices) {
    const choice = currentNode.choices.find(c => c.id === choiceId)
    if (choice) {
      nextNodeId = choice.nextNodeId
    }
  } else if (currentNode.nextNodeId) {
    nextNodeId = currentNode.nextNodeId
  }

  // 更新当前节点
  if (nextNodeId) {
    progress.currentNodeId = nextNodeId
    const nextNode = story.nodes[nextNodeId]
    if (nextNode?.chapter && nextNode.chapter !== progress.currentChapterId) {
      // 章节切换
      if (progress.currentChapterId) {
        progress.completedChapters.push(progress.currentChapterId)
      }
      progress.currentChapterId = nextNode.chapter
    }
  }

  saveStoryProgress(progress)
  return progress
}

/**
 * 计算两点之间的距离（米）
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 检查是否到达故事触发地点
 */
export function checkStoryTrigger(
  userLat: number,
  userLng: number
): StoryTriggerResult {
  console.log('[StoryTrigger] 检查位置:', { userLat, userLng })
  
  const progress = getCurrentStoryProgress()
  console.log('[StoryTrigger] 进度:', progress)
  
  if (!progress) {
    console.log('[StoryTrigger] 无进度')
    return { triggered: false }
  }
  
  // 允许 'ongoing' 和 'paused' 状态触发（paused 是用户前往下一站时的状态）
  if (progress.status !== 'ongoing' && progress.status !== 'paused') {
    console.log('[StoryTrigger] 状态不是进行中或暂停:', progress.status)
    return { triggered: false }
  }

  const story = getStoryById(progress.storyId)
  if (!story) {
    console.log('[StoryTrigger] 未找到故事')
    return { triggered: false }
  }

  const currentNode = story.nodes[progress.currentNodeId]
  console.log('[StoryTrigger] 当前节点:', currentNode?.id, '位置:', currentNode?.location)
  
  if (!currentNode || !currentNode.location) {
    console.log('[StoryTrigger] 无当前节点或无位置信息')
    return { triggered: false }
  }

  const { location } = currentNode
  const distance = calculateDistance(
    userLat,
    userLng,
    location.lat,
    location.lng
  )

  const triggerRadius = location.radius || 200
  console.log('[StoryTrigger] 距离:', distance, '触发半径:', triggerRadius, '目标位置:', location)

  if (distance <= triggerRadius) {
    console.log('[StoryTrigger] 在触发范围内!')
    
    // 如果状态是 paused，恢复为 ongoing
    if (progress.status === 'paused') {
      console.log('[StoryTrigger] 恢复故事状态为 ongoing')
      progress.status = 'ongoing'
      saveStoryProgress(progress)
    }
    
    // 检查是否是新章节开始
    const isNewChapter =
      currentNode.chapter !== undefined &&
      currentNode.id === story.chapters.find(c => c.id === currentNode.chapter)?.nodes[0]

    const chapter = story.chapters.find(c => c.id === currentNode.chapter)

    return {
      triggered: true,
      node: currentNode,
      isNewChapter,
      chapterTitle: chapter?.title
    }
  }

  console.log('[StoryTrigger] 不在触发范围内')
  return { triggered: false }
}

/**
 * 发放节点奖励
 */
export function claimNodeRewards(
  progress: UserStoryProgress
): { bondPoints: number; fragments: string[]; poetryLines: string[] } {
  const story = getStoryById(progress.storyId)
  if (!story) return { bondPoints: 0, fragments: [], poetryLines: [] }

  const currentNode = story.nodes[progress.currentNodeId]
  if (!currentNode?.checkinReward) {
    return { bondPoints: 0, fragments: [], poetryLines: [] }
  }

  // 检查是否已经领取过
  const rewardKey = `reward_${currentNode.id}`
  if (progress.collectedItems.includes(rewardKey)) {
    return { bondPoints: 0, fragments: [], poetryLines: [] }
  }

  const reward = currentNode.checkinReward
  progress.collectedItems.push(rewardKey)
  saveStoryProgress(progress)

  return reward
}

/**
 * 完成故事
 */
export function completeStory(endingType: string): void {
  const progress = getCurrentStoryProgress()
  if (!progress) return

  progress.status = 'completed'
  progress.ending = {
    type: endingType,
    timestamp: Date.now()
  }

  saveStoryProgress(progress)

  // 添加到已完成故事列表
  const completed = getCompletedStories()
  if (!completed.includes(progress.storyId)) {
    completed.push(progress.storyId)
    Taro.setStorageSync(STORAGE_KEYS.COMPLETED_STORIES, completed)
  }
}

/**
 * 获取已完成的故事列表
 */
export function getCompletedStories(): string[] {
  try {
    return Taro.getStorageSync(STORAGE_KEYS.COMPLETED_STORIES) || []
  } catch {
    return []
  }
}

/**
 * 暂停故事（切换回自由模式时）
 */
export function pauseStory(): void {
  const progress = getCurrentStoryProgress()
  if (progress) {
    progress.status = 'paused'
    saveStoryProgress(progress)
  }
}

/**
 * 恢复故事（切换回探索模式时）
 */
export function resumeStory(): void {
  const progress = getCurrentStoryProgress()
  if (progress && progress.status === 'paused') {
    progress.status = 'ongoing'
    saveStoryProgress(progress)
  }
}

/**
 * 更换英雄时重置故事
 */
export function resetStory(): void {
  clearStoryProgress()
}

/**
 * 检查是否可以更换英雄
 */
export function canChangeHero(): { canChange: boolean; warning?: string } {
  const progress = getCurrentStoryProgress()
  if (!progress || progress.status === 'completed') {
    return { canChange: true }
  }

  const completedCount = progress.completedNodes.length
  if (completedCount === 0) {
    return { canChange: true }
  }

  return {
    canChange: false,
    warning: `更换英雄将重置当前故事进度（已完成 ${completedCount} 个节点），是否继续？`
  }
}

/**
 * 获取故事进度百分比
 */
export function getStoryProgressPercent(progress: UserStoryProgress): number {
  const story = getStoryById(progress.storyId)
  if (!story) return 0

  const totalNodes = Object.keys(story.nodes).length
  const completedNodes = progress.completedNodes.length

  return Math.round((completedNodes / totalNodes) * 100)
}

/**
 * 获取当前章节信息
 */
export function getCurrentChapterInfo(progress: UserStoryProgress) {
  const story = getStoryById(progress.storyId)
  if (!story) return null

  const chapter = story.chapters.find(c => c.id === progress.currentChapterId)
  const chapterIndex = story.chapters.findIndex(c => c.id === progress.currentChapterId)

  return {
    ...chapter,
    index: chapterIndex,
    total: story.chapters.length,
    isLastChapter: chapterIndex === story.chapters.length - 1
  }
}

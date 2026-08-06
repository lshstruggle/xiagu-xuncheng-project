/**
 * 故事探索系统类型定义
 * 《李白·成都寻梦记》故事数据结构
 */

/** 故事节点类型 */
export type StoryNodeType = 'dialog' | 'choice' | 'checkin' | 'ending' | 'transition'

/** 故事选择分支 */
export interface StoryChoice {
  id: string
  text: string
  nextNodeId: string
  condition?: {
    type: 'item' | 'bond' | 'checkin'
    value: string
    required?: boolean
  }
  reward?: {
    type: 'bond' | 'fragment' | 'poetry'
    value: string
  }
}

/** 媒体内容 */
export interface StoryMedia {
  type: 'scene' | 'player' | 'match'
  url: string
  caption?: string
  tag?: string
}

/** 故事节点 */
export interface StoryNode {
  id: string
  type: StoryNodeType
  chapter?: string
  isKeyNode?: boolean // 关键节点（触发沉浸模式+粒子效果）
  location?: {
    name: string
    address: string
    lat: number
    lng: number
    radius?: number // 触发范围（米）
  }
  dialog?: {
    speaker: string
    speakerAvatar?: string // 圆形头像
    speakerIllustration?: string // 半身立绘URL
    content: string
    emotion?: 'normal' | 'happy' | 'sad' | 'excited' | 'thoughtful'
    ttsAudio?: string // TTS音频URL
    media?: StoryMedia // 媒体内容（实景图/选手照片）
  }
  choices?: StoryChoice[]
  nextNodeId?: string // 自动跳转的下一个节点
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
      fragments: string[]
      badge?: string
    }
  }
  bgm?: string // 背景音乐
  bgImage?: string // 背景图
}

/** 故事章节 */
export interface StoryChapter {
  id: string
  title: string
  subtitle: string
  locationName: string
  nodes: string[] // 节点ID列表
  required?: boolean // 是否必须完成
}

/** 故事线定义 */
export interface StoryLine {
  id: string
  heroId: string
  heroName: string
  title: string
  subtitle: string
  description: string
  coverImage: string
  chapters: StoryChapter[]
  nodes: Record<string, StoryNode>
  totalDuration: string // 预计时长
  difficulty: 'easy' | 'normal' | 'hard'
}

/** 用户故事进度 */
export interface UserStoryProgress {
  storyId: string
  heroId: string
  currentNodeId: string
  currentChapterId: string
  completedNodes: string[]
  completedChapters: string[]
  collectedItems: string[]
  choices: Record<string, string> // 节点选择记录
  startTime: number
  lastUpdateTime: number
  status: 'ongoing' | 'paused' | 'completed'
  ending?: {
    type: string
    timestamp: number
  }
}

/** 故事模式 */
export type StoryMode = 'free' | 'explore'

/** 探索模式状态 */
export interface ExploreModeState {
  mode: StoryMode
  currentStory?: UserStoryProgress
  availableStories: string[] // 可用的故事线ID
}

/** 故事触发结果 */
export interface StoryTriggerResult {
  triggered: boolean
  node?: StoryNode
  isNewChapter?: boolean
  chapterTitle?: string
}

/** TTS播放状态 */
export interface TTSPlayState {
  playing: boolean
  currentText: string
  audioUrl?: string
  autoPlay: boolean
}

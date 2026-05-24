import Taro from '@tarojs/taro'
import { api } from './api'

/**
 * 每日打卡统计数据
 */
export interface DailyCheckinStats {
  date: string
  totalCheckins: number
  poiList: Array<{
    id: number
    name: string
    type: string
    checkinTime: number
  }>
  totalSteps: number
  totalDistance: number // 米
  heroBonds: number
  collectedFragments: number
}

/**
 * MVP战报数据
 */
export interface MVPReportData {
  date: string
  dateStr: string
  checkinCount: number
  totalSteps: number
  totalDistance: number
  heroName: string
  heroAvatar: string
  battleCry: string
  highlights: string[]
  isMVP: boolean
}

const CHECK_KEY = 'daily_report_checked'
const STATS_KEY = 'daily_stats'
const HERO_KEY = 'selectedHero'

/**
 * 获取今日打卡统计
 */
export async function getTodayStats(): Promise<DailyCheckinStats> {
  const today = new Date().toISOString().split('T')[0]
  
  // 获取今日打卡记录
  const checkins = Taro.getStorageSync('my_checkins') || []
  const todayCheckins = checkins.filter((c: any) => {
    const checkinDate = new Date(c.time).toISOString().split('T')[0]
    return checkinDate === today
  })
  
  // 获取POI详情
  const poiList = todayCheckins.map((c: any) => ({
    id: c.id,
    name: c.name || `打卡点${c.id}`,
    type: c.type || 'unknown',
    checkinTime: c.time
  }))
  
  // 获取步数（从微信运动或本地记录）
  const totalSteps = await getTodaySteps()
  
  // 估算距离（步数 * 0.7米/步）
  const totalDistance = Math.round(totalSteps * 0.7)
  
  // 获取羁绊碎片收集数量
  const fragments = Taro.getStorageSync('collected_fragments') || '[]'
  const collectedFragments = JSON.parse(fragments).length
  
  return {
    date: today,
    totalCheckins: todayCheckins.length,
    poiList,
    totalSteps,
    totalDistance,
    heroBonds: collectedFragments,
    collectedFragments
  }
}

/**
 * 获取今日步数
 */
async function getTodaySteps(): Promise<number> {
  try {
    // 尝试从微信运动获取
    const { stepInfoList } = await Taro.getWeRunData()
    if (stepInfoList && stepInfoList.length > 0) {
      // 获取今天的步数
      const todayStep = stepInfoList[stepInfoList.length - 1]
      return todayStep.step || 0
    }
  } catch (e) {
    console.log('获取微信运动步数失败', e)
  }
  
  // 降级：从本地存储获取
  const localSteps = Taro.getStorageSync('today_steps') || 0
  return localSteps
}

/**
 * 更新步数（从本地记录或传感器）
 */
export function updateSteps(steps: number) {
  Taro.setStorageSync('today_steps', steps)
}

/**
 * 检查是否需要弹出MVP战报（22:30触发）
 */
export function shouldShowDailyReport(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const today = now.toISOString().split('T')[0]
  
  // 检查是否在22:30-23:59之间
  if (hour < 22 || (hour === 22 && minute < 30)) {
    return false
  }
  
  // 检查今天是否已经显示过
  const checkedDate = Taro.getStorageSync(CHECK_KEY)
  if (checkedDate === today) {
    return false
  }
  
  return true
}

/**
 * 标记今日已显示
 */
export function markReportShown() {
  const today = new Date().toISOString().split('T')[0]
  Taro.setStorageSync(CHECK_KEY, today)
}

/**
 * 生成MVP战报数据
 */
export async function generateMVPReport(stats: DailyCheckinStats): Promise<MVPReportData> {
  const hero = Taro.getStorageSync(HERO_KEY) || '李白'
  const dateStr = formatDate(stats.date)
  
  // 根据数据生成战报内容
  const highlights: string[] = []
  
  if (stats.totalCheckins > 0) {
    highlights.push(`今日打卡${stats.totalCheckins}个地点`)
  }
  
  if (stats.totalSteps > 10000) {
    highlights.push(`行走${(stats.totalSteps / 10000).toFixed(1)}万步，峡谷健将！`)
  } else if (stats.totalSteps > 5000) {
    highlights.push(`行走${stats.totalSteps}步，稳步前行`)
  }
  
  if (stats.totalDistance > 5000) {
    highlights.push(`探索距离${(stats.totalDistance / 1000).toFixed(1)}公里`)
  }
  
  if (stats.collectedFragments > 0) {
    highlights.push(`收集${stats.collectedFragments}个羁绊碎片`)
  }
  
  // 生成战斗口号
  const battleCries = [
    '今日峡谷，留下我的足迹！',
    '每一步都是传奇的积累',
    '探索不止，荣耀不息',
    '今日战绩，载入史册',
    '峡谷寻城，勇者无惧'
  ]
  
  const isMVP = stats.totalCheckins >= 3 || stats.totalSteps >= 10000
  
  return {
    date: stats.date,
    dateStr,
    checkinCount: stats.totalCheckins,
    totalSteps: stats.totalSteps,
    totalDistance: stats.totalDistance,
    heroName: hero,
    heroAvatar: '', // 后续填充
    battleCry: battleCries[Math.floor(Math.random() * battleCries.length)],
    highlights,
    isMVP
  }
}

/**
 * 发送数据给李白智能体（工作流接口）
 * 目前不需要实际调用，预留接口
 */
export async function sendToLiBaiAgent(stats: DailyCheckinStats): Promise<void> {
  // 预留：发送给李白智能体工作流
  // 目前只是记录日志，实际调用待生图效果完善后实现
  console.log('准备发送给李白智能体:', stats)
  
  // TODO: 调用后端工作流接口
  // await api.sendToLiBaiAgent({
  //   stats,
  //   timestamp: Date.now()
  // })
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 周${weekday}`
}

/**
 * 重置检查状态（用于测试）
 */
export function resetReportCheck() {
  Taro.removeStorageSync(CHECK_KEY)
}

/**
 * 版本管理工具
 * 用于处理版本更新时的缓存清理
 */

import Taro from '@tarojs/taro'

// 当前体验版本号 - 每次发布体验版时更新
export const CURRENT_VERSION = '1.1.1'

// 版本存储key
const VERSION_KEY = 'app_current_version'

/**
 * 检查是否需要清理缓存（版本更新时）
 */
export function shouldClearCache(): boolean {
  try {
    const savedVersion = Taro.getStorageSync(VERSION_KEY)
    // 如果没有版本记录，或者是旧版本，需要清理
    return !savedVersion || savedVersion !== CURRENT_VERSION
  } catch {
    return true
  }
}

/**
 * 清理所有本地缓存数据
 */
export function clearAllCache(): void {
  try {
    // 清除所有存储的数据
    const keysToRemove = [
      // 故事相关
      'story_progress',
      'explore_mode',
      'free_mode_welcome_shown',
      
      // 用户数据
      'selectedHero',
      'my_checkins',
      'my_rewards',
      'my_badges',
      'explore_score_base',
      
      // 羁绊碎片
      'collected_fragments',
      'collected_fragments_data',
      'hidden_bookmark_unlocked',
      'bond_cooldowns',
      
      // MVP战报
      'daily_report_checked',
      
      // 临时数据
      'poi_cooldowns',
      'checked_in_pois',
    ]
    
    keysToRemove.forEach(key => {
      Taro.removeStorageSync(key)
    })
    
    console.log('✅ 版本更新：已清理所有缓存数据')
  } catch (e) {
    console.error('清理缓存失败:', e)
  }
}

/**
 * 标记当前版本已初始化
 */
export function markVersionInitialized(): void {
  try {
    Taro.setStorageSync(VERSION_KEY, CURRENT_VERSION)
    console.log('✅ 版本标记:', CURRENT_VERSION)
  } catch (e) {
    console.error('标记版本失败:', e)
  }
}

/**
 * 初始化版本管理（在app.tsx的onLaunch中调用）
 */
export function initVersionManager(): void {
  if (shouldClearCache()) {
    console.log('🔄 检测到版本更新，清理旧缓存...')
    clearAllCache()
    markVersionInitialized()
  } else {
    console.log('✅ 版本一致，无需清理缓存')
  }
}

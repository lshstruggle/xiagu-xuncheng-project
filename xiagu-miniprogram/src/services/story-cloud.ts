/**
 * 故事进度云服务
 * 使用微信云开发数据库存储用户故事进度
 * 优势：多端同步、数据持久、永不丢失
 */

import Taro from '@tarojs/taro'
import type { UserStoryProgress, StoryMode } from '../types/story'
import { getStoryById, getStoryByHero } from './story'

const DB = Taro.cloud.database()
const COLLECTION = 'story_progress'

/**
 * 获取用户唯一ID（openid）
 */
async function getUserId(): Promise<string> {
  const { result } = await Taro.cloud.callFunction({
    name: 'getOpenId'
  })
  return (result as any).openid
}

/**
 * 从云端获取故事进度
 */
export async function getCloudStoryProgress(): Promise<UserStoryProgress | null> {
  try {
    const { data } = await DB.collection(COLLECTION)
      .where({
        _openid: '{openid}' // 自动匹配当前用户
      })
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get()

    if (data && data.length > 0) {
      console.log('☁️ 从云端获取进度:', data[0])
      return data[0] as UserStoryProgress
    }
    return null
  } catch (e) {
    console.error('获取云端进度失败:', e)
    // 降级到本地存储
    return getLocalStoryProgress()
  }
}

/**
 * 保存故事进度到云端
 */
export async function saveCloudStoryProgress(
  progress: UserStoryProgress
): Promise<boolean> {
  try {
    const doc = {
      ...progress,
      updateTime: Date.now(),
      date: new Date().toISOString().split('T')[0]
    }

    // 检查是否已有记录
    const { data } = await DB.collection(COLLECTION)
      .where({ _openid: '{openid}' })
      .limit(1)
      .get()

    if (data && data.length > 0) {
      // 更新现有记录
      await DB.collection(COLLECTION)
        .doc(data[0]._id)
        .update({ data: doc })
      console.log('☁️ 更新云端进度:', doc)
    } else {
      // 创建新记录
      await DB.collection(COLLECTION).add({ data: doc })
      console.log('☁️ 创建云端进度:', doc)
    }

    // 同时备份到本地（双重保险）
    saveLocalStoryProgress(progress)
    return true
  } catch (e) {
    console.error('保存云端进度失败:', e)
    // 降级到本地存储
    saveLocalStoryProgress(progress)
    return false
  }
}

/**
 * 删除云端故事进度（重置剧情）
 */
export async function clearCloudStoryProgress(): Promise<boolean> {
  try {
    const { data } = await DB.collection(COLLECTION)
      .where({ _openid: '{openid}' })
      .get()

    if (data && data.length > 0) {
      await DB.collection(COLLECTION)
        .doc(data[0]._id)
        .remove()
    }

    // 同时清除本地
    clearLocalStoryProgress()
    console.log('☁️ 云端进度已清除')
    return true
  } catch (e) {
    console.error('清除云端进度失败:', e)
    clearLocalStoryProgress()
    return false
  }
}

/**
 * 同步云端和本地进度（取最新）
 */
export async function syncStoryProgress(): Promise<UserStoryProgress | null> {
  try {
    const cloudProgress = await getCloudStoryProgress()
    const localProgress = getLocalStoryProgress()

    if (!cloudProgress && !localProgress) {
      return null
    }

    if (!cloudProgress) {
      // 只有本地有，上传到云端
      console.log('⬆️ 本地进度上传到云端')
      await saveCloudStoryProgress(localProgress!)
      return localProgress
    }

    if (!localProgress) {
      // 只有云端有，下载到本地
      console.log('⬇️ 云端进度下载到本地')
      saveLocalStoryProgress(cloudProgress)
      return cloudProgress
    }

    // 都有，取最新的
    const cloudTime = cloudProgress.lastUpdateTime || 0
    const localTime = localProgress.lastUpdateTime || 0

    if (cloudTime > localTime) {
      console.log('⬇️ 云端进度更新，下载到本地')
      saveLocalStoryProgress(cloudProgress)
      return cloudProgress
    } else if (localTime > cloudTime) {
      console.log('⬆️ 本地进度更新，上传到云端')
      await saveCloudStoryProgress(localProgress)
      return localProgress
    }

    return cloudProgress
  } catch (e) {
    console.error('同步进度失败:', e)
    return getLocalStoryProgress()
  }
}

// ============ 本地存储备用方案 ============

const STORAGE_KEY = 'story_progress_cloud_backup'

function getLocalStoryProgress(): UserStoryProgress | null {
  try {
    return Taro.getStorageSync(STORAGE_KEY) || null
  } catch {
    return null
  }
}

function saveLocalStoryProgress(progress: UserStoryProgress) {
  Taro.setStorageSync(STORAGE_KEY, {
    ...progress,
    lastUpdateTime: Date.now()
  })
}

function clearLocalStoryProgress() {
  Taro.removeStorageSync(STORAGE_KEY)
}

// ============ 云函数调用示例 ============

/**
 * 获取用户所有故事历史
 */
export async function getUserStoryHistory(): Promise<UserStoryProgress[]> {
  try {
    const { data } = await DB.collection(COLLECTION)
      .where({ _openid: '{openid}' })
      .orderBy('updateTime', 'desc')
      .limit(10)
      .get()

    return data as UserStoryProgress[]
  } catch (e) {
    console.error('获取历史失败:', e)
    return []
  }
}

/**
 * 备份当前进度（手动触发）
 */
export async function backupStoryProgress(): Promise<boolean> {
  const local = getLocalStoryProgress()
  if (local) {
    return await saveCloudStoryProgress(local)
  }
  return false
}

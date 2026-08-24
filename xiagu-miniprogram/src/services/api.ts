import Taro from '@tarojs/taro'

// ========== 云存储配置（微信云开发）==========
// 使用微信云存储托管语音文件，无需配置微信域名白名单
// 文件ID格式: cloud://环境ID/路径/文件名
const MEMORY_TTS_CLOUD_URLS: Record<string, string> = {
  'bond_cd_01': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/bond_cd_01.wav',
  'bond_cd_02': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/bond_cd_02.wav',
  'bond_cd_03': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/bond_cd_03.wav',
  'bond_cd_04': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/bond_cd_04.wav',
  'ag_egg_01': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/ag_egg_01.wav',
  'ag_egg_02': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/ag_egg_02.wav',
  'ag_egg_03': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/彩蛋语音文件/ag_egg_03.wav',
}

// API基础URL（云存储模式下主要用于其他API调用）
const BASE_URL = 'https://xiagu-miniprogram-d7dbpz54358b2f-1410097615.ap-shanghai.app.tcloudbase.com/api/v1'

type LoginResult = { token: string; user: any }

export type TTSSegment = {
  index: number
  text: string
  ticket: string
}

export type AIChatResult = {
  reply: string
  audio_base64?: string
  audio_ready: boolean
  mode: string
  tts?: {
    available: boolean
    segments: TTSSegment[]
  }
}

let loginPromise: Promise<LoginResult> | null = null

async function loginWithWechat(): Promise<LoginResult> {
  const loginRes = await Taro.login()
  if (!loginRes.code) {
    throw new Error('微信登录失败')
  }

  const result = await request<LoginResult>(
    '/user/login',
    'POST',
    { code: loginRes.code },
    false,
  )
  Taro.setStorageSync('token', result.token)
  Taro.setStorageSync('user', result.user)
  return result
}

/**
 * Ensure all concurrently-started protected requests wait for the same login.
 * This prevents page useDidShow hooks from racing the initial WeChat login.
 */
export async function ensureLogin(): Promise<LoginResult> {
  const token = Taro.getStorageSync('token')
  if (token) {
    return { token, user: Taro.getStorageSync('user') }
  }

  if (!loginPromise) {
    loginPromise = loginWithWechat().finally(() => {
      loginPromise = null
    })
  }
  return loginPromise
}


// 统一请求方法
async function request<T>(
  url: string, 
  method: 'GET' | 'POST' | 'PUT', 
  data?: any,
  requiresAuth = true,
  retriedAfterLogin = false,
): Promise<T> {
  let token = Taro.getStorageSync('token')
  if (requiresAuth && !token) {
    token = (await ensureLogin()).token
  }

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    header.Authorization = `Bearer ${token}`
  }

  const res = await Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    timeout: 60000,
    header,
  })

  const response = res.data as { code: number; message?: string; data: T }
  const unauthorized = res.statusCode === 401 || response.code === 401
  if (requiresAuth && unauthorized && !retriedAfterLogin) {
    // Do not delete a newer token written by another concurrent retry.
    if (Taro.getStorageSync('token') === token) {
      Taro.removeStorageSync('token')
    }
    await ensureLogin()
    return request<T>(url, method, data, true, true)
  }

  if (response.code !== 0) {
    throw new Error(response.message || '请求失败')
  }

  return response.data
}

// ======== API 方法 ========

export const api = {
  // 登录
  login: (code: string) =>
    request<LoginResult>('/user/login', 'POST', { code }, false),

  // 用户
  getProfile: () =>
    request<any>('/user/profile', 'GET'),

  updateProfile: (data: { nickname: string; avatar: string }) =>
    request<any>('/user/profile', 'PUT', data),

  selectHero: (heroId: string) =>
    request<any>('/user/hero', 'PUT', { hero_id: heroId }),

  // AI对话：文字立即返回；语音片段随后通过受票据保护的接口获取。
  chat: (data: {
    hero_id: string
    message: string
    mode?: string
    city_code?: string
    poi_id?: string
    need_tts?: boolean
  }) =>
    request<AIChatResult>('/ai/chat', 'POST', data),

  getTTSSegment: async (data: { hero_id: string; text: string; ticket: string }) => {
    let token = Taro.getStorageSync('token')
    if (!token) token = (await ensureLogin()).token
    const result = await Taro.request({
      url: `${BASE_URL}/ai/tts/segment`,
      method: 'POST',
      data,
      // A cache miss may include queued GPU inference; keep this above the
      // CloudBase TTS gateway timeout instead of cancelling at 20 seconds.
      timeout: 90000,
      responseType: 'arraybuffer',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (result.statusCode !== 200) {
      throw new Error('语音服务暂时不可用')
    }
    return result.data as ArrayBuffer
  },

  // POI
  getPOIList: (cityCode: string) =>
    request<any[]>(`/poi/list?city_code=${cityCode}`, 'GET'),

  getNearbyPOI: (lat: number, lng: number, cityCode: string) =>
    request<any[]>(`/poi/nearby?lat=${lat}&lng=${lng}&city_code=${cityCode}`, 'GET'),

  getPOIDetail: (id: string) =>
    request<any>(`/poi/${id}`, 'GET'),

  // 路线
  getRoutes: (cityCode: string) =>
    request<any[]>(`/route/list?city_code=${cityCode}`, 'GET'),

  // 打卡
  checkin: (data: {
    poi_id: string
    hero_id: string
    user_lat: number
    user_lng: number
  }) =>
    request<{
      success: boolean
      rewards: any[]
      bond_value_gained: number
      spirit_badge_id?: string
      bond_bookmark_id?: string
      fragments?: {
        hero_fragments: number
        skin_fragments: number
        is_first_time: boolean
      }
      ai_trigger?: {
        mode: string
        narration: string
        easter_egg?: any
      }
      message: string
    }>('/checkin', 'POST', data),

  // 回忆模式语音（彩蛋预生成语音）
  getMemoryTTSList: () =>
    request<{
      total: number
      items: Array<{
        id: string
        name: string
        type: string
        text_preview: string
        cached: boolean
      }>
    }>('/memory-tts', 'GET'),

  getMemoryTTSById: (id: string) =>
    request<{
      id: string
      name: string
      type: string
      text_preview: string
      cached: boolean
    }>(`/memory-tts/${id}`, 'GET'),

  // 获取回忆模式语音播放URL（直接返回音频文件URL）
  // 优先使用云存储URL，如果没有则回退到本地服务器
  getMemoryTTSUrl: (id: string) => {
    // 优先使用云存储URL
    if (MEMORY_TTS_CLOUD_URLS[id]) {
      return MEMORY_TTS_CLOUD_URLS[id]
    }
    // 回退到本地服务器
    return `${BASE_URL}/memory-tts/${id}/audio`
  },
  
  // 获取所有已配置的云存储URL
  getMemoryTTSCloudUrls: () => MEMORY_TTS_CLOUD_URLS,
  
  // 检查是否使用云存储
  isUsingCloudStorage: (id: string) => !!MEMORY_TTS_CLOUD_URLS[id],

  // ===== 用户资产 =====
  getUserAssets: () =>
    request<{ hero_fragments: number; skin_fragments: number }>('/user/assets', 'GET'),

  // ===== 商城 =====
  getShopItems: () =>
    request<Array<{
      id: string
      name: string
      type: 'hero' | 'skin'
      cost: number
      img_url: string
      is_owned: boolean
    }>>('/shop/items', 'GET'),

  exchangeItem: (itemId: string) =>
    request<{ success: boolean; hero_fragments?: number; skin_fragments?: number }>('/shop/exchange', 'POST', { item_id: itemId }),

  // ===== 羁绊系统 =====
  getHeroBonds: () =>
    request<Array<{
      id: string
      name: string
      avatar: string
      bond_value: number
      bond_level: number
    }>>('/bond/heroes', 'GET'),

  // ===== 周边订单 =====
  submitMerchOrder: (data: {
    hero_id: string
    name: string
    phone: string
    address: string
  }) =>
    request<{ success: boolean; order_id: string }>('/merch/order', 'POST', data),
}

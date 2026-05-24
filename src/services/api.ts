import Taro from '@tarojs/taro'

// 开发环境配置
// 微信开发者工具模拟器用 localhost
// const BASE_URL = 'http://localhost:8080/api/v1'
// 真机调试用局域网 IP（确保手机和电脑同一 WiFi）
// const BASE_URL = 'http://192.168.31.177:8080/api/v1'
// 体验版/真机调试用 ngrok
// const BASE_URL = 'https://preceptively-unushered-elvira.ngrok-free.dev/api/v1'

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
const BASE_URL = 'http://localhost:8080/api/v1'

// 调试模式：设置一个测试token（开发时使用）
const DEBUG_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjI3Yjc0YjY1ZTU4ZDYzNDcwMDAwMDAxIiwiZXhwIjoxODg4ODg4ODg4fQ.test_token_for_debug'

// 统一请求方法
async function request<T>(
  url: string, 
  method: 'GET' | 'POST' | 'PUT', 
  data?: any
): Promise<T> {
  // 优先使用存储的token，否则使用调试token（开发模式）
  const token = Taro.getStorageSync('token') || DEBUG_TOKEN

  const res = await Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  if (res.data.code !== 0) {
    throw new Error(res.data.message || '请求失败')
  }

  return res.data.data
}

// ======== API 方法 ========

export const api = {
  // 登录
  login: (code: string) =>
    request<{ token: string; user: any }>('/user/login', 'POST', { code }),

  // 用户
  getProfile: () =>
    request<any>('/user/profile', 'GET'),

  selectHero: (heroId: string) =>
    request<any>('/user/hero', 'PUT', { hero_id: heroId }),

  // AI对话（核心：文本+语音一起返回）
  chat: (data: {
    hero_id: string
    message: string
    mode?: string
    city_code?: string
    poi_id?: string
    need_tts?: boolean
  }) =>
    request<{
      reply: string
      audio_base64?: string
      audio_ready: boolean
      mode: string
    }>('/ai/chat', 'POST', data),

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

  // TTS单独接口（如果需要独立调用）
  tts: (text: string) =>
    new Promise<ArrayBuffer>((resolve, reject) => {
      Taro.request({
        url: `${BASE_URL}/tts`,
        method: 'POST',
        data: { text },
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`,
        },
        responseType: 'arraybuffer',
        success: (res) => resolve(res.data as ArrayBuffer),
        fail: (err) => reject(err),
      })
    }),

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

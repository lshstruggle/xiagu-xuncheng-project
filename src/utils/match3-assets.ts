/**
 * 王者消消乐 - 云存储 UI 资源接口
 *
 * 将图片上传到云存储对应路径后，只需修改下方 File ID 即可替换样式。
 * 瓦片默认复用地图 UI 图标；也可改为 消消乐ui/ 目录下的专属素材。
 */

import Taro from '@tarojs/taro'
import { mapIconFileIDs, getCachedImageByFileID } from './cloud-assets'

const CLOUD_PREFIX =
  'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615'

/** 6 种消除元素（索引 0-5 对应棋盘格子类型） */
export const MATCH3_TILE_KEYS = [
  'redBuff',
  'blueBuff',
  'tower',
  'spirit',
  'club',
  'arena',
] as const

export type Match3TileKey = (typeof MATCH3_TILE_KEYS)[number]

/** 元素展示名（无图时的备用标签） */
export const MATCH3_TILE_LABELS: Record<Match3TileKey, string> = {
  redBuff: '红Buff',
  blueBuff: '蓝Buff',
  tower: '防御塔',
  spirit: '泉水',
  club: 'AG',
  arena: '场馆',
}

/** 元素备用色（云图未加载时显示） */
export const MATCH3_TILE_COLORS: Record<Match3TileKey, string> = {
  redBuff: '#E53935',
  blueBuff: '#1E88E5',
  tower: '#8D6E63',
  spirit: '#26A69A',
  club: '#F5C518',
  arena: '#AB47BC',
}

/**
 * 消除元素图片 File ID
 * 替换方式：上传新图到云存储，把对应 key 的值改成新 File ID
 */
export const match3TileFileIDs: Record<Match3TileKey, string> = {
  redBuff: mapIconFileIDs.redBuff,
  blueBuff: mapIconFileIDs.blueBuff,
  tower: mapIconFileIDs.tower,
  spirit: mapIconFileIDs.spiritLighthouse,
  club: mapIconFileIDs.club,
  arena: mapIconFileIDs.arena,
}

/**
 * 游戏界面 UI 图片 File ID（可整体替换主题）
 * 路径约定：云存储根目录 /消消乐ui/
 */
export const match3UiFileIDs = {
  /** 棋盘背景 */
  boardBg: `${CLOUD_PREFIX}/消消乐ui/棋盘背景.png`,
  /** 顶栏背景 */
  headerBg: `${CLOUD_PREFIX}/消消乐ui/顶栏背景.png`,
  /** 格子选中高亮框 */
  tileSelected: `${CLOUD_PREFIX}/消消乐ui/选中框.png`,
  /** 重新开始按钮 */
  btnRestart: `${CLOUD_PREFIX}/消消乐ui/按钮_重新开始.png`,
  /** 提示按钮 */
  btnHint: `${CLOUD_PREFIX}/消消乐ui/按钮_提示.png`,
  /** 分数图标 */
  scoreIcon: `${CLOUD_PREFIX}/消消乐ui/分数图标.png`,
  /** 连击特效底图 */
  comboBg: `${CLOUD_PREFIX}/消消乐ui/连击底图.png`,
  /** 游戏结束弹窗背景 */
  modalBg: `${CLOUD_PREFIX}/消消乐ui/弹窗背景.png`,
} as const

export type Match3UiKey = keyof typeof match3UiFileIDs

const PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const urlCache = new Map<string, string>()

async function fetchTempUrl(fileID: string): Promise<string | null> {
  if (urlCache.has(fileID)) return urlCache.get(fileID)!
  try {
    const res = await Taro.cloud.getTempFileURL({ fileList: [fileID] })
    const url = res.fileList?.[0]?.tempFileURL
    if (url) {
      urlCache.set(fileID, url)
      return url
    }
  } catch (e) {
    console.warn('[match3] 获取临时链接失败:', fileID, e)
  }
  return null
}

/** 瓦片索引 → 云存储 key */
export function tileIndexToKey(index: number): Match3TileKey {
  return MATCH3_TILE_KEYS[Math.max(0, Math.min(index, MATCH3_TILE_KEYS.length - 1))]
}

/** 获取单个消除元素图片 URL */
export async function getMatch3TileUrl(tileIndex: number): Promise<string> {
  const key = tileIndexToKey(tileIndex)
  const fileID = match3TileFileIDs[key]
  const cached = getCachedImageByFileID(fileID) || urlCache.get(fileID)
  if (cached) return cached
  return (await fetchTempUrl(fileID)) || PLACEHOLDER
}

/** 同步获取（已预加载时） */
export function getMatch3TileUrlSync(tileIndex: number): string {
  const fileID = match3TileFileIDs[tileIndexToKey(tileIndex)]
  return getCachedImageByFileID(fileID) || urlCache.get(fileID) || PLACEHOLDER
}

/** 获取界面 UI 图片 URL */
export async function getMatch3UiUrl(uiKey: Match3UiKey): Promise<string> {
  const fileID = match3UiFileIDs[uiKey]
  const cached = urlCache.get(fileID)
  if (cached) return cached
  return (await fetchTempUrl(fileID)) || PLACEHOLDER
}

export function getMatch3UiUrlSync(uiKey: Match3UiKey): string {
  return urlCache.get(match3UiFileIDs[uiKey]) || PLACEHOLDER
}

/** 带超时的云存储请求，避免不存在文件导致长时间挂起 */
function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('cloud timeout')), ms)
    ),
  ])
}

async function fetchFileList(fileIDs: string[]): Promise<void> {
  if (!fileIDs.length) return
  if (!Taro.cloud || typeof Taro.cloud.getTempFileURL !== 'function') return
  const res = await withTimeout(
    Taro.cloud.getTempFileURL({ fileList: fileIDs })
  )
  res.fileList?.forEach((item, i) => {
    if (item.tempFileURL) urlCache.set(fileIDs[i], item.tempFileURL)
  })
}

/** 预加载消消乐资源（瓦片优先，UI 可选） */
export async function preloadMatch3Assets(): Promise<{
  tiles: Record<Match3TileKey, string>
  ui: Partial<Record<Match3UiKey, string>>
}> {
  const tileIDs = Object.values(match3TileFileIDs)
  const uiIDs = Object.values(match3UiFileIDs)

  // 先加载已存在的地图图标（瓦片），保证棋盘有图
  try {
    await fetchFileList(tileIDs)
  } catch (e) {
    console.warn('[match3] 瓦片预加载失败，使用彩色占位', e)
  }

  // UI 素材可能尚未上传，单独请求且失败不影响游戏
  try {
    await fetchFileList(uiIDs)
  } catch (e) {
    console.warn('[match3] UI 素材未就绪（可上传至云存储 消消乐ui/ 目录）', e)
  }

  const tiles = {} as Record<Match3TileKey, string>
  MATCH3_TILE_KEYS.forEach((key) => {
    tiles[key] = urlCache.get(match3TileFileIDs[key]) || PLACEHOLDER
  })

  const ui: Partial<Record<Match3UiKey, string>> = {}
  ;(Object.keys(match3UiFileIDs) as Match3UiKey[]).forEach((key) => {
    const url = urlCache.get(match3UiFileIDs[key])
    if (url && !url.startsWith('data:')) ui[key] = url
  })

  return { tiles, ui }
}

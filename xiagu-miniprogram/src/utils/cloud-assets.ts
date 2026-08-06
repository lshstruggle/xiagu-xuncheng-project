/**
 * 云存储资源管理 - 纯云存储方案
 * 
 * 云存储环境ID: xiagu-miniprogram-d7dbpz54358b2f
 * 使用完整 File ID 获取临时链接
 */

import Taro from '@tarojs/taro';

// 英雄头像云存储 File ID
export const heroAvatarFileIDs: Record<string, string> = {
  '李白': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/李白.png',
  '杨玉环': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/杨玉环.png',
  '嬴政': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/嬴政.png',
  '武则天': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/武则天.png',
  '诸葛亮': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/诸葛亮.png',
  '貂蝉': 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/英雄头像/貂蝉.png',
}

// 地图图标云存储 File ID
export const mapIconFileIDs = {
  redBuff: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/红buff.png',
  blueBuff: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/蓝buff.png',
  tower: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/防御塔.png',
  spiritLighthouse: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/泉水 (1).png',
  club: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/AG超玩会队标.png',
  arena: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/比赛场馆 (1).png',
}

// 桌宠 GIF 云存储 File ID
export const petFileIDs: Record<string, string> = {
  idle: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/pet/idle.gif',
  thinking: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/pet/thinking.gif',
  dragging: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/pet/dragging.gif',
  clicked: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/pet/clicked.gif',
}

// AG电竞相关图片云存储 File ID
export const agEsportsFileIDs = {
  teamPhoto: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/ag超玩会选手.jpg',
  cat: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/cat.jpg',
  yinuo: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/一诺.jpg',
  mengLeiLaoShuai: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/梦泪老帅.png',
  fengHuangShanChampion: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/凤凰山夺冠ag.jpg',
  fengHuangShanArena: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/凤凰山夺冠ag.jpg',
}

// 成都景点图片云存储 File ID
export const chengduSceneFileIDs = {
  chunxiRoad: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/春熙路.jpg',
}

// 底部工具栏图标云存储 File ID
export const bottomIconFileIDs = {
  medal: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/4f801fd6fd8a252a83075be0cb83c668-removebg-preview.png',
  backpack: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/8ed6a95ed620e6a6af2672429076efbe-removebg-preview.png',
}

// 链接有效期：2小时
const MAX_AGE = 7200;

// 缓存已获取的临时链接
const imageUrlCache: Map<string, string> = new Map()

// 占位图 base64（1x1 透明像素，用于初始显示）
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/**
 * 通过 File ID 获取临时链接
 * @param fileID 完整的云存储 File ID
 * @returns Promise<string | null> 临时链接
 */
const getTempUrlByFileID = async (fileID: string): Promise<string | null> => {
  try {
    const res = await Taro.cloud.getTempFileURL({
      fileList: [fileID]
    });
    if (res.fileList && res.fileList[0]) {
      return res.fileList[0].tempFileURL;
    }
  } catch (error) {
    console.error('获取临时链接失败:', fileID, error);
  }
  return null;
}

/**
 * 批量通过 File ID 获取临时链接
 * @param fileIDs 完整的云存储 File ID 数组
 * @returns Promise<Record<string, string>> 文件ID到临时链接的映射
 */
const batchGetTempUrlByFileIDs = async (fileIDs: string[]): Promise<Record<string, string>> => {
  if (!fileIDs || fileIDs.length === 0) return {};
  
  const results: Record<string, string> = {};
  
  try {
    const res = await Taro.cloud.getTempFileURL({
      fileList: fileIDs
    });
    
    if (res.fileList) {
      res.fileList.forEach((item: any, index: number) => {
        if (item.tempFileURL) {
          results[fileIDs[index]] = item.tempFileURL;
        }
      });
    }
  } catch (error) {
    console.error('批量获取临时链接失败:', error);
  }
  
  return results;
}

/**
 * 获取英雄头像（异步获取临时链接）
 * @param heroName 英雄名称
 * @returns Promise<string> 图片URL
 */
export const getHeroAvatar = async (heroName: string): Promise<string> => {
  const fileID = heroAvatarFileIDs[heroName]
  if (!fileID) return PLACEHOLDER_IMAGE
  
  // 检查缓存
  if (imageUrlCache.has(fileID)) {
    return imageUrlCache.get(fileID)!
  }
  
  // 获取临时链接
  const url = await getTempUrlByFileID(fileID)
  if (url) {
    imageUrlCache.set(fileID, url)
    return url
  }
  
  return PLACEHOLDER_IMAGE
}

/**
 * 同步获取英雄头像（返回占位图，后台获取临时链接）
 * @param heroName 英雄名称
 * @returns string 占位图
 */
export const getHeroAvatarSync = (heroName: string): string => {
  const fileID = heroAvatarFileIDs[heroName]
  // 后台获取临时链接
  if (fileID && !imageUrlCache.has(fileID)) {
    getTempUrlByFileID(fileID).then(url => {
      if (url) imageUrlCache.set(fileID, url)
    })
  }
  // 尝试返回缓存的链接，否则返回占位图
  return imageUrlCache.get(fileID) || PLACEHOLDER_IMAGE
}

/**
 * 获取地图图标（异步）- 用于非地图组件
 */
export const getMapIcon = async (type: keyof typeof mapIconFileIDs): Promise<string> => {
  const fileID = mapIconFileIDs[type]
  if (!fileID) return PLACEHOLDER_IMAGE
  
  if (imageUrlCache.has(fileID)) {
    return imageUrlCache.get(fileID)!
  }
  
  const url = await getTempUrlByFileID(fileID)
  if (url) {
    imageUrlCache.set(fileID, url)
    return url
  }
  
  return PLACEHOLDER_IMAGE
}

/**
 * 同步获取地图图标 - 用于非地图组件
 */
export const getMapIconSync = (type: keyof typeof mapIconFileIDs): string => {
  const fileID = mapIconFileIDs[type]
  if (fileID && !imageUrlCache.has(fileID)) {
    getTempUrlByFileID(fileID).then(url => {
      if (url) imageUrlCache.set(fileID, url)
    })
  }
  return imageUrlCache.get(fileID) || PLACEHOLDER_IMAGE
}

/**
 * 获取底部工具栏图标（异步）
 */
export const getBottomIcon = async (type: keyof typeof bottomIconFileIDs): Promise<string> => {
  const fileID = bottomIconFileIDs[type]
  if (!fileID) return PLACEHOLDER_IMAGE
  
  if (imageUrlCache.has(fileID)) {
    return imageUrlCache.get(fileID)!
  }
  
  const url = await getTempUrlByFileID(fileID)
  if (url) {
    imageUrlCache.set(fileID, url)
    return url
  }
  
  return PLACEHOLDER_IMAGE
}

/**
 * 同步获取底部工具栏图标
 */
export const getBottomIconSync = (type: keyof typeof bottomIconFileIDs): string => {
  const fileID = bottomIconFileIDs[type]
  if (fileID && !imageUrlCache.has(fileID)) {
    getTempUrlByFileID(fileID).then(url => {
      if (url) imageUrlCache.set(fileID, url)
    })
  }
  return imageUrlCache.get(fileID) || PLACEHOLDER_IMAGE
}

/**
 * 获取桌宠图片（异步）
 * @param state 桌宠状态：idle / thinking / dragging / clicked
 * @returns Promise<string> 图片URL
 */
export const getPetImage = async (state: string): Promise<string> => {
  const fileID = petFileIDs[state]
  if (!fileID) return PLACEHOLDER_IMAGE

  if (imageUrlCache.has(fileID)) {
    return imageUrlCache.get(fileID)!
  }

  const url = await getTempUrlByFileID(fileID)
  if (url) {
    imageUrlCache.set(fileID, url)
    return url
  }

  return PLACEHOLDER_IMAGE
}

/**
 * 同步获取桌宠图片（返回占位图，后台获取临时链接）
 * @param state 桌宠状态
 */
export const getPetImageSync = (state: string): string => {
  const fileID = petFileIDs[state]
  if (fileID && !imageUrlCache.has(fileID)) {
    getTempUrlByFileID(fileID).then(url => {
      if (url) imageUrlCache.set(fileID, url)
    })
  }
  return imageUrlCache.get(fileID) || PLACEHOLDER_IMAGE
}

/**
 * 预加载桌宠所有GIF图片
 */
export const preloadPetImages = async () => {
  const fileIDs = Object.values(petFileIDs)
  const results = await batchGetTempUrlByFileIDs(fileIDs)
  Object.entries(results).forEach(([fileID, url]) => {
    imageUrlCache.set(fileID, url)
  })
  return results
}

/**
 * 预加载所有云存储图片
 */
export const preloadAllCloudImages = async () => {
  const allFileIDs = [
    ...Object.values(heroAvatarFileIDs),
    ...Object.values(mapIconFileIDs),
    ...Object.values(bottomIconFileIDs),
    ...Object.values(petFileIDs),
  ]

  const results = await batchGetTempUrlByFileIDs(allFileIDs)
  Object.entries(results).forEach(([fileID, url]) => {
    imageUrlCache.set(fileID, url)
  })

  return results
}

/**
 * 从缓存获取图片（用于需要重新渲染时）
 * @param fileID 完整的 File ID
 */
export const getCachedImageByFileID = (fileID: string): string | null => {
  return imageUrlCache.get(fileID) || null
}

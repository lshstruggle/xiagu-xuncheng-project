/**
 * 云存储临时链接缓存管理
 */

import Taro from '@tarojs/taro';

// 缓存对象
const tempUrlCache = new Map();

// 默认链接有效期：1.5小时（90分钟）
const DEFAULT_MAX_AGE = 90 * 60;

// 刷新阈值：距离过期还有5分钟时重新获取
const REFRESH_THRESHOLD = 5 * 60 * 1000;

// 云存储文件配置
export const CLOUD_FILES = {
  kuanzhai: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/宽窄巷子.jpg',
  jinli: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/锦里古街.jpg',
  wuhou: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/武侯寺.jpg',
  chunxi: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/春熙路.jpg',
  chengduCover: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/成都双子塔.jpg',
  agVideo: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/比赛视频/ag超玩会.mp4',
  phoenixVideo: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/比赛视频/凤凰山体育公园夺冠视频.mp4',
  treasureMapBg: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/藏宝图背景.jpg'
};

// 检查缓存是否有效
const isCacheValid = (fileKey) => {
  const cached = tempUrlCache.get(fileKey);
  if (!cached) return false;
  const now = Date.now();
  return cached.expireTime > now + REFRESH_THRESHOLD;
};

// 批量获取临时链接（带缓存）
export const getTempFileURLs = async (fileKeys) => {
  const results = {};
  const needFetch = [];
  
  fileKeys.forEach(key => {
    if (isCacheValid(key)) {
      results[key] = tempUrlCache.get(key).url;
    } else {
      needFetch.push(CLOUD_FILES[key]);
    }
  });
  
  if (needFetch.length > 0) {
    try {
      const res = await Taro.cloud.getTempFileURL({
        fileList: needFetch.map(fileID => ({ fileID, maxAge: DEFAULT_MAX_AGE }))
      });
      
      if (res.errMsg === 'cloud.getTempFileURL:ok' && res.fileList) {
        const now = Date.now();
        
        res.fileList.forEach((item, index) => {
          const key = fileKeys.find(k => CLOUD_FILES[k] === needFetch[index]);
          if (key) {
            results[key] = item.tempFileURL;
            tempUrlCache.set(key, {
              url: item.tempFileURL,
              expireTime: now + DEFAULT_MAX_AGE * 1000
            });
          }
        });
      }
    } catch (error) {
      console.error('获取临时链接失败:', error);
    }
  }
  
  return results;
};

// 获取单个文件的临时链接（带缓存）- 支持key或完整云路径
export const getTempFileURL = async (fileKeyOrPath: string): Promise<string | null> => {
  // 如果是完整云路径（以 cloud:// 开头）
  if (fileKeyOrPath.startsWith('cloud://')) {
    try {
      const res = await Taro.cloud.getTempFileURL({
        fileList: [{ fileID: fileKeyOrPath, maxAge: DEFAULT_MAX_AGE }]
      });
      if (res.errMsg === 'cloud.getTempFileURL:ok' && res.fileList && res.fileList[0]) {
        return res.fileList[0].tempFileURL;
      }
    } catch (error) {
      console.error('获取临时链接失败:', error);
    }
    return null;
  }
  
  // 否则当作key处理
  const results = await getTempFileURLs([fileKeyOrPath]);
  return results[fileKeyOrPath] || null;
};

// 预加载所有常用资源
export const preloadAllTempURLs = async () => {
  const allKeys = Object.keys(CLOUD_FILES);
  await getTempFileURLs(allKeys);
};

// 清空缓存
export const clearTempURLCache = () => {
  tempUrlCache.clear();
};

// 获取缓存状态（调试用）
export const getCacheStatus = () => {
  const now = Date.now();
  const status = {};
  
  tempUrlCache.forEach((item, key) => {
    status[key] = {
      valid: isCacheValid(key),
      expireIn: Math.floor((item.expireTime - now) / 1000)
    };
  });
  
  return status;
};

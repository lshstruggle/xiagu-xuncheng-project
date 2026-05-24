/**
 * 云存储工具函数
 * 用于获取云存储文件的临时访问链接
 */

import Taro from '@tarojs/taro';

// 云存储基础URL
const CLOUD_STORAGE_BASE = 'https://7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615.tcb.qcloud.la';

// 云环境ID
const CLOUD_ENV_ID = 'xiagu-miniprogram-d7dbpz54358b2f';

// 缓存的临时链接
interface CacheItem {
  url: string;
  expireTime: number;
}
const tempUrlCache: Map<string, CacheItem> = new Map();

/**
 * 使用云开发API动态获取临时链接
 * 需要在已经初始化云开发的环境中调用
 * @param fileList 云存储文件路径数组（如：['图片素材/宽窄巷子.jpg']）
 * @param maxAge 链接有效期（秒），默认24小时
 * @returns Promise<{filePath: string, tempFileURL: string}[]>
 */
export const fetchTempFileURLs = async (
  fileList: string[],
  maxAge: number = 86400
): Promise<{ filePath: string; tempFileURL: string }[]> => {
  if (!fileList || fileList.length === 0) {
    return [];
  }

  try {
    // 构造 fileID（需要完整的云存储路径格式）
    const fileIDList = fileList.map((path) => ({
      fileID: `cloud://${CLOUD_ENV_ID}.7869-${CLOUD_ENV_ID}-1410097615/${path}`,
      maxAge,
    }));

    // 调用云开发API获取临时链接
    const result = await Taro.cloud.getTempFileURL({
      fileList: fileIDList,
    });

    if (result.errMsg === 'cloud.getTempFileURL:ok') {
      return result.fileList.map((f: any, index: number) => ({
        filePath: fileList[index],
        tempFileURL: f.tempFileURL,
      }));
    }

    console.warn('获取临时链接返回异常:', result);
    return [];
  } catch (error) {
    console.error('获取临时链接失败:', error);
    return [];
  }
};

/**
 * 获取单个文件的临时链接（带缓存）
 * @param filePath 云存储文件路径，如：图片素材/宽窄巷子.jpg
 * @param maxAge 链接有效期（秒），默认24小时
 * @returns Promise<string | null>
 */
export const getTempFileURL = async (
  filePath: string,
  maxAge: number = 86400
): Promise<string | null> => {
  // 检查缓存是否有效（提前1小时过期，避免使用中失效）
  const cached = tempUrlCache.get(filePath);
  const now = Date.now();
  if (cached && cached.expireTime > now + 3600000) {
    return cached.url;
  }

  // 获取新链接
  const results = await fetchTempFileURLs([filePath], maxAge);
  if (results.length > 0 && results[0].tempFileURL) {
    // 存入缓存
    tempUrlCache.set(filePath, {
      url: results[0].tempFileURL,
      expireTime: now + maxAge * 1000,
    });
    return results[0].tempFileURL;
  }

  return null;
};

/**
 * 批量获取临时链接并更新映射表
 * @param filePaths 文件路径数组
 * @returns Promise<Record<string, string>>
 */
export const batchGetTempURLs = async (
  filePaths: string[]
): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};

  // 找出未缓存或即将过期的链接
  const now = Date.now();
  const needFetch = filePaths.filter((path) => {
    const cached = tempUrlCache.get(path);
    return !cached || cached.expireTime <= now + 3600000;
  });

  // 如果有需要获取的，批量请求
  if (needFetch.length > 0) {
    const fetched = await fetchTempFileURLs(needFetch);
    fetched.forEach((item) => {
      tempUrlCache.set(item.filePath, {
        url: item.tempFileURL,
        expireTime: now + 86400 * 1000,
      });
    });
  }

  // 返回所有链接
  filePaths.forEach((path) => {
    const cached = tempUrlCache.get(path);
    if (cached) {
      results[path] = cached.url;
    }
  });

  return results;
};

/**
 * 预定义的临时链接映射表（备用方案）
 * 当API调用失败时，可以手动在这里填入临时链接
 */
export const TEMP_URL_MAP: Record<string, string> = {
  // 宽窄巷子 - 测试链接
  '图片素材/宽窄巷子.jpg':
    'https://7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615.tcb.qcloud.la/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%AE%BD%E7%AA%84%E5%B7%B7%E5%AD%90.jpg',
  // 其他图片可以继续添加...
};

/**
 * 从映射表获取临时链接（同步方法）
 * @param filePath 文件路径
 * @returns 临时链接或空字符串
 */
export const getTempUrlFromMap = (filePath: string): string => {
  return TEMP_URL_MAP[filePath] || '';
};

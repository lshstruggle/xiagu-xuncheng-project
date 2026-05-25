/**
 * 安全震动反馈：Windows 开发者工具不支持 vibrateShort，直接调用会在控制台报 [object Object]
 */
import Taro from '@tarojs/taro'

type VibrateType = 'light' | 'medium' | 'heavy'

let isDevtools: boolean | null = null

function isDevToolsEnv(): boolean {
  if (isDevtools !== null) return isDevtools
  try {
    isDevtools = Taro.getSystemInfoSync().platform === 'devtools'
  } catch {
    isDevtools = false
  }
  return isDevtools
}

/** 真机震动；模拟器/devtools 静默跳过 */
export function safeVibrateShort(type: VibrateType = 'light'): void {
  if (isDevToolsEnv()) return

  try {
    Taro.vibrateShort({
      type,
      fail: () => {
        // 部分机型/环境不支持，忽略即可
      },
    })
  } catch {
    // ignore
  }
}

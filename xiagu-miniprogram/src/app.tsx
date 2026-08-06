import { PropsWithChildren, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { initVersionManager, CURRENT_VERSION } from './utils/version-manager'
import './app.scss'

/** 尽早初始化云开发，避免 Tab 页 useEffect 早于 App 调用 cloud API */
try {
  if (Taro.cloud && typeof Taro.cloud.init === 'function') {
    Taro.cloud.init({
      env: 'xiagu-miniprogram-d7dbpz54358b2f',
      traceUser: true,
    })
  }
} catch (e) {
  const msg = (e as { errMsg?: string; message?: string })?.errMsg
    || (e as Error)?.message
    || 'unknown'
  console.warn('[app] 云开发初始化跳过:', msg)
}

function App({ children }: PropsWithChildren<any>) {
  useEffect(() => {
    initVersionManager()
    console.log('🚀 小程序启动 - 版本:', CURRENT_VERSION)
  }, [])

  return children
}

export default App

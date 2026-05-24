import { PropsWithChildren, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { initVersionManager, CURRENT_VERSION } from './utils/version-manager'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useEffect(() => {
    // 初始化云开发
Taro.cloud.init({
  env: 'xiagu-miniprogram-d7dbpz54358b2f',
  traceUser: true
})
    
    // 版本管理：清理旧版本缓存
    initVersionManager()
    
    console.log('🚀 小程序启动 - 版本:', CURRENT_VERSION)
  }, [])

  return children
}

export default App

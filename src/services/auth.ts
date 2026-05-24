import Taro from '@tarojs/taro'
import { api } from './api'

export async function doLogin(): Promise<boolean> {
  try {
    // 1. 微信登录获取code
    const loginRes = await Taro.login()
    if (!loginRes.code) {
      console.error('微信登录失败')
      return false
    }

    // 2. 用code换取token
    const result = await api.login(loginRes.code)

    // 3. 保存token
    Taro.setStorageSync('token', result.token)
    Taro.setStorageSync('user', result.user)

    console.log('登录成功', result.user)
    return true
  } catch (error) {
    console.error('登录失败', error)
    return false
  }
}

export function getToken(): string {
  return Taro.getStorageSync('token') || ''
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function getUser(): any {
  return Taro.getStorageSync('user')
}

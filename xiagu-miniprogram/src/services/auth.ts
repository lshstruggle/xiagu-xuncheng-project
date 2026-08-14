import Taro from '@tarojs/taro'
import { ensureLogin } from './api'

export async function doLogin(): Promise<boolean> {
  try {
    const result = await ensureLogin()

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

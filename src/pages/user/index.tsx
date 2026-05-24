import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import { getUser, isLoggedIn, doLogin } from '../../services/auth'
import { api } from '../../services/api'
import { getTempFileURL } from '../../utils/temp-url-cache'

const HERO_FRAG_CLOUD = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/英雄碎片.png'
const SKIN_FRAG_CLOUD = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷/皮肤碎片.png'

export default function User() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [userStats, setUserStats] = useState({
    cities: 0,
    checkins: 0,
    badges: 0
  })
  const [assets, setAssets] = useState({ heroFragments: 0, skinFragments: 0 })
  const [fragIcons, setFragIcons] = useState({ hero: '', skin: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
    loadFragIcons()
  }, [])

  Taro.useDidShow(() => {
    loadAssets()
  })

  const loadFragIcons = async () => {
    try {
      const [heroUrl, skinUrl] = await Promise.all([
        getTempFileURL(HERO_FRAG_CLOUD),
        getTempFileURL(SKIN_FRAG_CLOUD)
      ])
      setFragIcons({ hero: heroUrl || '', skin: skinUrl || '' })
    } catch (err) {
      console.error('加载碎片图标失败', err)
    }
  }

  const loadAssets = async () => {
    try {
      const data = await api.getUserAssets()
      const mapped = {
        heroFragments: data.hero_fragments || 0,
        skinFragments: data.skin_fragments || 0,
      }
      setAssets(mapped)
      Taro.setStorageSync('user_assets', mapped)
    } catch (err) {
      const cached = Taro.getStorageSync('user_assets') || { heroFragments: 0, skinFragments: 0 }
      setAssets(cached)
    }
  }

  const loadUserData = async () => {
    setLoading(true)

    if (!isLoggedIn()) {
      const success = await doLogin()
      if (!success) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        setLoading(false)
        return
      }
    }

    const user = getUser()
    setUserInfo(user)
    loadAssets()

    try {
      const profile = await api.getProfile()
      if (profile) {
        setUserStats({
          cities: profile.explored_cities?.length || 1,
          checkins: profile.total_checkins || 0,
          badges: profile.badges?.length || 0
        })
      }
    } catch (error) {
      const checkins = Taro.getStorageSync('my_checkins') || []
      setUserStats({
        cities: 1,
        checkins: checkins.length,
        badges: 0
      })
    }

    setLoading(false)
  }

  const getAvatarUrl = () => {
    if (userInfo?.avatar_url) {
      return userInfo.avatar_url
    }
    const heroId = userInfo?.selected_hero || 'li_bai'
    const heroAvatarMap: Record<string, string> = {
      'li_bai': 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/131/131.jpg',
      'diao_chan': 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/141/141.jpg',
      'zhu_ge_liang': 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/190/190.jpg'
    }
    return heroAvatarMap[heroId] || heroAvatarMap['li_bai']
  }

  const getNickname = () => {
    return userInfo?.nickname || '召唤师'
  }

  const getLevelText = () => {
    const checkins = userStats.checkins
    if (checkins >= 50) return 'Lv.50 城市探索者'
    if (checkins >= 30) return 'Lv.30 峡谷行者'
    if (checkins >= 10) return 'Lv.10 初出茅庐'
    return 'Lv.1 新手召唤师'
  }

  const handleNav = (route: string) => {
    if (route === 'achievements' || route === 'records') {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: `/pages/${route}/index` })
  }

  if (loading) {
    return (
      <View className='user-page'>
        <View className='loading'>加载中...</View>
      </View>
    )
  }

  return (
    <ScrollView className='user-page' scrollY>
      {/* 1. 头部用户信息区（头像昵称上下居中） */}
      <View className='profile-header'>
        <View className='avatar-large'>
          <Image className='avatar-img' src={getAvatarUrl()} mode='aspectFill' />
        </View>
        <Text className='username'>{getNickname()}</Text>
        <Text className='user-level'>{getLevelText()}</Text>

        {/* 核心资产展示栏 */}
        <View className='asset-bar'>
          <View className='asset-item'>
            {fragIcons.hero ? (
              <Image className='asset-icon' src={fragIcons.hero} mode='aspectFit' />
            ) : (
              <Text className='asset-icon-emoji'>⚔️</Text>
            )}
            <Text className='asset-count'>{assets.heroFragments}</Text>
          </View>
          <View className='asset-divider'></View>
          <View className='asset-item'>
            {fragIcons.skin ? (
              <Image className='asset-icon' src={fragIcons.skin} mode='aspectFit' />
            ) : (
              <Text className='asset-icon-emoji'>👗</Text>
            )}
            <Text className='asset-count'>{assets.skinFragments}</Text>
          </View>
        </View>
      </View>

      {/* 2. 核心功能菜单区 */}
      <View className='menu-list'>
        <View className='menu-item' onClick={() => handleNav('backpack')}>
          <Text className='menu-icon'>🎒</Text>
          <Text className='menu-text'>我的背包</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => handleNav('achievements')}>
          <Text className='menu-icon'>🏆</Text>
          <Text className='menu-text'>成就系统</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => handleNav('records')}>
          <Text className='menu-icon'>📜</Text>
          <Text className='menu-text'>探索记录</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => handleNav('shop')}>
          <Text className='menu-icon'>🛒</Text>
          <Text className='menu-text'>星元商城</Text>
          <Text className='menu-tag'>New</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => handleNav('bond-system')}>
          <Text className='menu-icon'>✨</Text>
          <Text className='menu-text'>羁绊养成</Text>
          <Text className='menu-tag'>New</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      {/* 底部安全间距 */}
      <View className='safe-bottom'></View>
    </ScrollView>
  )
}

import { Button, Image, Input, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { api } from '../../services/api'
import './index.scss'

interface UserProfileModalProps {
  user: any
  forceVisible?: boolean
  onSaved?: (user: any) => void
  onClose?: () => void
}

const DEFAULT_NICKNAME = '召唤师'

export default function UserProfileModal({
  user,
  forceVisible = false,
  onSaved,
  onClose,
}: UserProfileModalProps) {
  const [visible, setVisible] = useState(false)
  const [nickname, setNickname] = useState('')
  const [avatarPath, setAvatarPath] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const currentNickname = user.nickname || ''
    const currentAvatar = user.avatar || ''
    setNickname(currentNickname === DEFAULT_NICKNAME ? '' : currentNickname)
    setAvatarPath(currentAvatar)
    setVisible(
      forceVisible
      || !currentAvatar
      || !currentNickname
      || currentNickname === DEFAULT_NICKNAME,
    )
  }, [forceVisible, user?.id, user?.nickname, user?.avatar])

  const closeModal = () => {
    setVisible(false)
    onClose?.()
  }

  const handleChooseAvatar = (event: any) => {
    const selectedPath = event?.detail?.avatarUrl || ''
    if (selectedPath) setAvatarPath(selectedPath)
  }

  const uploadAvatar = async (localPath: string): Promise<string> => {
    if (localPath.startsWith('cloud://')) return localPath
    if (!Taro.cloud || typeof Taro.cloud.uploadFile !== 'function') {
      throw new Error('云存储暂不可用')
    }

    const extension = localPath.match(/\.(png|jpe?g|webp)(?:\?|$)/i)?.[1] || 'jpg'
    const result = await Taro.cloud.uploadFile({
      cloudPath: `user-avatars/${user.id}/avatar-${Date.now()}.${extension}`,
      filePath: localPath,
    })
    if (!result.fileID) throw new Error('头像上传失败')
    return result.fileID
  }

  const handleSave = async () => {
    const trimmedNickname = nickname.trim()
    if (!avatarPath) {
      Taro.showToast({ title: '请先选择微信头像', icon: 'none' })
      return
    }
    if (!trimmedNickname) {
      Taro.showToast({ title: '请填写微信昵称', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const avatar = await uploadAvatar(avatarPath)
      const updatedUser = await api.updateProfile({
        nickname: trimmedNickname,
        avatar,
      })
      Taro.setStorageSync('user', updatedUser)
      onSaved?.(updatedUser)
      closeModal()
      Taro.showToast({ title: '资料保存成功', icon: 'success' })
    } catch (error) {
      const message = (error as { errMsg?: string; message?: string })?.errMsg
        || (error as Error)?.message
        || '资料保存失败'
      console.error('保存微信资料失败', error)
      Taro.showToast({ title: message, icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <View className='user-profile-mask'>
      <View className='user-profile-dialog'>
        <View className='user-profile-glow' />
        <View className='user-profile-emblem'>✦</View>
        <Text className='user-profile-eyebrow'>XIAGU PROFILE</Text>
        <Text className='user-profile-title'>创建召唤师档案</Text>
        <Text className='user-profile-desc'>让李白记住与你并肩寻城的模样</Text>

        <View className='user-profile-avatar-area'>
          <View className='user-profile-avatar-ring'>
            <Button
              className='user-profile-avatar-button'
              openType='chooseAvatar'
              onChooseAvatar={handleChooseAvatar}
            >
              {avatarPath ? (
                <Image className='user-profile-avatar' src={avatarPath} mode='aspectFill' />
              ) : (
                <View className='user-profile-avatar-placeholder'>
                  <Text className='user-profile-avatar-plus'>＋</Text>
                </View>
              )}
            </Button>
          </View>
          <Text className='user-profile-avatar-hint'>点击选择微信头像</Text>
        </View>

        <View className='user-profile-field'>
          <Text className='user-profile-field-label'>召唤师名称</Text>
          <Input
            className='user-profile-nickname'
            type='nickname'
            value={nickname}
            maxlength={20}
            placeholder='填写微信昵称'
            placeholderClass='user-profile-placeholder'
            onInput={(event) => setNickname(event.detail.value)}
          />
        </View>

        <Text className='user-profile-privacy'>头像与昵称仅用于展示你的寻城档案</Text>

        <Button
          className='user-profile-save'
          loading={saving}
          disabled={saving}
          onClick={handleSave}
        >
          确认进入峡谷
        </Button>
        <Button className='user-profile-later' onClick={closeModal}>
          暂用默认身份
        </Button>
      </View>
    </View>
  )
}

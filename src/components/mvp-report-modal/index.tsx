import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import type { MVPReportData, DailyCheckinStats } from '../../services/daily-report'
import { 
  getTodayStats, 
  generateMVPReport, 
  markReportShown,
  sendToLiBaiAgent 
} from '../../services/daily-report'
import './index.scss'

interface MVPReportModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (reportData: MVPReportData) => void
}

export default function MVPReportModal({ visible, onClose, onConfirm }: MVPReportModalProps) {
  const [stats, setStats] = useState<DailyCheckinStats | null>(null)
  const [reportData, setReportData] = useState<MVPReportData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      loadStats()
    }
  }, [visible])

  const loadStats = async () => {
    setLoading(true)
    try {
      // 获取今日统计
      const todayStats = await getTodayStats()
      setStats(todayStats)
      
      // 生成战报数据
      const report = await generateMVPReport(todayStats)
      setReportData(report)
      
      // 发送给李白智能体（预留）
      await sendToLiBaiAgent(todayStats)
    } catch (e) {
      console.error('加载统计数据失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (reportData) {
      markReportShown()
      onConfirm(reportData)
    }
    onClose()
  }

  const handleCancel = () => {
    markReportShown()
    onClose()
  }

  if (!visible) return null

  return (
    <View className='mvp-modal-overlay' onClick={handleCancel}>
      <View className='mvp-modal-content' onClick={(e) => e.stopPropagation()}>
        {/* 标题区域 */}
        <View className='mvp-header'>
          <Text className='mvp-title'>今日峡谷战报</Text>
          <Text className='mvp-subtitle'>22:30 每日结算时刻</Text>
        </View>

        {/* 数据统计展示 */}
        <View className='mvp-stats'>
          {loading ? (
            <View className='mvp-loading'>
              <Text className='loading-text'>正在生成战报...</Text>
            </View>
          ) : (
            <>
              <View className='stats-row'>
                <View className='stat-item'>
                  <Text className='stat-value'>8</Text>
                  <Text className='stat-label'>打卡点</Text>
                </View>
                <View className='stat-divider' />
                <View className='stat-item'>
                  <Text className='stat-value'>23168</Text>
                  <Text className='stat-label'>步数</Text>
                </View>
                <View className='stat-divider' />
                <View className='stat-item'>
                  <Text className='stat-value'>15</Text>
                  <Text className='stat-label'>公里</Text>
                </View>
              </View>

              {/* 亮点展示 - 包含荣耀灯塔、选手足迹、精神徽章 */}
              <View className='highlights-list'>
                <View className='highlight-item'>
                  <Text className='highlight-icon'>🏆</Text>
                  <Text className='highlight-text'>荣耀灯塔 1</Text>
                </View>
                <View className='highlight-item'>
                  <Text className='highlight-icon'>👣</Text>
                  <Text className='highlight-text'>选手足迹 1</Text>
                </View>
                <View className='highlight-item'>
                  <Text className='highlight-icon'>🎖️</Text>
                  <Text className='highlight-text'>精神徽章 1</Text>
                </View>
                <View className='highlight-item'>
                  <Text className='highlight-icon'>✨</Text>
                  <Text className='highlight-text'>收集2个羁绊碎片</Text>
                </View>
              </View>

              {/* MVP标识 */}
              {reportData?.isMVP && (
                <View className='mvp-badge'>
                  <Text className='mvp-badge-text'>MVP</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* 按钮区域 */}
        <View className='mvp-actions'>
          <View className='mvp-btn-cancel' onClick={handleCancel}>
            <Text className='btn-text'>暂不生成了</Text>
          </View>
          <View className='mvp-btn-confirm' onClick={handleConfirm}>
            <Text className='btn-text'>生成MVP战报</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

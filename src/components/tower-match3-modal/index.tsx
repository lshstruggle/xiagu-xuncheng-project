import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import Match3Compact from '../match3-compact'

interface TowerMatch3ModalProps {
  poiId: string | number
  poiName: string
  onSuccess: () => void
  onFail: () => void
  onClose: () => void
}

const MAX_HP = 100
const TARGET_SCORE = 1000

export default function TowerMatch3Modal({ poiId, poiName, onSuccess, onFail, onClose }: TowerMatch3ModalProps) {
  const [currentHp, setCurrentHp] = useState(MAX_HP)
  const [showResult, setShowResult] = useState(false)
  const [isPassed, setIsPassed] = useState(false)

  const hpPercent = Math.max(0, (currentHp / MAX_HP) * 100)

  const handleScoreChange = useCallback((gained: number) => {
    const damage = Math.max(1, Math.round((gained / TARGET_SCORE) * MAX_HP))
    setCurrentHp(prev => Math.max(0, prev - damage))
  }, [])

  const handleVictory = useCallback(() => {
    setCurrentHp(0)
    setIsPassed(true)
    setShowResult(true)
  }, [])

  const handleGameOver = useCallback(() => {
    setIsPassed(false)
    setShowResult(true)
  }, [])

  const handleResultAction = () => {
    if (isPassed) {
      onSuccess()
    } else {
      // 记录冷却时间（3分钟）
      const cooldownEnd = Date.now() + 3 * 60 * 1000
      const cooldowns = Taro.getStorageSync('tower_cooldowns') || {}
      cooldowns[String(poiId)] = cooldownEnd
      Taro.setStorageSync('tower_cooldowns', cooldowns)
      onFail()
    }
  }

  return (
    <View className='quiz-overlay'>
      {!showResult && (
        <View className='tower-hp-bar-wrap'>
          <View className='tower-hp-header'>
            <Text className='tower-hp-name'>{poiName}防御塔</Text>
            <Text className='tower-hp-value'>{currentHp} / {MAX_HP}</Text>
          </View>
          <View className='tower-hp-track'>
            <View className='tower-hp-fill' style={{ width: `${hpPercent}%` }} />
          </View>
        </View>
      )}

      <View className='quiz-card'>
        {/* 关闭按钮 */}
        <View className='quiz-close' onClick={onClose}>
          <Text>✕</Text>
        </View>

        {!showResult ? (
          <>
            <View className='match3-intro'>
              <Text className='match3-intro-title'>🎮 推塔挑战</Text>
              <Text className='match3-intro-desc'>消除得分，积满{TARGET_SCORE}分即可摧毁防御塔！</Text>
            </View>
            <View className='match3-game-area'>
              <Match3Compact
                key={`tower-${poiId}`}
                targetScore={TARGET_SCORE}
                onScoreChange={handleScoreChange}
                onVictory={handleVictory}
                onGameOver={handleGameOver}
              />
            </View>
          </>
        ) : (
          <>
            {/* 结果页 */}
            <View className={`quiz-result-header ${isPassed ? 'pass' : 'fail'}`}>
              <Text className='quiz-result-title'>
                {isPassed ? '推塔成功！' : '推塔失败！'}
              </Text>
              <Text className='quiz-result-subtitle'>
                {isPassed
                  ? '防御塔已摧毁，打卡完成！'
                  : '防御塔仍在坚守，请3分钟后再次挑战。'}
              </Text>
            </View>

            {!isPassed && (
              <View className='quiz-result-score'>
                <Text className='quiz-score-num'>{Math.max(0, MAX_HP - currentHp)}</Text>
                <Text className='quiz-score-total'>/{MAX_HP}</Text>
                <Text className='quiz-score-label'>已造成伤害</Text>
              </View>
            )}

            <View className='quiz-result-btn' onClick={handleResultAction}>
              <Text>{isPassed ? '确认' : '我知道了'}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

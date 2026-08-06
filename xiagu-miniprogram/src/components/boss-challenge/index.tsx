import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import type { BossConfig } from '../../config/bosses'
import { getTempFileURL } from '../../utils/temp-url-cache'
import { TOWER_QUIZ_BANK } from '../../data/tower-quiz'
import Match3Compact from '../match3-compact'

interface BossChallengeProps {
  boss: BossConfig
  onClose: () => void
  onVictory: (rewards: BossConfig['rewards']) => void
}

type ChallengeMode = 'quiz' | 'minigame'

export default function BossChallenge({ boss, onClose, onVictory }: BossChallengeProps) {
  const [attackGifUrl, setAttackGifUrl] = useState('')
  const [mode, setMode] = useState<ChallengeMode>('quiz')
  const [currentHp, setCurrentHp] = useState(boss.maxHp)
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isVictory, setIsVictory] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // 在组件挂载时将题库随机打乱，避免每次题目顺序一致
  const [questions] = useState(() => {
    // 复制一份题库避免污染原数据
    const shuffledBank = [...TOWER_QUIZ_BANK]
    // Fisher-Yates 洗牌算法随机打乱
    for (let i = shuffledBank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledBank[i], shuffledBank[j]] = [shuffledBank[j], shuffledBank[i]];
    }
    return shuffledBank.map(q => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex
    }))
  })

  const currentQuestion = questions[quizIndex % questions.length]

  useEffect(() => {
    getTempFileURL(boss.attackGif).then(url => {
      if (url) setAttackGifUrl(url)
    })
  }, [boss])

  const handleAnswer = useCallback((optionIndex: number) => {
    if (showFeedback) return
    const correct = optionIndex === currentQuestion.correctIndex
    setSelectedOption(optionIndex)
    setIsCorrect(correct)
    setShowFeedback(true)

    if (correct) {
      const newHp = Math.max(0, currentHp - boss.damagePerHit)
      setTimeout(() => {
        setCurrentHp(newHp)
        if (newHp <= 0) {
          setTimeout(() => {
            setIsVictory(true)
            setShowResult(true)
          }, 800)
        } else {
          setTimeout(() => {
            setShowFeedback(false)
            setSelectedOption(null)
            setQuizIndex(prev => prev + 1)
          }, 1000)
        }
      }, 600)
    } else {
      setTimeout(() => {
        setShowFeedback(false)
        setSelectedOption(null)
        setQuizIndex(prev => prev + 1)
      }, 1200)
    }
  }, [currentHp, boss.damagePerHit, currentQuestion, showFeedback])

  const handleCloseResult = () => {
    if (isVictory) {
      onVictory(boss.rewards)
    }
    onClose()
  }

  const handleMinigameScoreChange = useCallback((gained: number) => {
    const damage = Math.max(1, Math.round((gained / 1000) * boss.maxHp))
    setCurrentHp(prev => {
      const newHp = Math.max(0, prev - damage)
      return newHp
    })
  }, [boss.maxHp])

  const handleMinigameVictory = useCallback(() => {
    setCurrentHp(0)
    setTimeout(() => {
      setIsVictory(true)
      setShowResult(true)
    }, 600)
  }, [])

  const handleMinigameGameOver = useCallback(() => {
    setTimeout(() => {
      setIsVictory(false)
      setShowResult(true)
    }, 600)
  }, [])

  const hpPercent = Math.max(0, (currentHp / boss.maxHp) * 100)

  return (
    <View className='boss-challenge-overlay'>
      {/* 关闭按钮 */}
      <View className='challenge-close' onClick={onClose}>
        <Text>✕</Text>
      </View>

      {/* 血条 */}
      <View className='boss-hp-bar-wrap'>
        <View className='boss-hp-header'>
          <Text className='boss-hp-name'>{boss.title}</Text>
          <Text className='boss-hp-value'>{currentHp} / {boss.maxHp}</Text>
        </View>
        <View className='boss-hp-track'>
          <View className='boss-hp-fill' style={{ width: `${hpPercent}%` }} />
        </View>
      </View>

      {/* Boss GIF */}
      <View className='boss-arena'>
        {attackGifUrl && (
          <Image className='boss-gif' src={attackGifUrl} mode='aspectFit' />
        )}
      </View>

      {/* 模式切换 */}
      <View className='mode-tabs'>
        <View
          className={`mode-tab ${mode === 'quiz' ? 'active' : ''}`}
          onClick={() => setMode('quiz')}
        >
          <Text>知识问答</Text>
        </View>
        <View
          className={`mode-tab ${mode === 'minigame' ? 'active' : ''}`}
          onClick={() => setMode('minigame')}
        >
          <Text>小游戏</Text>
        </View>
      </View>

      {/* 挑战内容 */}
      <View className='challenge-content'>
        {mode === 'quiz' ? (
          <View className='quiz-panel'>
            <Text className='quiz-question'>{currentQuestion.question}</Text>
            <View className='quiz-options'>
              {currentQuestion.options.map((opt, idx) => (
                <View
                  key={idx}
                  className={`quiz-option ${
                    showFeedback && idx === currentQuestion.correctIndex ? 'correct' : ''
                  } ${showFeedback && selectedOption === idx && !isCorrect ? 'wrong' : ''}`}
                  onClick={() => handleAnswer(idx)}
                >
                  <Text>{String.fromCharCode(65 + idx)}. {opt}</Text>
                </View>
              ))}
            </View>
            {showFeedback && (
              <Text className='quiz-result-text'>
                {isCorrect ? '✅ 命中！Boss受到重创！' : '❌ 未命中，请继续攻击！'}
              </Text>
            )}
          </View>
        ) : (
          <View className='minigame-panel'>
            <Match3Compact
              key={`mg-${boss.id}`}
              targetScore={1000}
              onScoreChange={handleMinigameScoreChange}
              onVictory={handleMinigameVictory}
              onGameOver={handleMinigameGameOver}
            />
          </View>
        )}
      </View>

      {/* 结果动画 / 弹窗 */}
      {showResult && (
        <View className='challenge-result-overlay' onClick={handleCloseResult}>
          {isVictory ? (
            <Image 
              className='victory-gif-anim' 
              src='cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/gif动图/胜利ui.gif' 
              mode='aspectFit' 
            />
          ) : (
            <View className='result-card' onClick={e => e.stopPropagation()}>
              <Text className='result-title defeat'>💀 挑战失败</Text>
              <Text className='result-desc'>{boss.title}逃回了深渊，下次再来挑战吧。</Text>
              <View className='result-btn' onClick={handleCloseResult}>
                <Text>返回地图</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

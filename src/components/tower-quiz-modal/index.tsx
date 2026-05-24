import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import { TOWER_QUIZ_BANK } from '../../data/tower-quiz'

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface TowerQuizModalProps {
  poiId: string | number
  poiName: string
  onSuccess: () => void
  onFail: () => void
  onClose: () => void
}

// 随机抽取 n 道题
function pickQuestions(bank: any[], count: number): QuizQuestion[] {
  const shuffled = [...bank].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((q, idx) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }))
}

export default function TowerQuizModal({ poiId, poiName, onSuccess, onFail, onClose }: TowerQuizModalProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isWrong, setIsWrong] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setQuestions(pickQuestions(TOWER_QUIZ_BANK, 5))
  }, [])

  const currentQuestion = questions[currentIdx]
  const total = questions.length

  const handleSelect = (optionIdx: number) => {
    if (isAnimating || selectedOption !== null) return
    setIsAnimating(true)
    setSelectedOption(optionIdx)

    const isCorrect = optionIdx === currentQuestion.correctIndex
    if (!isCorrect) {
      setIsWrong(true)
    }

    const newAnswers = [...answers, optionIdx]
    setAnswers(newAnswers)

    // 延迟后进入下一题或结果页
    setTimeout(() => {
      if (currentIdx < total - 1) {
        setCurrentIdx(prev => prev + 1)
        setSelectedOption(null)
        setIsWrong(false)
        setIsAnimating(false)
      } else {
        setShowResult(true)
        setIsAnimating(false)
      }
    }, 1200)
  }

  const correctCount = answers.filter((ans, idx) => ans === questions[idx]?.correctIndex).length
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const isPassed = accuracy >= 80

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

  if (!currentQuestion && !showResult) {
    return (
      <View className='quiz-overlay'>
        <View className='quiz-card'>
          <Text className='quiz-loading'>题目加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='quiz-overlay'>
      <View className='quiz-card'>
        {/* 关闭按钮 */}
        <View className='quiz-close' onClick={onClose}>
          <Text>✕</Text>
        </View>

        {!showResult ? (
          <>
            {/* 进度条 */}
            <View className='quiz-progress-bar'>
              <View
                className='quiz-progress-fill'
                style={{ width: `${((currentIdx + (selectedOption !== null ? 1 : 0)) / total) * 100}%` }}
              />
            </View>
            <Text className='quiz-progress-text'>{currentIdx + 1} / {total}</Text>

            {/* 题目 */}
            <Text className='quiz-question'>{currentQuestion.question}</Text>

            {/* 选项 */}
            <View className='quiz-options'>
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx
                const isCorrect = idx === currentQuestion.correctIndex
                let optClass = 'quiz-option'
                if (selectedOption !== null) {
                  if (isCorrect) optClass += ' correct'
                  else if (isSelected) optClass += ' wrong'
                  else optClass += ' dimmed'
                } else if (isSelected) {
                  optClass += ' selected'
                }

                return (
                  <View
                    key={idx}
                    className={optClass}
                    onClick={() => handleSelect(idx)}
                  >
                    <Text className='quiz-option-label'>{String.fromCharCode(65 + idx)}</Text>
                    <Text className='quiz-option-text'>{opt}</Text>
                    {selectedOption !== null && isCorrect && (
                      <Text className='quiz-option-mark'>✓</Text>
                    )}
                    {selectedOption !== null && isSelected && !isCorrect && (
                      <Text className='quiz-option-mark'>✗</Text>
                    )}
                  </View>
                )
              })}
            </View>

            {/* 答错提示 */}
            {isWrong && (
              <View className='quiz-wrong-hint'>
                <Text>答错了！</Text>
              </View>
            )}
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

            <View className='quiz-result-score'>
              <Text className='quiz-score-num'>{correctCount}</Text>
              <Text className='quiz-score-total'>/{total}</Text>
              <Text className='quiz-score-label'>正确率 {accuracy}%</Text>
            </View>

            {/* 错题回顾 */}
            {!isPassed && (
              <View className='quiz-review-list'>
                <Text className='quiz-review-title'>错题回顾</Text>
                {questions.map((q, idx) => {
                  const isCorrect = answers[idx] === q.correctIndex
                  if (isCorrect) return null
                  return (
                    <View key={idx} className='quiz-review-item'>
                      <Text className='quiz-review-q'>{idx + 1}. {q.question}</Text>
                      <Text className='quiz-review-a'>正确答案：{q.options[q.correctIndex]}</Text>
                      <Text className='quiz-review-hint'>💡 {q.explanation}</Text>
                    </View>
                  )
                })}
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

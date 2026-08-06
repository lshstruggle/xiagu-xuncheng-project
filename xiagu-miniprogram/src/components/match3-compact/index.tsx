import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect, useCallback, useRef } from 'react'
import Taro from '@tarojs/taro'
import {
  MATCH3_TILE_KEYS,
  MATCH3_TILE_COLORS,
  MATCH3_TILE_LABELS,
  preloadMatch3Assets,
  type Match3TileKey,
} from '../../utils/match3-assets'
import {
  GRID_SIZE,
  INITIAL_MOVES,
  SCORE_PER_TILE,
  createGrid,
  findMatches,
  clearMatches,
  computeGravityMoves,
  applyGravity,
  fillEmptyWithSpawns,
  attemptSwap,
  hasValidMove,
  shuffleGrid,
  findHint,
  isAdjacent,
  type Grid,
  type Position,
  type GravityMove,
  type SpawnTile,
} from '../../utils/match3-engine'
import { buildClearEffects, type ClearEffects } from '../../utils/match3-effects'
import { safeVibrateShort } from '../../utils/safe-vibrate'
import './index.scss'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const DRAG_THRESHOLD_PX = 24

const EMPTY_EFFECTS: ClearEffects = {
  rings: [],
  particles: [],
  popups: [],
  stars: [],
  showFlash: false,
  shakeBoard: false,
}

interface DragState {
  row: number
  col: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

interface Match3CompactProps {
  targetScore?: number
  initialMoves?: number
  onScoreChange?: (gained: number, total: number) => void
  onVictory?: () => void
  onGameOver?: () => void
}

export default function Match3Compact({
  targetScore = 1000,
  initialMoves = INITIAL_MOVES,
  onScoreChange,
  onVictory,
  onGameOver,
}: Match3CompactProps) {
  const [displayGrid, setDisplayGrid] = useState<Grid>(() => createGrid())
  const [score, setScore] = useState(0)
  const [movesLeft, setMovesLeft] = useState(initialMoves)
  const [hintCells, setHintCells] = useState<Position[]>([])
  const [comboText, setComboText] = useState('')
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [busy, setBusy] = useState(false)
  const [tileUrls, setTileUrls] = useState<Record<Match3TileKey, string>>(
    {} as Record<Match3TileKey, string>
  )
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set())
  const [fallMoves, setFallMoves] = useState<GravityMove[] | null>(null)
  const [fallDropping, setFallDropping] = useState(false)
  const [spawnTiles, setSpawnTiles] = useState<SpawnTile[] | null>(null)
  const [spawnDropping, setSpawnDropping] = useState(false)
  const [swapAnim, setSwapAnim] = useState<{
    a: Position
    b: Position
    grid: Grid
    revert: boolean
  } | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [clearFx, setClearFx] = useState<ClearEffects>(EMPTY_EFFECTS)
  const [scorePulse, setScorePulse] = useState(false)

  const gridRef = useRef(displayGrid)
  const busyRef = useRef(false)
  const fxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    preloadMatch3Assets()
      .then(({ tiles }) => setTileUrls(tiles))
      .catch(() => {})
  }, [])

  useEffect(() => {
    gridRef.current = displayGrid
  }, [displayGrid])

  useEffect(() => {
    busyRef.current = busy
  }, [busy])

  useEffect(() => {
    return () => {
      if (fxTimerRef.current) clearTimeout(fxTimerRef.current)
    }
  }, [])

  const triggerClearFx = useCallback((matched: Set<string>, grid: Grid, combo: number) => {
    if (fxTimerRef.current) clearTimeout(fxTimerRef.current)
    const fx = buildClearEffects(matched, grid, combo, SCALE)
    setClearFx(fx)
    setScorePulse(true)
    setTimeout(() => setScorePulse(false), 400)
    fxTimerRef.current = setTimeout(() => {
      setClearFx(EMPTY_EFFECTS)
      fxTimerRef.current = null
    }, 650)
  }, [])

  const showCombo = useCallback((steps: number) => {
    if (steps <= 1) return
    setComboText(`${steps} 连击!`)
    setTimeout(() => setComboText(''), 1200)
  }, [])

  const checkEnd = useCallback(
    (newScore: number, newMoves: number) => {
      if (newScore >= targetScore) {
        setStatus('won')
        safeVibrateShort('heavy')
        onVictory?.()
        return
      }
      if (newMoves <= 0) {
        setStatus('lost')
        onGameOver?.()
      }
    },
    [targetScore, onVictory, onGameOver]
  )

  const playMatchSequence = useCallback(
    async (startGrid: Grid, movesAfterSwap: number) => {
      let current = startGrid
      let combo = 1
      let totalGained = 0
      let cascadeSteps = 0

      while (true) {
        const matched = findMatches(current)
        if (matched.size === 0) break

        cascadeSteps++
        totalGained += matched.size * SCORE_PER_TILE * combo

        triggerClearFx(matched, current, combo)
        if (matched.size >= 5) safeVibrateShort('medium')
        else safeVibrateShort('light')

        setClearingCells(new Set(matched))
        await delay(300)
        setClearingCells(new Set())

        combo++

        const cleared = clearMatches(current, matched)
        setDisplayGrid(cleared)
        gridRef.current = cleared
        await delay(40)

        const moves = computeGravityMoves(cleared)
        if (moves.length > 0) {
          setFallDropping(false)
          setFallMoves(moves)
          await delay(32)
          setFallDropping(true)
          await delay(300)
          setFallMoves(null)
          setFallDropping(false)
        }

        const afterGravity = applyGravity(cleared)
        setDisplayGrid(afterGravity)
        gridRef.current = afterGravity
        await delay(40)

        const { grid: filled, spawns } = fillEmptyWithSpawns(afterGravity)
        if (spawns.length > 0) {
          setSpawnDropping(false)
          setSpawnTiles(spawns)
          await delay(32)
          setSpawnDropping(true)
          await delay(320)
          setSpawnTiles(null)
          setSpawnDropping(false)
        }

        current = filled
        setDisplayGrid(filled)
        gridRef.current = filled
        await delay(60)
      }

      if (cascadeSteps > 0) {
        showCombo(cascadeSteps)
        safeVibrateShort('light')
      }

      setScore((s) => {
        const next = s + totalGained
        checkEnd(next, movesAfterSwap)
        if (onScoreChange && totalGained > 0) {
          onScoreChange(totalGained, next)
        }
        return next
      })

      if (!hasValidMove(current)) {
        const shuffled = shuffleGrid(current)
        setDisplayGrid(shuffled)
        gridRef.current = shuffled
        Taro.showToast({ title: '已重新排列', icon: 'none', duration: 1200 })
      }
    },
    [checkEnd, onScoreChange, triggerClearFx, showCombo]
  )

  const runPlayerMove = useCallback(
    async (a: Position, b: Position) => {
      if (busyRef.current || status !== 'playing') return

      setBusy(true)
      busyRef.current = true
      setHintCells([])

      const original = gridRef.current.map((row) => [...row])
      const { ok, grid: swapped } = attemptSwap(original, a, b)

      setSwapAnim({ a, b, grid: swapped, revert: false })
      await delay(140)

      if (!ok) {
        await delay(80)
        setSwapAnim(null)
        setBusy(false)
        busyRef.current = false
        return
      }

      setSwapAnim(null)
      setDisplayGrid(swapped)
      gridRef.current = swapped

      const newMoves = movesLeft - 1
      setMovesLeft(newMoves)

      await playMatchSequence(swapped, newMoves)

      setBusy(false)
      busyRef.current = false
    },
    [status, movesLeft, playMatchSequence]
  )

  const getDragTarget = (d: DragState): Position | null => {
    const { row, col, offsetX, offsetY } = d
    if (
      Math.abs(offsetX) < DRAG_THRESHOLD_PX &&
      Math.abs(offsetY) < DRAG_THRESHOLD_PX
    ) {
      return null
    }
    if (Math.abs(offsetX) >= Math.abs(offsetY)) {
      if (offsetX > 0 && col + 1 < GRID_SIZE) return { row, col: col + 1 }
      if (offsetX < 0 && col - 1 >= 0) return { row, col: col - 1 }
    } else {
      if (offsetY > 0 && row + 1 < GRID_SIZE) return { row: row + 1, col }
      if (offsetY < 0 && row - 1 >= 0) return { row: row - 1, col }
    }
    return null
  }

  const onCellTouchStart = (row: number, col: number, e: any) => {
    if (busyRef.current || status !== 'playing' || swapAnim) return
    const touch = e.touches?.[0]
    if (!touch) return
    setDrag({
      row,
      col,
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: 0,
      offsetY: 0,
    })
  }

  const onCellTouchMove = (e: any) => {
    if (!drag) return
    const touch = e.touches?.[0]
    if (!touch) return
    setDrag({
      ...drag,
      offsetX: touch.clientX - drag.startX,
      offsetY: touch.clientY - drag.startY,
    })
  }

  const onCellTouchEnd = async () => {
    if (!drag) return
    const from: Position = { row: drag.row, col: drag.col }
    const target = getDragTarget(drag)
    setDrag(null)
    if (target && isAdjacent(from, target)) {
      await runPlayerMove(from, target)
    }
  }

  const handleRestart = () => {
    setDisplayGrid(createGrid())
    gridRef.current = createGrid()
    setScore(0)
    setMovesLeft(initialMoves)
    setHintCells([])
    setComboText('')
    setStatus('playing')
    setBusy(false)
    busyRef.current = false
    setClearingCells(new Set())
    setFallMoves(null)
    setFallDropping(false)
    setSpawnTiles(null)
    setSpawnDropping(false)
    setSwapAnim(null)
    setDrag(null)
    setClearFx(EMPTY_EFFECTS)
    setScorePulse(false)
    if (fxTimerRef.current) clearTimeout(fxTimerRef.current)
  }

  const handleHint = () => {
    if (busyRef.current || status !== 'playing') return
    const hint = findHint(gridRef.current)
    if (!hint) {
      Taro.showToast({ title: '没有可消除的组合，正在洗牌…', icon: 'none' })
      const shuffled = shuffleGrid(gridRef.current)
      setDisplayGrid(shuffled)
      gridRef.current = shuffled
      return
    }
    setHintCells(hint)
    setTimeout(() => setHintCells([]), 2000)
  }

  const gridForRender = swapAnim ? swapAnim.grid : displayGrid

  // 紧凑版尺寸：原尺寸乘以 0.82 比例（棋盘更大）
  const SCALE = 0.82
  const cSize = Math.round(76 * SCALE)
  const cGap = Math.round(6 * SCALE)
  const cPad = Math.round(12 * SCALE)
  const cStep = cSize + cGap

  const cLeft = (col: number) => cPad + col * cStep
  const cTop = (row: number) => cPad + row * cStep

  const resolveCell = (r: number, c: number) => {
    const key = `${r},${c}`
    let type: number | null = null
    let transform = ''
    let transition = 'transform 0.28s ease-out, opacity 0.22s ease-out'
    let opacity = 1
    let zIndex = 1
    let hidden = false

    if (drag && drag.row === r && drag.col === c) {
      type = gridForRender[r][c]
      if (type < 0) hidden = true
      else {
        transform = `translate(${drag.offsetX}px, ${drag.offsetY}px) scale(1.08)`
        zIndex = 20
        transition = 'none'
      }
      return { type, transform, transition, opacity, zIndex, hidden, clearing: false }
    }

    if (swapAnim) {
      const { a, b } = swapAnim
      if (r === a.row && c === a.col) {
        type = swapAnim.grid[a.row][a.col]
        const dr = b.row - a.row
        const dc = b.col - a.col
        transform = `translate(${dc * cStep}rpx, ${dr * cStep}rpx)`
        zIndex = 15
      } else if (r === b.row && c === b.col) {
        type = swapAnim.grid[b.row][b.col]
        const dr = a.row - b.row
        const dc = a.col - b.col
        transform = `translate(${dc * cStep}rpx, ${dr * cStep}rpx)`
        zIndex = 15
      } else {
        type = gridForRender[r][c]
      }
      if (type !== null && type < 0) hidden = true
      return { type, transform, transition: 'transform 0.16s ease-out', opacity, zIndex, hidden, clearing: false }
    }

    if (fallMoves && fallMoves.length > 0) {
      const move = fallMoves.find((m) => m.fromRow === r && m.col === c)
      if (move) {
        type = move.type
        const dy = (move.toRow - move.fromRow) * cStep
        transform = fallDropping ? `translateY(${dy}rpx)` : 'translateY(0)'
        zIndex = 10
        return { type, transform, transition, opacity, zIndex, hidden: false, clearing: false }
      }
      const isTarget = fallMoves.some((m) => m.toRow === r && m.col === c)
      if (isTarget) {
        hidden = true
        return { type: null, transform: '', transition, opacity, zIndex, hidden, clearing: false }
      }
    }

    if (spawnTiles && spawnTiles.length > 0) {
      const spawn = spawnTiles.find((s) => s.row === r && s.col === c)
      if (spawn) {
        type = spawn.type
        const dy = spawn.dropDistance * cStep
        transform = spawnDropping ? 'translateY(0)' : `translateY(-${dy}rpx)`
        return { type, transform, transition: 'transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1)', opacity: 1, zIndex: 12, hidden: false, clearing: false }
      }
    }

    type = gridForRender[r][c]
    if (type < 0) hidden = true
    const isClearing = clearingCells.has(key)
    return { type, transform, transition, opacity, zIndex, hidden, clearing: isClearing }
  }

  const renderTile = (r: number, c: number) => {
    const cell = resolveCell(r, c)
    if (cell.hidden || cell.type === null || cell.type < 0) return null

    const tileKey = MATCH3_TILE_KEYS[cell.type] as Match3TileKey | undefined
    const imgUrl = tileKey ? tileUrls[tileKey] : ''
    const showImg = imgUrl && !imgUrl.startsWith('data:image')
    const fallbackColor = tileKey ? MATCH3_TILE_COLORS[tileKey] : '#555'
    const label = tileKey ? MATCH3_TILE_LABELS[tileKey] : '?'
    const isHint = hintCells.some((h) => h.row === r && h.col === c)
    const tileKeyForFx = MATCH3_TILE_KEYS[cell.type] as Match3TileKey | undefined
    const glowColor = tileKeyForFx ? MATCH3_TILE_COLORS[tileKeyForFx] : '#f5c518'

    const style: Record<string, string | number> = {
      left: `${cLeft(c)}rpx`,
      top: `${cTop(r)}rpx`,
      width: `${cSize}rpx`,
      height: `${cSize}rpx`,
      transform: cell.transform,
      transition: cell.transition,
      opacity: cell.clearing ? 0 : cell.opacity,
      zIndex: cell.zIndex,
      ...(cell.clearing
        ? { boxShadow: `0 0 32rpx ${glowColor}, 0 0 12rpx #fff` }
        : {}),
    }

    return (
      <View
        key={`tile-${r}-${c}`}
        className={[
          'mc-cell',
          cell.clearing ? 'mc-cell--clearing' : '',
          cell.clearing ? 'mc-cell--clearing-burst' : '',
          isHint ? 'mc-cell--hint' : '',
          drag && drag.row === r && drag.col === c ? 'mc-cell--dragging' : '',
          busy ? 'mc-cell--locked' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={style}
        onTouchStart={(e) => onCellTouchStart(r, c, e)}
        onTouchMove={onCellTouchMove}
        onTouchEnd={onCellTouchEnd}
        onTouchCancel={onCellTouchEnd}
      >
        {showImg ? (
          <Image className='mc-cell-img' src={imgUrl} mode='aspectFit' />
        ) : (
          <View className='mc-cell-fallback' style={{ backgroundColor: fallbackColor }}>
            <Text className='mc-cell-fallback-text'>{label.slice(0, 1)}</Text>
          </View>
        )}
      </View>
    )
  }

  const boardSize = cPad * 2 + GRID_SIZE * cSize + (GRID_SIZE - 1) * cGap

  return (
    <View className='match3-compact'>
      {/* 左侧信息栏 */}
      <View className='mc-left-panel'>
        <View className='mc-stat-item'>
          <Text className='mc-stat-label'>得分</Text>
          <Text className={`mc-stat-value ${scorePulse ? 'mc-stat-value--pulse' : ''} ${score >= targetScore * 0.8 ? 'mc-stat-value--gold' : ''}`}>
            {score}
          </Text>
          <Text className='mc-stat-target'>/{targetScore}</Text>
        </View>
        <View className='mc-stat-item'>
          <Text className='mc-stat-label'>步数</Text>
          <Text className={`mc-stat-value ${movesLeft <= 5 ? 'mc-stat-value--warn' : ''}`}>
            {movesLeft}
          </Text>
        </View>
        <View className='mc-progress-track'>
          <View
            className='mc-progress-fill'
            style={{ width: `${Math.min(100, (score / targetScore) * 100)}%` }}
          />
        </View>
        <View className='mc-combo-slot'>
          {comboText ? (
            <Text className='mc-combo-text'>{comboText}</Text>
          ) : null}
        </View>
      </View>

      {/* 中间棋盘 */}
      <View className='mc-board-wrap'>
        <View className={`mc-board ${clearFx.shakeBoard ? 'mc-board--shake' : ''}`} style={{ width: `${boardSize}rpx`, height: `${boardSize}rpx` }}>
          {clearFx.showFlash && <View className='mc-board-flash' />}
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) =>
            renderTile(Math.floor(i / GRID_SIZE), i % GRID_SIZE)
          )}
          {/* 特效层 */}
          <View className='mc-fx-layer'>
            {clearFx.rings.map((ring) => (
              <View
                key={ring.id}
                className={`mc-fx-ring ${ring.big ? 'mc-fx-ring--big' : ''}`}
                style={{
                  left: `${ring.left}rpx`,
                  top: `${ring.top}rpx`,
                  borderColor: ring.color,
                  boxShadow: `0 0 24rpx ${ring.color}`,
                }}
              />
            ))}
            {clearFx.particles.map((p) => (
              <View
                key={p.id}
                className={`mc-fx-particle mc-fx-particle--dir-${p.dir}`}
                style={{
                  left: `${p.left}rpx`,
                  top: `${p.top}rpx`,
                  backgroundColor: p.color,
                }}
              />
            ))}
            {clearFx.stars.map((s) => (
              <Text
                key={s.id}
                className='mc-fx-star'
                style={{ left: `${s.left}rpx`, top: `${s.top}rpx` }}
              >
                {s.char}
              </Text>
            ))}
            {clearFx.popups.map((p) => (
              <Text
                key={p.id}
                className={`mc-fx-popup ${p.combo > 1 ? 'mc-fx-popup--combo' : ''}`}
                style={{ left: `${p.left}rpx`, top: `${p.top}rpx` }}
              >
                {p.text}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* 右侧按钮栏 */}
      <View className='mc-right-panel'>
        <View className='mc-circle-btn mc-circle-btn--hint' onClick={handleHint}>
          <Text className='mc-circle-icon'>💡</Text>
        </View>
        <View className='mc-circle-btn mc-circle-btn--restart' onClick={handleRestart}>
          <Text className='mc-circle-icon'>🔄</Text>
        </View>
      </View>
    </View>
  )
}

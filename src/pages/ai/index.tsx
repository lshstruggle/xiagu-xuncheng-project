import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useEffect, useCallback, useRef } from 'react'
import Taro from '@tarojs/taro'
import {
  MATCH3_TILE_KEYS,
  MATCH3_TILE_COLORS,
  MATCH3_TILE_LABELS,
  preloadMatch3Assets,
  type Match3TileKey,
  type Match3UiKey,
} from '../../utils/match3-assets'
import {
  GRID_SIZE,
  INITIAL_MOVES,
  TARGET_SCORE,
  CELL_STEP_RPX,
  cellLeftRpx,
  cellTopRpx,
  createGrid,
  findMatches,
  clearMatches,
  computeGravityMoves,
  applyGravity,
  fillEmptyWithSpawns,
  attemptSwap,
  SCORE_PER_TILE,
  hasValidMove,
  shuffleGrid,
  findHint,
  isAdjacent,
  type Grid,
  type Position,
  type GravityMove,
  type SpawnTile,
} from '../../utils/match3-engine'
import {
  buildClearEffects,
  type ClearEffects,
} from '../../utils/match3-effects'
import { safeVibrateShort } from '../../utils/safe-vibrate'
import './index.scss'

function formatErr(err: unknown): string {
  if (!err) return 'unknown'
  if (typeof err === 'string') return err
  const e = err as { errMsg?: string; message?: string }
  return e.errMsg || e.message || JSON.stringify(err)
}

const EMPTY_EFFECTS: ClearEffects = {
  rings: [],
  particles: [],
  popups: [],
  stars: [],
  showFlash: false,
  shakeBoard: false,
}

type GameStatus = 'playing' | 'won' | 'lost'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** 拖动超过该像素（px）才判定为交换方向 */
const DRAG_THRESHOLD_PX = 28

interface DragState {
  row: number
  col: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

export default function Match3Game() {
  const [displayGrid, setDisplayGrid] = useState<Grid>(() => createGrid())
  const [score, setScore] = useState(0)
  const [movesLeft, setMovesLeft] = useState(INITIAL_MOVES)
  const [hintCells, setHintCells] = useState<Position[]>([])
  const [comboText, setComboText] = useState('')
  const [status, setStatus] = useState<GameStatus>('playing')
  const [busy, setBusy] = useState(false)
  const [tileUrls, setTileUrls] = useState<Record<Match3TileKey, string>>(
    {} as Record<Match3TileKey, string>
  )
  const [uiUrls, setUiUrls] = useState<Partial<Record<Match3UiKey, string>>>({})

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
  const fxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '王者消消乐' })
    preloadMatch3Assets()
      .then(({ tiles, ui }) => {
        setTileUrls(tiles)
        setUiUrls(ui)
      })
      .catch((err) => console.warn('[match3] 资源预加载失败:', formatErr(err)))
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
    const fx = buildClearEffects(matched, grid, combo)
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

  const checkEnd = useCallback((newScore: number, newMoves: number) => {
    if (newScore >= TARGET_SCORE) {
      setStatus('won')
      safeVibrateShort('heavy')
      return
    }
    if (newMoves <= 0) setStatus('lost')
  }, [])

  /** 分步播放：消除 → 下落 → 填充 → 再检测连锁 */
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

        // 1. 消除特效 + 动画
        triggerClearFx(matched, current, combo)
        if (matched.size >= 5) {
          safeVibrateShort('medium')
        } else {
          safeVibrateShort('light')
        }
        setClearingCells(new Set(matched))
        await delay(300)
        setClearingCells(new Set())

        combo++

        const cleared = clearMatches(current, matched)
        setDisplayGrid(cleared)
        gridRef.current = cleared
        await delay(40)

        // 2. 下落动画
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

        // 3. 顶部生成并下落
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
        return next
      })

      if (!hasValidMove(current)) {
        const shuffled = shuffleGrid(current)
        setDisplayGrid(shuffled)
        gridRef.current = shuffled
        Taro.showToast({ title: '已重新排列', icon: 'none', duration: 1200 })
      }
    },
    [showCombo, checkEnd, triggerClearFx]
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
    setMovesLeft(INITIAL_MOVES)
    setHintCells([])
    setStatus('playing')
    setComboText('')
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

  /** 计算单格显示（含下落/生成/拖动/交换动画） */
  const resolveCell = (r: number, c: number) => {
    const key = `${r},${c}`
    let type: number | null = null
    let transform = ''
    let transition = 'transform 0.28s ease-out, opacity 0.22s ease-out'
    let opacity = 1
    let zIndex = 1
    let hidden = false

    // 拖动中
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

    // 交换动画：两格互换位移
    if (swapAnim) {
      const { a, b } = swapAnim
      if (r === a.row && c === a.col) {
        type = swapAnim.grid[a.row][a.col]
        const dr = b.row - a.row
        const dc = b.col - a.col
        transform = swapAnim.revert
          ? `translate(${dc * CELL_STEP_RPX}rpx, ${dr * CELL_STEP_RPX}rpx)`
          : `translate(${dc * CELL_STEP_RPX}rpx, ${dr * CELL_STEP_RPX}rpx)`
        zIndex = 15
      } else if (r === b.row && c === b.col) {
        type = swapAnim.grid[b.row][b.col]
        const dr = a.row - b.row
        const dc = a.col - b.col
        transform = `translate(${dc * CELL_STEP_RPX}rpx, ${dr * CELL_STEP_RPX}rpx)`
        zIndex = 15
      } else {
        type = gridForRender[r][c]
      }
      if (type !== null && type < 0) hidden = true
      return {
        type,
        transform,
        transition: 'transform 0.16s ease-out',
        opacity,
        zIndex,
        hidden,
        clearing: false,
      }
    }

    // 下落动画：仍在原行，向下平移
    if (fallMoves && fallMoves.length > 0) {
      const move = fallMoves.find((m) => m.fromRow === r && m.col === c)
      if (move) {
        type = move.type
        const dy = (move.toRow - move.fromRow) * CELL_STEP_RPX
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

    // 顶部生成：从上方落入
    if (spawnTiles && spawnTiles.length > 0) {
      const spawn = spawnTiles.find((s) => s.row === r && s.col === c)
      if (spawn) {
        type = spawn.type
        const dy = spawn.dropDistance * CELL_STEP_RPX
        transform = spawnDropping ? 'translateY(0)' : `translateY(-${dy}rpx)`
        return {
          type,
          transform,
          transition: 'transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1)',
          opacity: 1,
          zIndex: 12,
          hidden: false,
          clearing: false,
        }
      }
    }

    type = gridForRender[r][c]
    if (type < 0) hidden = true

    const isClearing = clearingCells.has(key)

    return {
      type,
      transform,
      transition,
      opacity,
      zIndex,
      hidden,
      clearing: isClearing,
    }
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

    const style: Record<string, string | number> = {
      left: `${cellLeftRpx(c)}rpx`,
      top: `${cellTopRpx(r)}rpx`,
      transform: cell.transform,
      transition: cell.transition,
      opacity: cell.clearing ? 0 : cell.opacity,
      zIndex: cell.zIndex,
    }

    // 生成块：挂载后下一帧落到 0
    const tileKeyForFx = MATCH3_TILE_KEYS[cell.type] as Match3TileKey | undefined
    const glowColor = tileKeyForFx ? MATCH3_TILE_COLORS[tileKeyForFx] : '#f5c518'

    return (
      <View
        key={`tile-${r}-${c}`}
        className={[
          'cell',
          cell.clearing ? 'cell--clearing' : '',
          cell.clearing ? 'cell--clearing-burst' : '',
          isHint ? 'cell--hint' : '',
          drag && drag.row === r && drag.col === c ? 'cell--dragging' : '',
          busy ? 'cell--locked' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...style,
          ...(cell.clearing
            ? { boxShadow: `0 0 32rpx ${glowColor}, 0 0 12rpx #fff` }
            : {}),
        }}
        onTouchStart={(e) => onCellTouchStart(r, c, e)}
        onTouchMove={onCellTouchMove}
        onTouchEnd={onCellTouchEnd}
        onTouchCancel={onCellTouchEnd}
      >
        {showImg ? (
          <Image className='cell-img' src={imgUrl} mode='aspectFit' />
        ) : (
          <View
            className='cell-fallback'
            style={{ backgroundColor: fallbackColor }}
          >
            <Text className='cell-fallback-text'>{label.slice(0, 1)}</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <View className='match3-page'>
      <View className='match3-header'>
        <View className='stat-block'>
          {uiUrls.scoreIcon && !uiUrls.scoreIcon.startsWith('data:image') ? (
            <Image className='stat-icon' src={uiUrls.scoreIcon} mode='aspectFit' />
          ) : (
            <Text className='stat-emoji'>⭐</Text>
          )}
          <View className='stat-info'>
            <Text className='stat-label'>得分</Text>
            <Text className={`stat-value ${scorePulse ? 'stat-value--pulse' : ''}`}>
              {score}
            </Text>
          </View>
        </View>
        <View className='stat-block stat-block--center'>
          <Text className='stat-label'>目标</Text>
          <Text className='stat-value stat-value--gold'>{TARGET_SCORE}</Text>
        </View>
        <View className='stat-block stat-block--right'>
          <Text className='stat-label'>步数</Text>
          <Text
            className={`stat-value ${movesLeft <= 5 ? 'stat-value--warn' : ''}`}
          >
            {movesLeft}
          </Text>
        </View>
      </View>

      {/* 固定高度占位，避免连击文字出现/消失导致棋盘跳动 */}
      <View className='combo-slot'>
        {comboText ? (
          <Text className='combo-text'>{comboText}</Text>
        ) : null}
      </View>

      <View className='board-wrap'>
        <View
          className={`board ${clearFx.shakeBoard ? 'board--shake' : ''}`}
          catchMove
        >
          {clearFx.showFlash && <View className='board-flash' />}
          <View className='board-grid' catchMove>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) =>
              renderTile(Math.floor(i / GRID_SIZE), i % GRID_SIZE)
            )}
          </View>
          <View className='fx-layer'>
            {clearFx.rings.map((ring) => (
              <View
                key={ring.id}
                className={`fx-ring ${ring.big ? 'fx-ring--big' : ''}`}
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
                className={`fx-particle fx-particle--dir-${p.dir}`}
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
                className='fx-star'
                style={{ left: `${s.left}rpx`, top: `${s.top}rpx` }}
              >
                {s.char}
              </Text>
            ))}
            {clearFx.popups.map((p) => (
              <Text
                key={p.id}
                className={`fx-popup ${p.combo > 1 ? 'fx-popup--combo' : ''}`}
                style={{ left: `${p.left}rpx`, top: `${p.top}rpx` }}
              >
                {p.text}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View className='action-bar'>
        <Button className='action-btn action-btn--hint' onClick={handleHint}>
          {uiUrls.btnHint && !uiUrls.btnHint.startsWith('data:image') ? (
            <Image className='action-btn-img' src={uiUrls.btnHint} mode='aspectFit' />
          ) : (
            <Text className='action-btn-text'>💡 提示</Text>
          )}
        </Button>
        <Button className='action-btn action-btn--restart' onClick={handleRestart}>
          {uiUrls.btnRestart && !uiUrls.btnRestart.startsWith('data:image') ? (
            <Image
              className='action-btn-img'
              src={uiUrls.btnRestart}
              mode='aspectFit'
            />
          ) : (
            <Text className='action-btn-text'>🔄 重来</Text>
          )}
        </Button>
      </View>

      <Text className='hint-tip'>拖动图标与相邻格子交换，三个及以上连线即可消除</Text>

      {status !== 'playing' && (
        <View className='modal-mask'>
          <View className='modal-panel'>
            <Text className='modal-title'>
              {status === 'won' ? '🏆 挑战成功！' : '⏳ 步数用尽'}
            </Text>
            <Text className='modal-score'>最终得分：{score}</Text>
            <Button className='modal-btn' onClick={handleRestart}>
              再来一局
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

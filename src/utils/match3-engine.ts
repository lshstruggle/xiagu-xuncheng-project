/**
 * 王者消消乐 - 核心逻辑（纯函数，与 UI 解耦）
 */

export const GRID_SIZE = 8
export const TILE_TYPE_COUNT = 6
export const INITIAL_MOVES = 30
export const TARGET_SCORE = 1200
export const SCORE_PER_TILE = 10

export interface Position {
  row: number
  col: number
}

export type Grid = number[][]

/** 与 UI 一致的格子尺寸（rpx） */
export const CELL_SIZE_RPX = 76
export const CELL_GAP_RPX = 6
export const BOARD_PADDING_RPX = 12
export const CELL_STEP_RPX = CELL_SIZE_RPX + CELL_GAP_RPX

export function cellLeftRpx(col: number): number {
  return BOARD_PADDING_RPX + col * CELL_STEP_RPX
}

export function cellTopRpx(row: number): number {
  return BOARD_PADDING_RPX + row * CELL_STEP_RPX
}

export interface GravityMove {
  col: number
  fromRow: number
  toRow: number
  type: number
}

export interface SpawnTile {
  row: number
  col: number
  type: number
  /** 从棋盘上方多少格开始下落 */
  dropDistance: number
}

export interface ResolveResult {
  grid: Grid
  scoreGained: number
  clearedCount: number
}

export interface CascadeResult {
  grid: Grid
  totalScore: number
  totalCleared: number
  cascadeSteps: number
}

/** 生成无初始三连的棋盘 */
export function createGrid(): Grid {
  const grid: Grid = []
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = []
    for (let c = 0; c < GRID_SIZE; c++) {
      let type: number
      do {
        type = Math.floor(Math.random() * TILE_TYPE_COUNT)
      } while (
        (c >= 2 && grid[r][c - 1] === type && grid[r][c - 2] === type) ||
        (r >= 2 && grid[r - 1][c] === type && grid[r - 2][c] === type)
      )
      grid[r][c] = type
    }
  }
  return grid
}

export function posKey(row: number, col: number): string {
  return `${row},${col}`
}

export function parseKey(key: string): Position {
  const [row, col] = key.split(',').map(Number)
  return { row, col }
}

/** 查找所有 >=3 连线的格子 */
export function findMatches(grid: Grid): Set<string> {
  const matched = new Set<string>()
  const size = grid.length

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 2; c++) {
      const type = grid[r][c]
      if (type < 0) continue
      if (grid[r][c + 1] === type && grid[r][c + 2] === type) {
        let end = c + 2
        while (end + 1 < size && grid[r][end + 1] === type) end++
        for (let i = c; i <= end; i++) matched.add(posKey(r, i))
      }
    }
  }

  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 2; r++) {
      const type = grid[r][c]
      if (type < 0) continue
      if (grid[r + 1][c] === type && grid[r + 2][c] === type) {
        let end = r + 2
        while (end + 1 < size && grid[end + 1][c] === type) end++
        for (let i = r; i <= end; i++) matched.add(posKey(i, c))
      }
    }
  }

  return matched
}

/** 复制棋盘并应用重力（不填充新块） */
export function applyGravity(grid: Grid): Grid {
  const size = grid.length
  const next = grid.map((row) => [...row])
  for (let c = 0; c < size; c++) {
    let writeRow = size - 1
    for (let r = size - 1; r >= 0; r--) {
      if (next[r][c] >= 0) {
        next[writeRow][c] = next[r][c]
        if (writeRow !== r) next[r][c] = -1
        writeRow--
      }
    }
    for (let r = writeRow; r >= 0; r--) next[r][c] = -1
  }
  return next
}

/** 清除匹配格，标记为 -1 */
export function clearMatches(grid: Grid, matched: Set<string>): Grid {
  const next = grid.map((row) => [...row])
  matched.forEach((key) => {
    const { row, col } = parseKey(key)
    next[row][col] = -1
  })
  return next
}

/** 计算重力下落（在 applyGravity 之前调用） */
export function computeGravityMoves(grid: Grid): GravityMove[] {
  const moves: GravityMove[] = []
  const size = grid.length
  for (let c = 0; c < size; c++) {
    let writeRow = size - 1
    for (let r = size - 1; r >= 0; r--) {
      if (grid[r][c] >= 0) {
        if (writeRow !== r) {
          moves.push({
            col: c,
            fromRow: r,
            toRow: writeRow,
            type: grid[r][c],
          })
        }
        writeRow--
      }
    }
  }
  return moves
}

/** 填充空格并返回新生成的块（用于顶部落入动画） */
export function fillEmptyWithSpawns(grid: Grid): {
  grid: Grid
  spawns: SpawnTile[]
} {
  const next = grid.map((row) => [...row])
  const spawns: SpawnTile[] = []
  const size = grid.length

  for (let c = 0; c < size; c++) {
    let emptyCount = 0
    for (let r = 0; r < size; r++) {
      if (next[r][c] < 0) emptyCount++
    }
    let spawnIdx = 0
    for (let r = 0; r < size; r++) {
      if (next[r][c] < 0) {
        const type = Math.floor(Math.random() * TILE_TYPE_COUNT)
        next[r][c] = type
        spawns.push({
          row: r,
          col: c,
          type,
          dropDistance: emptyCount - spawnIdx,
        })
        spawnIdx++
      }
    }
  }

  return { grid: next, spawns }
}

function fillEmpty(grid: Grid): void {
  const { grid: filled } = fillEmptyWithSpawns(grid)
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      grid[r][c] = filled[r][c]
    }
  }
}

/** 消除 → 下落 → 填充（单轮） */
export function resolveOnce(grid: Grid, comboMultiplier = 1): ResolveResult {
  const matches = findMatches(grid)
  if (matches.size === 0) {
    return { grid, scoreGained: 0, clearedCount: 0 }
  }

  const newGrid = grid.map((row) => [...row])
  matches.forEach((key) => {
    const { row, col } = parseKey(key)
    newGrid[row][col] = -1
  })

  const scoreGained = matches.size * SCORE_PER_TILE * comboMultiplier
  applyGravity(newGrid)
  fillEmpty(newGrid)

  return { grid: newGrid, scoreGained, clearedCount: matches.size }
}

/** 连锁消除直到稳定 */
export function resolveCascade(grid: Grid): CascadeResult {
  let current = grid.map((row) => [...row])
  let totalScore = 0
  let totalCleared = 0
  let cascadeSteps = 0
  let combo = 1

  while (true) {
    const { grid: next, scoreGained, clearedCount } = resolveOnce(current, combo)
    if (clearedCount === 0) break
    current = next
    totalScore += scoreGained
    totalCleared += clearedCount
    cascadeSteps++
    combo++
  }

  return { grid: current, totalScore, totalCleared, cascadeSteps }
}

export function isAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row)
  const dc = Math.abs(a.col - b.col)
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1)
}

export function swapCells(grid: Grid, a: Position, b: Position): Grid {
  const newGrid = grid.map((row) => [...row])
  const t = newGrid[a.row][a.col]
  newGrid[a.row][a.col] = newGrid[b.row][b.col]
  newGrid[b.row][b.col] = t
  return newGrid
}

/** 尝试交换；若无消除则返回 null */
export function trySwap(grid: Grid, a: Position, b: Position): Grid | null {
  if (!isAdjacent(a, b)) return null
  const swapped = swapCells(grid, a, b)
  if (findMatches(swapped).size === 0) return null
  return swapped
}

/** 交换并返回是否可消除（用于拖动后的回弹） */
export function attemptSwap(
  grid: Grid,
  a: Position,
  b: Position
): { ok: boolean; grid: Grid } {
  if (!isAdjacent(a, b)) return { ok: false, grid }
  const swapped = swapCells(grid, a, b)
  if (findMatches(swapped).size === 0) return { ok: false, grid: swapped }
  return { ok: true, grid: swapped }
}

/** 是否存在可行动交换 */
export function hasValidMove(grid: Grid): boolean {
  const size = grid.length
  const dirs = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
  ]

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const { dr, dc } of dirs) {
        const nr = r + dr
        const nc = c + dc
        if (nr >= size || nc >= size) continue
        if (trySwap(grid, { row: r, col: c }, { row: nr, col: nc })) return true
      }
    }
  }
  return false
}

/** 无步可走时洗牌 */
export function shuffleGrid(grid: Grid): Grid {
  const types: number[] = []
  grid.forEach((row) => row.forEach((t) => types.push(t)))
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[types[i], types[j]] = [types[j], types[i]]
  }
  let idx = 0
  const newGrid = grid.map((row) =>
    row.map(() => {
      const t = types[idx++]
      return t
    })
  )
  if (findMatches(newGrid).size > 0 || !hasValidMove(newGrid)) {
    return createGrid()
  }
  return newGrid
}

/** 返回一对可消除的相邻格（用于提示） */
export function findHint(grid: Grid): [Position, Position] | null {
  const size = grid.length
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size && trySwap(grid, { row: r, col: c }, { row: r, col: c + 1 })) {
        return [{ row: r, col: c }, { row: r, col: c + 1 }]
      }
      if (r + 1 < size && trySwap(grid, { row: r, col: c }, { row: r + 1, col: c })) {
        return [{ row: r, col: c }, { row: r + 1, col: c }]
      }
    }
  }
  return null
}

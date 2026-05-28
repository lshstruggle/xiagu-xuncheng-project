/**
 * 消消乐消除特效数据生成
 */

import {
  MATCH3_TILE_KEYS,
  MATCH3_TILE_COLORS,
  type Match3TileKey,
} from './match3-assets'
import {
  parseKey,
  cellLeftRpx,
  cellTopRpx,
  CELL_SIZE_RPX,
  SCORE_PER_TILE,
  type Grid,
} from './match3-engine'

let effectIdSeq = 0
const nextId = () => ++effectIdSeq

export interface BurstRing {
  id: number
  left: number
  top: number
  color: string
  big: boolean
}

export interface FlyParticle {
  id: number
  left: number
  top: number
  color: string
  dir: number
}

export interface ScorePopupFx {
  id: number
  left: number
  top: number
  text: string
  combo: number
}

export interface StarSpark {
  id: number
  left: number
  top: number
  char: string
}

export interface ClearEffects {
  rings: BurstRing[]
  particles: FlyParticle[]
  popups: ScorePopupFx[]
  stars: StarSpark[]
  showFlash: boolean
  shakeBoard: boolean
}

const PARTICLE_DIRS = 8
const STAR_CHARS = ['✨', '⭐', '💫', '⚡']

/** 匹配区域中心格（用于飘分） */
function getMatchCenter(matched: Set<string>): { row: number; col: number } {
  let sumR = 0
  let sumC = 0
  matched.forEach((key) => {
    const { row, col } = parseKey(key)
    sumR += row
    sumC += col
  })
  const n = matched.size
  return { row: Math.round(sumR / n), col: Math.round(sumC / n) }
}

/** 根据本次消除生成特效（支持缩放） */
export function buildClearEffects(
  matched: Set<string>,
  grid: Grid,
  combo: number,
  scale = 1
): ClearEffects {
  const rings: BurstRing[] = []
  const particles: FlyParticle[] = []
  const stars: StarSpark[] = []
  const count = matched.size
  const scoreGain = count * SCORE_PER_TILE * combo
  const center = getMatchCenter(matched)
  const centerLeft = (cellLeftRpx(center.col) + CELL_SIZE_RPX / 2) * scale
  const centerTop = (cellTopRpx(center.row) + CELL_SIZE_RPX / 2) * scale

  matched.forEach((key) => {
    const { row, col } = parseKey(key)
    const type = grid[row]?.[col] ?? 0
    const tileKey = MATCH3_TILE_KEYS[type] as Match3TileKey | undefined
    const color = tileKey ? MATCH3_TILE_COLORS[tileKey] : '#f5c518'
    const left = (cellLeftRpx(col) + CELL_SIZE_RPX / 2) * scale
    const top = (cellTopRpx(row) + CELL_SIZE_RPX / 2) * scale

    rings.push({
      id: nextId(),
      left,
      top,
      color,
      big: count >= 5,
    })

    for (let i = 0; i < PARTICLE_DIRS; i++) {
      particles.push({
        id: nextId(),
        left,
        top,
        color,
        dir: i,
      })
    }

    if (count >= 4 && Math.random() > 0.5) {
      stars.push({
        id: nextId(),
        left: left + (Math.random() - 0.5) * 40 * scale,
        top: top + (Math.random() - 0.5) * 40 * scale,
        char: STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)],
      })
    }
  })

  const popups: ScorePopupFx[] = [
    {
      id: nextId(),
      left: centerLeft,
      top: centerTop - 20 * scale,
      text: combo > 1 ? `+${scoreGain} x${combo}` : `+${scoreGain}`,
      combo,
    },
  ]

  if (combo > 1) {
    popups.push({
      id: nextId(),
      left: centerLeft,
      top: centerTop - 56 * scale,
      text: `${combo} 连击!`,
      combo,
    })
  }

  return {
    rings,
    particles,
    popups,
    stars,
    showFlash: count >= 3,
    shakeBoard: count >= 5,
  }
}

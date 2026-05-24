// config/explore-score.ts
// 城市探索度计算配置

/** POI打卡得分 */
export const POI_SCORE: Record<string, number> = {
  red_buff: 2,
  blue_buff: 3,
  tower: 5,
  spirit_lighthouse: 2,
  arena: 5,
  trace: 3,      // 选手足迹
  beacon: 5,     // 荣耀灯塔
  club: 5,       // 电竞俱乐部
}

/** 路线完成得分 */
export const ROUTE_SCORE: Record<number, number> = {
  1: 6,   // 宽窄巷子探秘
  2: 7,   // 锦里古街漫游
  3: 7,   // 春熙太古里巡礼
}

/** 成就接口 */
export interface Achievement {
  id: string
  name: string
  desc: string
  score: number
  condition: {
    type: string
    value: number | boolean
  }
  icon: string
}

/** 成就列表及加分 */
export const ACHIEVEMENTS: Achievement[] = [
  // 打卡类
  { id: 'first_checkin',     name: '初出茅庐',     desc: '完成首次打卡',       score: 1, condition: { type: 'checkin_count', value: 1 },  icon: '🏁' },
  { id: 'checkin_5',         name: '小有名气',     desc: '累计打卡5个POI',     score: 2, condition: { type: 'checkin_count', value: 5 },  icon: '⭐' },
  { id: 'checkin_15',        name: '探索达人',     desc: '累计打卡15个POI',    score: 3, condition: { type: 'checkin_count', value: 15 }, icon: '🌟' },
  { id: 'checkin_all',       name: '全图制霸',     desc: '打卡全部POI',        score: 5, condition: { type: 'checkin_count', value: 999 }, icon: '👑' },

  // 收集类
  { id: 'first_badge',       name: '勋章猎人',     desc: '收集首枚勋章',       score: 1, condition: { type: 'badge_count', value: 1 },   icon: '🎖️' },
  { id: 'all_spirit_badges', name: '精神传承者',   desc: '集齐全部精神徽章',   score: 3, condition: { type: 'spirit_badge_all', value: true }, icon: '🔥' },
  { id: 'all_bookmarks',     name: '峡谷编年史',   desc: '集齐全部羁绊书签',   score: 5, condition: { type: 'bookmark_all', value: true },    icon: '📖' },

  // 路线类
  { id: 'first_route',       name: '踏上征途',     desc: '完成首条路线',       score: 2, condition: { type: 'route_count', value: 1 },   icon: '🗺️' },
  { id: 'all_routes',        name: '成都通',       desc: '完成全部3条路线',    score: 5, condition: { type: 'route_count', value: 3 },   icon: '🏆' },

  // 社交类
  { id: 'first_share',       name: '社交达人',     desc: '首次分享战报',       score: 1, condition: { type: 'share_count', value: 1 },   icon: '📤' },
  { id: 'share_3',           name: '峡谷宣传官',   desc: '累计分享3次',        score: 2, condition: { type: 'share_count', value: 3 },   icon: '📣' },
]

/** 用户数据接口 */
export interface UserExploreData {
  checkins?: Array<{ id: number; type: string; time?: number }>
  completedRoutes?: number[]
  unlockedAchievements?: string[]
}

/** 计算总探索度 */
export function calcExploreScore(userData: UserExploreData): number {
  let base = 0

  // POI打卡得分
  const checkins = userData.checkins || []
  checkins.forEach(c => {
    base += (POI_SCORE[c.type] || 1)
  })

  // 路线完成得分
  const completedRoutes = userData.completedRoutes || []
  completedRoutes.forEach(rid => {
    base += (ROUTE_SCORE[rid] || 0)
  })

  // 基础分上限50+20=70
  base = Math.min(base, 70)

  // 成就加分
  let bonus = 0
  const unlocked = userData.unlockedAchievements || []
  unlocked.forEach(aid => {
    const ach = ACHIEVEMENTS.find(a => a.id === aid)
    if (ach) bonus += ach.score
  })
  bonus = Math.min(bonus, 30)

  return Math.min(base + bonus, 100)
}

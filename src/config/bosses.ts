// Boss 挑战配置

export type BossType = 'zhuzai' | 'baojun' | 'fengbolongwang'

export interface BossConfig {
  id: BossType
  name: string
  title: string
  latitude: number
  longitude: number
  locationName: string
  idleGif: string
  attackGif: string
  maxHp: number
  // 每答对1题扣除的血量
  damagePerHit: number
  // 奖励配置
  rewards: {
    heroFragments: number
    skinFragments: number
    bondValue: number
    posterId: string
    posterUrl: string
  }
  // 关联题库ID（复用 tower-quiz 中的题目）
  quizCategory: string
}

// 匹配框图片
export const MATCH_FRAME_IMAGE = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/匹配系统/匹配框.jpg'

// Boss 列表
export const BOSSES: BossConfig[] = [
  {
    id: 'zhuzai',
    name: '主宰',
    title: '峡谷主宰',
    latitude: 30.669,
    longitude: 104.054,
    locationName: '宽窄巷子',
    idleGif: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/gif动图/主宰待机.gif',
    attackGif: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/gif动图/主宰攻击.gif',
    maxHp: 100,
    damagePerHit: 25,
    rewards: {
      heroFragments: 5,
      skinFragments: 3,
      bondValue: 30,
      posterId: 'boss_zhuzai_poster',
      posterUrl: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/海报/主宰击败.png'
    },
    quizCategory: 'general'
  },
  {
    id: 'baojun',
    name: '暴君',
    title: '峡谷暴君',
    latitude: 30.642,
    longitude: 104.047,
    locationName: '武侯祠',
    idleGif: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/gif动图/暴君待机.gif',
    attackGif: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/gif动图/暴君攻击.gif',
    maxHp: 100,
    damagePerHit: 25,
    rewards: {
      heroFragments: 5,
      skinFragments: 3,
      bondValue: 30,
      posterId: 'boss_baojun_poster',
      posterUrl: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/海报/暴君击败.png'
    },
    quizCategory: 'general'
  },
  {
    id: 'fengbolongwang',
    name: '风暴龙王',
    title: '风暴龙王',
    latitude: 30.6565,
    longitude: 104.082,
    locationName: '太古里',
    idleGif: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/gif动图/风暴龙王待机.gif',
    attackGif: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/gif动图/风暴龙王攻击.gif',
    maxHp: 150,
    damagePerHit: 20,
    rewards: {
      heroFragments: 8,
      skinFragments: 5,
      bondValue: 50,
      posterId: 'boss_longwang_poster',
      posterUrl: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/海报/风暴龙王击败.png'
    },
    quizCategory: 'general'
  }
]

// 击败冷却时间：15分钟（毫秒）
export const BOSS_COOLDOWN_MS = 15 * 60 * 1000

// 挑战触发距离：200米
export const BOSS_TRIGGER_RADIUS = 200

// 本地存储Key
export const BOSS_COOLDOWN_KEY = 'bossCooldowns'

// 获取Boss击败冷却时间
export function getBossCooldowns(): Record<string, number> {
  try {
    const data = wx.getStorageSync(BOSS_COOLDOWN_KEY)
    return data || {}
  } catch {
    return {}
  }
}

// 设置Boss击败冷却时间
export function setBossDefeated(bossId: string): void {
  const cooldowns = getBossCooldowns()
  cooldowns[bossId] = Date.now()
  wx.setStorageSync(BOSS_COOLDOWN_KEY, cooldowns)
}

// 检查Boss是否在冷却中
export function isBossOnCooldown(bossId: string): boolean {
  const cooldowns = getBossCooldowns()
  const defeatedAt = cooldowns[bossId]
  if (!defeatedAt) return false
  return Date.now() - defeatedAt < BOSS_COOLDOWN_MS
}

// 获取Boss剩余冷却时间（秒）
export function getBossCooldownSeconds(bossId: string): number {
  const cooldowns = getBossCooldowns()
  const defeatedAt = cooldowns[bossId]
  if (!defeatedAt) return 0
  const remaining = BOSS_COOLDOWN_MS - (Date.now() - defeatedAt)
  return Math.max(0, Math.ceil(remaining / 1000))
}

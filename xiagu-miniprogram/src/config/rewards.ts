// config/rewards.ts
// POI打卡奖励配置

export const REWARD_TYPES = {
  coupon: '优惠券',
  exchange: '兑换券',
  experience: '体验券',
  badge: '勋章',
}

/** 奖励项接口 */
export interface RewardItem {
  type: 'coupon' | 'exchange' | 'experience' | 'badge'
  subType?: string
  name: string
  merchant?: string
  discount?: string
  content?: string
  desc?: string
  condition?: string
  validDays?: number
  badgeId?: string
  image?: string
}

/** POI奖励配置 */
export interface POIRewardConfig {
  isPartner: boolean
  rewards: RewardItem[]
}

// 云存储图片路径
const CLOUD_BASE = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/勋章兑换卷'

/** POI奖励映射 */
export const POI_REWARDS: Record<number, POIRewardConfig> = {
  // ===== 红Buff · 合作商户 =====
  14: {
    isPartner: true,
    rewards: [
      { type: 'coupon', name: '明婷饭店9折券', merchant: '明婷饭店', discount: '全单9折', condition: '堂食满100元可用', validDays: 7, image: `${CLOUD_BASE}/红buff优惠卷-removebg-preview.png` },
      { type: 'exchange', name: '川味小食兑换券', merchant: '明婷饭店', content: '免费兑换招牌凉菜一份', condition: '消费即可使用', validDays: 7, image: `${CLOUD_BASE}/红buff兑换卷-removebg-preview.png` },
    ]
  },
  18: {
    isPartner: true,
    rewards: [
      { type: 'coupon', name: '吼堂火锅8.5折券', merchant: '吼堂老火锅', discount: '全单8.5折', condition: '堂食满200元可用', validDays: 7, image: `${CLOUD_BASE}/红buff优惠卷-removebg-preview.png` },
      { type: 'experience', name: '锅底升级体验券', merchant: '吼堂老火锅', content: '免费升级特色锅底', condition: '任意消费可用', validDays: 3 },
    ]
  },
  16: {
    isPartner: true,
    rewards: [
      { type: 'coupon', name: '陈麻婆豆腐满减券', merchant: '陈麻婆豆腐', discount: '满80减15', condition: '堂食可用', validDays: 7, image: `${CLOUD_BASE}/红buff优惠卷-removebg-preview.png` },
    ]
  },

  // ===== 红Buff · 非合作商户（只加探索度，无券）=====
  15: { isPartner: false, rewards: [] },
  17: { isPartner: false, rewards: [] },
  19: { isPartner: false, rewards: [] },
  20: { isPartner: false, rewards: [] },
  21: { isPartner: false, rewards: [] },
  22: { isPartner: false, rewards: [] },
  23: { isPartner: false, rewards: [] },
  24: { isPartner: false, rewards: [] },

  // ===== 蓝Buff · 景点 =====
  9: {
    isPartner: false,
    rewards: [
      { type: 'coupon', name: '武侯祠门票8折券', merchant: '武侯祠', discount: '门票8折', condition: '下次入园使用', validDays: 30 },
      { type: 'badge', name: '三顾茅庐', badgeId: 'badge_wuhou', desc: '打卡武侯祠获得', image: `${CLOUD_BASE}/三顾茅庐徽章-removebg-preview.png` },
    ]
  },
  10: {
    isPartner: false,
    rewards: [
      { type: 'exchange', name: '金沙文创兑换券', merchant: '金沙遗址博物馆', content: '兑换太阳神鸟书签一枚', condition: '馆内文创店使用', validDays: 30, image: `${CLOUD_BASE}/蓝buff兑换卷-removebg-preview.png` },
      { type: 'badge', name: '古蜀探秘者', badgeId: 'badge_jinsha', desc: '打卡金沙遗址获得' },
    ]
  },
  13: {
    isPartner: false,
    rewards: [
      { type: 'exchange', name: '熊猫文创兑换券', merchant: '大熊猫基地', content: '兑换熊猫明信片一套', condition: '基地商店使用', validDays: 30, image: `${CLOUD_BASE}/蓝buff兑换卷-removebg-preview.png` },
    ]
  },

  // ===== 防御塔 · 地标 =====
  26: {
    isPartner: false,
    rewards: [
      { type: 'badge', name: '宽窄守护者', badgeId: 'badge_kuanzhai', desc: '打卡宽窄巷子获得', image: `${CLOUD_BASE}/宽窄徽章-removebg-preview.png` },
    ]
  },
  25: {
    isPartner: false,
    rewards: [
      { type: 'badge', name: '诗圣传人', badgeId: 'badge_caotang', desc: '打卡杜甫草堂获得', image: `${CLOUD_BASE}/诗圣徽章-removebg-preview.png` },
    ]
  },

  // ===== 泉水 · 酒店 =====
  6: {
    isPartner: true,
    rewards: [
      { type: 'coupon', subType: 'hotel', name: '成都院子住宿9折券', merchant: '成都院子酒店', discount: '房费9折', condition: '提前1天预订可用', validDays: 30, image: `${CLOUD_BASE}/泉水住宿卷-removebg-preview.png` },
    ]
  },
  7: {
    isPartner: true,
    rewards: [
      { type: 'coupon', subType: 'hotel', name: '背包十年青旅8折券', merchant: '背包十年青年旅舍', discount: '床位8折', condition: '直接入住可用', validDays: 14, image: `${CLOUD_BASE}/泉水住宿卷-removebg-preview.png` },
    ]
  },

  // ===== 电竞场馆 =====
  31: {
    isPartner: false,
    rewards: [
      { type: 'exchange', subType: 'esports', name: 'KPL周边兑换券', merchant: '量子光电竞中心', content: '兑换KPL限定徽章一枚', condition: '场馆商店使用', validDays: 30, image: `${CLOUD_BASE}/蓝buff兑换卷-removebg-preview.png` },
      { type: 'badge', name: '电竞朝圣者', badgeId: 'badge_esports', desc: '打卡电竞场馆获得', image: `${CLOUD_BASE}/朝圣徽章-removebg-preview.png` },
    ]
  },
  32: {
    isPartner: false,
    rewards: [
      { type: 'exchange', subType: 'esports', name: 'AG战队周边兑换券', merchant: 'AG电竞中心', content: '兑换AG超玩会应援手环', condition: '场馆商店使用', validDays: 30, image: `${CLOUD_BASE}/蓝buff兑换卷-removebg-preview.png` },
      { type: 'badge', name: '银龙追随者', badgeId: 'badge_ag', desc: '打卡AG电竞中心获得', image: `${CLOUD_BASE}/银龙徽章-removebg-preview.png` },
    ]
  },
  30: {
    isPartner: false,
    rewards: [
      { type: 'exchange', subType: 'esports', name: '凤凰山纪念品兑换券', merchant: '凤凰山体育公园', content: '兑换世冠纪念明信片', condition: '场馆商店使用', validDays: 30, image: `${CLOUD_BASE}/蓝buff兑换卷-removebg-preview.png` },
    ]
  },
}

/** 奖励类型视觉配置 */
export interface RewardVisual {
  emoji: string
  label: string
  tagColor: string
  bgColor: string
  bgGradient?: string
  iconImage?: string
}

export const REWARD_VISUAL: Record<string, RewardVisual> = {
  coupon:     { emoji: '🎫', label: '优惠券',  tagColor: '#FF6B6B', bgColor: 'linear-gradient(135deg,#3a1515,#2a0a0a)', bgGradient: 'linear-gradient(135deg, #5a1515, #3a0a0a)', iconImage: `${CLOUD_BASE}/红buff优惠卷-removebg-preview.png` },
  exchange:   { emoji: '🎁', label: '兑换券',  tagColor: '#4FC3F7', bgColor: 'linear-gradient(135deg,#0f1a3a,#0a0f2a)', bgGradient: 'linear-gradient(135deg, #151550, #0a0a30)', iconImage: `${CLOUD_BASE}/红buff兑换卷-removebg-preview.png` },
  experience: { emoji: '✨', label: '体验券',  tagColor: '#66BB6A', bgColor: 'linear-gradient(135deg,#0f2a15,#0a1a0a)', bgGradient: 'linear-gradient(135deg, #153a15, #0a200a)', iconImage: `${CLOUD_BASE}/红buff兑换卷-removebg-preview.png` },
  badge:      { emoji: '🎖️', label: '勋章',    tagColor: '#FFD54F', bgColor: 'linear-gradient(135deg,#2a2210,#1a1508)', bgGradient: 'linear-gradient(135deg, #3a2a0a, #201505)' },
  coupon_hotel:   { emoji: '🏨', label: '住宿券', tagColor: '#4DD0E1', bgColor: 'linear-gradient(135deg,#0f3a3a,#0a2020)', bgGradient: 'linear-gradient(135deg, #153a3a, #0a2020)', iconImage: `${CLOUD_BASE}/泉水住宿卷-removebg-preview.png` },
  exchange_esports: { emoji: '🏆', label: '赛事券', tagColor: '#FFB74D', bgColor: 'linear-gradient(135deg,#3a2a0a,#201505)', bgGradient: 'linear-gradient(135deg, #3a2a0a, #201505)', iconImage: `${CLOUD_BASE}/赛事兑换卷-removebg-preview.png` },
  exchange_blue: { emoji: '🔵', label: '兑换券', tagColor: '#4488FF', bgColor: 'linear-gradient(135deg,#0a1a4a,#080828)', bgGradient: 'linear-gradient(135deg, #151550, #0a0a30)', iconImage: `${CLOUD_BASE}/蓝buff兑换卷-removebg-preview.png` },
}

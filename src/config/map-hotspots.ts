// config/map-hotspots.ts
// 藏宝图POI热区坐标配置

// 地图图标云存储 File ID
const mapIconFileIDs = {
  redBuff: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/红buff.png',
  blueBuff: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/蓝buff.png',
  tower: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/防御塔.png',
  spiritLighthouse: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/泉水 (1).png',
  arena: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/比赛场馆 (1).png',
  ag: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/AG超玩会队标.png',
}

// 类型样式配置
export const TYPE_STYLE: Record<string, { color: string; icon: string; label: string; bg: string; image: string }> = {
  red_buff: {
    color: '#FF4444',
    icon: '🔴',
    label: '红Buff',
    bg: 'linear-gradient(135deg,#4a1010,#2a0808)',
    image: mapIconFileIDs.redBuff
  },
  blue_buff: {
    color: '#4488FF',
    icon: '🔵',
    label: '蓝Buff',
    bg: 'linear-gradient(135deg,#0a1a4a,#080828)',
    image: mapIconFileIDs.blueBuff
  },
  tower: {
    color: '#FFCC00',
    icon: '🏰',
    label: '防御塔',
    bg: 'linear-gradient(135deg,#4a3a00,#282000)',
    image: mapIconFileIDs.tower
  },
  spirit_lighthouse: {
    color: '#00E5FF',
    icon: '💎',
    label: '泉水',
    bg: 'linear-gradient(135deg,#003a4a,#002028)',
    image: mapIconFileIDs.spiritLighthouse
  },
  arena: {
    color: '#FF6600',
    icon: '⚔️',
    label: '赛场',
    bg: 'linear-gradient(135deg,#4a2800,#281400)',
    image: mapIconFileIDs.arena
  },
  AG: {
    color: '#FF6600',
    icon: '🏆',
    label: 'AG超玩会',
    bg: 'linear-gradient(135deg,#4a2800,#281400)',
    image: mapIconFileIDs.ag
  },
}

// POI热区数据接口
export interface MapHotspot {
  id: number
  seq: number
  name: string
  type: string
  x: number  // 百分比 0-100
  y: number  // 百分比 0-100
  isStart?: boolean
  isEnd?: boolean
  brief: string
  price: string
  duration: string
  image?: string
}

// 图片云存储路径
export const MAP_IMAGES: Record<number, string> = {
  1: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/卡通藏宝图/宽窄巷子.png',
  2: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/卡通藏宝图/锦里古街.png',
  3: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/卡通藏宝图/春熙太古里.png',
}

// 路线热区数据
export const MAP_HOTSPOTS: Record<number, MapHotspot[]> = {
  // ===== 路线一：宽窄巷子探秘 =====
  // 根据实际AI生成图片校准坐标（图片缩小15%后的适配坐标）
  1: [
    {
      id: 26,
      seq: 1,
      name: '宽窄巷子',
      type: 'tower',
      x: 25,
      y: 37,
      isStart: true,
      brief: '由宽巷子、窄巷子、井巷子组成的清朝古街',
      price: '免费',
      duration: '1.5-2小时',
      image: ''
    },
    {
      id: 6,
      seq: 2,
      name: '成都院子酒店',
      type: 'spirit_lighthouse',
      x: 39,
      y: 15,
      brief: '16座川西院落组成的非遗文化主题酒店',
      price: '800元起/晚',
      duration: '过夜',
      image: ''
    },
    {
      id: 21,
      seq: 3,
      name: '贺记蛋烘糕',
      type: 'red_buff',
      x: 69,
      y: 20,
      brief: '清朝传下来的成都传统小吃，外酥内软',
      price: '人均3-8元',
      duration: '10-15分钟',
      image: ''
    },
    {
      id: 15,
      seq: 4,
      name: '洞子口张老二凉粉',
      type: 'red_buff',
      x: 83,
      y: 37,
      brief: '文殊院旁百年老店，甜水面五味俱全',
      price: '人均10-15元',
      duration: '20-30分钟',
      image: ''
    },
    {
      id: 27,
      seq: 5,
      name: '文殊院',
      type: 'spirit_lighthouse',
      x: 79,
      y: 56,
      brief: '千年禅林，红墙银杏，盖碗茶文化体验地',
      price: '免费',
      duration: '1-2小时',
      image: ''
    },
    {
      id: 14,
      seq: 6,
      name: '明婷饭店',
      type: 'red_buff',
      x: 79,
      y: 76,
      brief: '老字号苍蝇馆子之王，味道霸道性价比高',
      price: '人均70元',
      duration: '1-1.5小时',
      image: ''
    },
    {
      id: 16,
      seq: 7,
      name: '陈麻婆豆腐',
      type: 'red_buff',
      x: 47,
      y: 60,
      brief: '始创于清朝同治年间的川菜代表名菜',
      price: '人均60-80元',
      duration: '1-1.5小时',
      image: ''
    },
    {
      id: 17,
      seq: 8,
      name: '乐山钵钵鸡',
      type: 'red_buff',
      x: 26,
      y: 78,
      isEnd: true,
      brief: '冷串串浸在秘制红油中，麻辣鲜香',
      price: '人均30-40元',
      duration: '40-60分钟',
      image: ''
    },
  ],

  // ===== 路线二：锦里古街漫游 =====
  2: [
    {
      id: 24,
      seq: 1,
      name: '锦里古街',
      type: 'red_buff',
      x: 28,
      y: 32,
      isStart: true,
      brief: '三国文化主题街区，夜晚灯笼亮起仿佛穿越',
      price: '免费',
      duration: '1-2小时',
      image: ''
    },
    {
      id: 9,
      seq: 2,
      name: '武侯祠',
      type: 'blue_buff',
      x: 62,
      y: 39,
      brief: '中国唯一君臣合祀祠庙，纪念诸葛亮与刘备',
      price: '门票50元',
      duration: '2-3小时',
      image: ''
    },
    {
      id: 25,
      seq: 3,
      name: '杜甫草堂',
      type: 'tower',
      x: 59,
      y: 77,
      brief: '诗圣杜甫流寓成都的故居',
      price: '门票50元',
      duration: '1.5-2小时',
      image: ''
    },
    {
      id: 19,
      seq: 4,
      name: '沈堂甜水面',
      type: 'red_buff',
      x: 81,
      y: 55,
      brief: '藏在居民楼下的神级摊子，面条粗韧有嚼劲',
      price: '人均15元',
      duration: '20分钟',
      image: ''
    },
    {
      id: 32,
      seq: 5,
      name: 'AG电竞中心',
      type: 'AG',
      x: 22,
      y: 59,
      brief: '西南最大专业级XR数字电竞场馆',
      price: '根据赛事定价',
      duration: '2-3小时',
      image: ''
    },
    {
      id: 10,
      seq: 6,
      name: '金沙遗址',
      type: 'blue_buff',
      x: 77,
      y: 17,
      isEnd: true,
      brief: '古蜀文明的黄金密码，太阳神鸟金饰震撼人心',
      price: '门票70元',
      duration: '2-3小时',
      image: ''
    },
  ],

  // ===== 路线三：太古里巡礼 =====
  3: [
    {
      id: 28,
      seq: 1,
      name: '春熙路/太古里',
      type: 'spirit_lighthouse',
      x: 38,
      y: 45,
      isStart: true,
      brief: '成都最繁华的时尚中心，IFS爬墙熊猫打卡地',
      price: '免费',
      duration: '2-3小时',
      image: ''
    },
    {
      id: 18,
      seq: 2,
      name: '吼堂老火锅',
      type: 'red_buff',
      x: 28,
      y: 70,
      brief: '复古网红火锅，新鲜食材+地道牛油锅底',
      price: '人均100-120元',
      duration: '1.5-2小时',
      image: ''
    },
    {
      id: 20,
      seq: 3,
      name: '西月城潭豆花',
      type: 'red_buff',
      x: 72,
      y: 55,
      brief: '冰醉豆花用醪糟制作，冰爽香甜的解辣神器',
      price: '人均20-30元',
      duration: '30分钟',
      image: ''
    },
    {
      id: 31,
      seq: 4,
      name: '量子光电竞中心',
      type: 'arena',
      x: 79,
      y: 39,
      brief: 'KPL西部主场，承载了成都电竞的热血记忆',
      price: '根据赛事定价',
      duration: '2-3小时',
      image: ''
    },
    {
      id: 22,
      seq: 5,
      name: '小妹蹄花',
      type: 'red_buff',
      x: 73,
      y: 72,
      isEnd: true,
      brief: '蹄花炖得软烂脱骨，深夜慰藉的佳品',
      price: '人均40元',
      duration: '30-40分钟',
      image: ''
    },
  ],
}

// 成都路线配置
export const ROUTES_CHENGDU = [
  {
    id: 1,
    name: '宽窄巷子探秘',
    difficulty: 'easy',
    difficultyLabel: '简单',
    duration: '约2小时',
    distance: '约2.3km',
    description: '漫步千年古巷，穿越宽窄之间品味老成都的烟火与文艺',
    tags: ['🏮1个荣耀灯塔', '⭐2个选手足迹'],
    pois: [
      { id: 26, name: '宽窄巷子', type: 'tower', lat: 30.6690, lng: 104.0550, isStart: true, brief: '由宽巷子、窄巷子、井巷子组成的清朝古街', image: '' },
      { id: 6,  name: '成都院子酒店', type: 'spirit_lighthouse', lat: 30.6755, lng: 104.0480, brief: '16座川西院落组成的非遗文化主题酒店', image: '' },
      { id: 21, name: '贺记蛋烘糕', type: 'red_buff', lat: 30.6740, lng: 104.0770, brief: '清朝传下来的成都传统小吃，外酥内软', image: '' },
      { id: 15, name: '洞子口张老二凉粉', type: 'red_buff', lat: 30.6755, lng: 104.0760, brief: '文殊院旁百年老店，甜水面五味俱全', image: '' },
      { id: 27, name: '文殊院', type: 'spirit_lighthouse', lat: 30.6750, lng: 104.0760, brief: '千年禅林，红墙银杏，盖碗茶文化体验地', image: '' },
      { id: 14, name: '明婷饭店', type: 'red_buff', lat: 30.6740, lng: 104.0780, brief: '老字号苍蝇馆子之王，味道霸道性价比高', image: '' },
      { id: 16, name: '陈麻婆豆腐', type: 'red_buff', lat: 30.6650, lng: 104.0750, brief: '始创于清朝同治年间的川菜代表名菜', image: '' },
      { id: 17, name: '乐山钵钵鸡', type: 'red_buff', lat: 30.6620, lng: 104.0580, isEnd: true, brief: '冷串串浸在秘制红油中，麻辣鲜香', image: '' },
    ],
    hiddenPois: [
      { id: 'h1_1', name: '???', type: 'beacon', lat: 30.6700, lng: 104.0600, hint: '荣耀灯塔' },
      { id: 'h1_2', name: '???', type: 'trace',  lat: 30.6710, lng: 104.0680, hint: '选手足迹' },
      { id: 'h1_3', name: '???', type: 'trace',  lat: 30.6660, lng: 104.0660, hint: '选手足迹' },
    ],
    boundaries: ['kuanzhai', 'wenshu']
  },
  {
    id: 2,
    name: '锦里古街漫游',
    difficulty: 'medium',
    difficultyLabel: '中等',
    duration: '约1.5小时',
    distance: '约1.8km',
    description: '穿越三国风云，在锦里与武侯祠间寻找英雄足迹',
    tags: ['🏮2个荣耀灯塔', '⭐1个选手足迹'],
    pois: [
      { id: 24, name: '锦里古街', type: 'red_buff', lat: 30.6450, lng: 104.0490, isStart: true, brief: '三国文化主题街区，夜晚灯笼亮起仿佛穿越', image: '' },
      { id: 9,  name: '武侯祠', type: 'blue_buff', lat: 30.6420, lng: 104.0470, brief: '中国唯一君臣合祀祠庙', image: '' },
      { id: 25, name: '杜甫草堂', type: 'tower', lat: 30.6245, lng: 104.0550, brief: '诗圣杜甫流寓成都故居', image: '' },
      { id: 19, name: '沈堂甜水面', type: 'red_buff', lat: 30.6350, lng: 104.0550, brief: '藏在居民楼下的神级摊子', image: '' },
      { id: 32, name: 'AG电竞中心', type: 'club', lat: 30.6500, lng: 104.0300, brief: '西南最大专业级XR数字电竞场馆', image: '' },
      { id: 10, name: '金沙遗址', type: 'blue_buff', lat: 30.6680, lng: 104.0280, isEnd: true, brief: '古蜀文明的黄金密码', image: '' },
    ],
    hiddenPois: [
      { id: 'h2_1', name: '???', type: 'beacon', lat: 30.6400, lng: 104.0450, hint: '荣耀灯塔' },
      { id: 'h2_2', name: '???', type: 'beacon', lat: 30.6550, lng: 104.0350, hint: '荣耀灯塔' },
      { id: 'h2_3', name: '???', type: 'trace',  lat: 30.6480, lng: 104.0400, hint: '选手足迹' },
    ],
    boundaries: ['jinli', 'wuhou', 'caotang']
  },
  {
    id: 3,
    name: '太古里巡礼',
    difficulty: 'hard',
    difficultyLabel: '困难',
    duration: '约1小时',
    distance: '约1.2km',
    description: '成都最繁华的心脏地带，霓虹之下藏着最多的峡谷秘密',
    tags: ['🏮1个荣耀灯塔', '⭐3个选手足迹'],
    pois: [
      { id: 28, name: '春熙路/太古里', type: 'spirit_lighthouse', lat: 30.6560, lng: 104.0820, isStart: true, brief: '成都最繁华的时尚中心', image: '' },
      { id: 18, name: '吼堂老火锅', type: 'red_buff', lat: 30.6560, lng: 104.0810, brief: '复古网红火锅，地道牛油锅底', image: '' },
      { id: 20, name: '西月城潭豆花', type: 'red_buff', lat: 30.6580, lng: 104.0820, brief: '冰醉豆花解辣神器', image: '' },
      { id: 31, name: '量子光电竞中心', type: 'arena', lat: 30.6600, lng: 104.0900, brief: 'KPL西部主场', image: '' },
      { id: 22, name: '小妹蹄花', type: 'red_buff', lat: 30.6480, lng: 104.0890, isEnd: true, brief: '蹄花炖得软烂脱骨', image: '' },
    ],
    hiddenPois: [
      { id: 'bond_cd_04', name: '???', type: 'beacon', lat: 30.6548, lng: 104.0800, hint: '荣耀灯塔' },
      { id: 'bond_cd_01', name: '???', type: 'trace',  lat: 30.6590, lng: 104.0790, hint: '选手足迹' },
      { id: 'bond_cd_02', name: '???', type: 'trace',  lat: 30.6555, lng: 104.0835, hint: '选手足迹' },
      { id: 'bond_cd_03', name: '???', type: 'trace',  lat: 30.6572, lng: 104.0817, hint: '选手足迹' },
    ],
    boundaries: ['chunxi']
  }
];

// POI类型配置
export const TYPE_CONFIG: Record<string, TypeConfig> = {
  red_buff:           { color: '#FF4444', icon: '🔴', label: '红Buff',  bg: 'linear-gradient(135deg,#4a1010,#2a0808)' },
  blue_buff:          { color: '#4488FF', icon: '🔵', label: '蓝Buff',  bg: 'linear-gradient(135deg,#0a1a4a,#080828)' },
  tower:              { color: '#FFCC00', icon: '🏰', label: '防御塔',  bg: 'linear-gradient(135deg,#4a3a00,#282000)' },
  spirit_lighthouse:  { color: '#00E5FF', icon: '🏮', label: '泉水',    bg: 'linear-gradient(135deg,#003a4a,#002028)' },
  arena:              { color: '#FF6600', icon: '🏟️', label: '赛场',    bg: 'linear-gradient(135deg,#4a2800,#281400)' },
  club:               { color: '#E040FB', icon: '🏆', label: '俱乐部', bg: 'linear-gradient(135deg,#3a0a4a,#200828)' },
  beacon:             { color: '#FFD700', icon: '❓', label: '???',     bg: 'linear-gradient(135deg,#3a3000,#201a00)' },
  trace:              { color: '#C0C0C0', icon: '❓', label: '???',     bg: 'linear-gradient(135deg,#2a2a2a,#181818)' },
  spirit:             { color: '#00E5FF', icon: '🏮', label: '泉水',    bg: 'linear-gradient(135deg,#003a4a,#002028)' },
};

// 兼容旧版本的POI_STYLE
export const POI_STYLE = {
  red_buff: { color: '#FF4444', glow: 'rgba(255,68,68,0.5)', icon: '🔴', label: '红Buff' },
  blue_buff: { color: '#4488FF', glow: 'rgba(68,136,255,0.5)', icon: '🔵', label: '蓝Buff' },
  tower: { color: '#FFCC00', glow: 'rgba(255,204,0,0.5)', icon: '🏰', label: '防御塔' },
  spirit: { color: '#00E5FF', glow: 'rgba(0,229,255,0.5)', icon: '🏮', label: '泉水' },
  spirit_lighthouse: { color: '#00E5FF', glow: 'rgba(0,229,255,0.5)', icon: '🏮', label: '荣耀灯塔' },
  arena: { color: '#FF6600', glow: 'rgba(255,102,0,0.5)', icon: '🏟️', label: '赛场' },
  club: { color: '#FFD700', glow: 'rgba(255,215,0,0.6)', icon: '🏆', label: '电竞俱乐部' },
  beacon: { color: '#FFD700', glow: 'rgba(255,215,0,0.6)', icon: '❓', label: '???' },
  trace: { color: '#C0C0C0', glow: 'rgba(192,192,192,0.4)', icon: '❓', label: '???' },
};

export const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#F44336',
};

export interface TypeConfig {
  color: string;
  icon: string;
  label: string;
  bg: string;
}

export interface RoutePOI {
  id: number | string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  isStart?: boolean;
  isEnd?: boolean;
  brief: string;
  image?: string;
  price?: string;
  duration?: string;
}

export interface HiddenPOI {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  hint: string;
}

export interface RouteConfig {
  id: number;
  name: string;
  difficulty: string;
  difficultyLabel: string;
  duration: string;
  distance: string;
  description: string;
  tags: string[];
  pois: RoutePOI[];
  hiddenPois: HiddenPOI[];
  boundaries: string[];
}

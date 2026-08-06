// 管理员类型定义

export interface AdminUser {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  role: 'super_admin';
  lastLoginAt: string;
}

export interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
}

export interface POI {
  id: string;
  cityCode: string;
  name: string;
  type: string;
  category: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  triggerRadius: number;
  description: string;
  images: string[];
  heroNarrations: Record<string, string>;
  rewards?: {
    bondValue: number;
    items?: RewardItem[];
  };
  spiritEvent?: SpiritEvent;
  playerBond?: PlayerBond;
  merchantId?: string;
  status: 'active' | 'inactive';
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardItem {
  type: string;
  id: string;
  name: string;
}

export interface SpiritEvent {
  eventName: string;
  year: number;
  spiritKeyword: string;
  badgeId: string;
  heroNarration: Record<string, string>;
  easterEgg?: EasterEggQA;
}

export interface PlayerBond {
  teamName: string;
  era: string;
  story: string;
  quote: string;
  quoteSource: string;
  heroNarration: Record<string, string>;
  bookmarkId: string;
}

export interface EasterEggQA {
  question: string;
  options: string[];
  followUp: Record<string, string>;
}

export interface Merchant {
  id: string;
  name: string;
  logo?: string;
  contact: string;
  phone: string;
  address: string;
  category: string;
  openTime: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CouponDefinition {
  id: string;
  name: string;
  type: 'coupon' | 'exchange' | 'experience';
  subType: 'red' | 'blue' | 'hotel' | 'esports';
  image?: string;
  discountType: 'discount' | 'amount' | 'exchange';
  discountValue: string;
  minAmount?: number;
  validDays: number;
  usageLimit: number;
  totalLimit: number;
  issuedCount?: number;
  usedCount?: number;
  merchantId?: string;
  poiIds: string[];
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Route {
  id: string;
  cityCode: string;
  name: string;
  description: string;
  duration: string;
  difficulty: 'easy' | 'normal' | 'hard';
  distance: number;
  poiSequence: string[];
  tags: string[];
  spiritLighthouseCount: number;
  playerFootprintCount: number;
  recommendedHeroes: string[];
  coverImage?: string;
  status: 'active' | 'inactive';
}

export interface AppUser {
  id: string;
  nickname: string;
  avatar?: string;
  currentHeroId: string;
  heroBonds: Record<string, {
    bondValue: number;
    bondLevel: number;
  }>;
  badges: string[];
  totalSteps: number;
  totalDistance: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface DashboardStats {
  todayActiveUsers: number;
  todayCheckins: number;
  totalUsers: number;
  couponUsageRate: number;
  trends: {
    date: string;
    checkins: number;
    newUsers: number;
  }[];
  hotPois: {
    poiId: string;
    poiName: string;
    count: number;
  }[];
}

export interface POITypeConfig {
  id: string;
  typeCode: string;
  typeName: string;
  icon: string;
  color: string;
  description: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

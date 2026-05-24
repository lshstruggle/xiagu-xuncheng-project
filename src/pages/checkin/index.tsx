import { View, Text, Map, Image, CoverView, ScrollView, Video, Input } from '@tarojs/components'
import { useState, useEffect, useRef, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import MemoryOverlay from '../../components/memory-overlay'
import TreasureMap from '../../components/treasure-map'
import RewardPopup, { RewardPopupRef } from '../../components/reward-popup'
import FragmentRewardPopup from '../../components/fragment-reward-popup'
import MVPReportModal from '../../components/mvp-report-modal'
import MVPPoster from '../../components/mvp-poster'
import StoryDialog from '../../components/story-dialog'
import StoryRoute from '../../components/story-route'
import WebPet from '../../components/web-pet'
import TowerQuizModal from '../../components/tower-quiz-modal'
import { ALL_EASTER_EGGS } from '../../config/bond-traces-chengdu'
import { getTempFileURL, preloadAllTempURLs } from '../../utils/temp-url-cache'
import { heroAvatarFileIDs, bottomIconFileIDs, getHeroAvatar, getBottomIcon, preloadAllCloudImages } from '../../utils/cloud-assets'
import './index.scss'
import { api } from '../../services/api'
import { playBase64Audio } from '../../services/tts-player'
import { doLogin, isLoggedIn, getUser } from '../../services/auth'
import { shouldShowDailyReport } from '../../services/daily-report'
import type { MVPReportData } from '../../services/daily-report'
import type { TransitRouteDetail } from '../../utils/map-route'
// 故事系统导入
import type { StoryMode, StoryNode, UserStoryProgress } from '../../types/story'
import {
  getExploreMode,
  setExploreMode,
  getCurrentStoryProgress,
  getStoryById,
  getStoryByHero,
  startStory,
  clearStoryProgress,
  checkStoryTrigger,
  advanceStory,
  claimNodeRewards,
  completeStory,
  pauseStory,
  resumeStory
} from '../../services/story'
// 自由模式欢迎剧情
import { freeModeWelcomeNode, shouldShowFreeModeWelcome, markFreeModeWelcomeShown } from '../../data/free-mode-welcome'

// POI标记数据类型
interface POIMarker {
  id: number
  latitude: number
  longitude: number
  iconPath: string
  width: number
  height: number
  title: string
  type: 'blue_buff' | 'red_buff' | 'tower' | 'spirit_lighthouse' | 'player_footprint' | 'club' | 'arena'
  anchor?: { x: number; y: number }
  // 详细信息字段
  category?: string
  story?: string
  esportChallenge?: string
  address?: string
  price?: string
  duration?: string
  tips?: string
  transport?: string
  events?: string
  // 云存储图标标识
  iconType?: 'redBuff' | 'blueBuff' | 'tower' | 'spiritLighthouse' | 'club' | 'arena'
}

// 地图图标云存储 File ID 配置
const mapIconFileIDs: Record<string, string> = {
  redBuff: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/红buff.png',
  blueBuff: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/蓝buff.png',
  tower: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/防御塔.png',
  spiritLighthouse: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/泉水 (1).png',
  club: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/AG超玩会队标.png',
  arena: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/地图ui/比赛场馆 (1).png',
}

// 获取POI对应的图标类型
const getIconType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'blue_buff': 'blueBuff',
    'red_buff': 'redBuff',
    'tower': 'tower',
    'spirit_lighthouse': 'spiritLighthouse',
    'club': 'club',
    'arena': 'arena',
    'player_footprint': 'blueBuff', // 默认使用蓝buff图标
  }
  return typeMap[type] || 'blueBuff'
}

// 地图POI数据 - 成都文旅电竞点位
const mockPOIs: POIMarker[] = [
  // ========== 蓝Buff - 知识问答/补给点 ==========
  // 住宿
  { id: 1, latitude: 30.6575, longitude: 104.082, title: '禅驿·锦官里', type: 'blue_buff', iconPath: '', width: 48, height: 48 },
  { id: 2, latitude: 30.655, longitude: 104.0845, title: '盈嘉･云曦天际S酒店', type: 'blue_buff', iconPath: '', width: 48, height: 48 },
  { id: 3, latitude: 30.6245, longitude: 104.2185, title: '栖牛·自助投影民宿', type: 'blue_buff', iconPath: '', width: 48, height: 48 },
  // 景点
  { 
    id: 9, latitude: 30.642, longitude: 104.047, title: '武侯祠', type: 'blue_buff', iconPath: '', width: 48, height: 48,
    category: '历史古迹',
    story: '中国唯一君臣合祀祠庙，纪念诸葛亮与刘备。杜甫"丞相祠堂何处寻"即指此地。',
    esportChallenge: '问答：诸葛亮在游戏中是哪位英雄的原型？（司马懿、元歌等）。挑战：在"三绝碑"前，AR扫描找出碑文中关于"诚"字的典故。',
    address: '武侯区武侯祠大街231号',
    price: '门票50元',
    duration: '2-3小时',
    tips: '红墙竹影是绝佳拍照点'
  },
  { 
    id: 10, latitude: 30.668, longitude: 104.028, title: '金沙遗址博物馆', type: 'blue_buff', iconPath: '', width: 48, height: 48,
    category: '考古遗址',
    story: '揭秘古蜀文明的"黄金密码"，太阳神鸟金饰和象牙祭祀坑震撼人心，是探索神秘古蜀文明的必去之地。',
    esportChallenge: '问答：古蜀文明的代表图腾"太阳神鸟"与游戏中的哪位英雄（如云中君、后羿）的意象有共通之处？挑战：在遗迹馆内，寻找并AR扫描三件最具"神性"的文物，解锁"远古之力"Buff。',
    address: '青羊区金沙遗址路2号',
    price: '门票70元',
    duration: '2-3小时',
    tips: '镇馆之宝"太阳神鸟"金饰不容错过'
  },
  { 
    id: 11, latitude: 30.998, longitude: 103.618, title: '都江堰水利工程', type: 'blue_buff', iconPath: '', width: 48, height: 48,
    category: '古代工程',
    story: '世界文化遗产，两千年前由李冰父子主持修建的无坝引水水利工程，至今仍在使用，堪称古代智慧结晶。',
    esportChallenge: '挑战：在鱼嘴分水堤，使用AR工具模拟"分江导流"，成功者可获得"智慧（蓝Buff）"加成，提升后续答题正确率。',
    address: '都江堰市城西',
    price: '门票80元',
    duration: '3-4小时',
    tips: '通常与青城山安排在同一天游览，晚上可看南桥"蓝眼泪"夜景'
  },
  { 
    id: 12, latitude: 30.908, longitude: 103.562, title: '青城山（前山）', type: 'blue_buff', iconPath: '', width: 48, height: 48,
    category: '自然/道教',
    story: '道教发源地之一，以"青城天下幽"著称，山林幽深，古道幽静。',
    esportChallenge: '故事：李白："此地灵气充沛，堪比蓝区。在此打坐（拍照打卡），可快速回复法力值（体力）。"',
    address: '都江堰市西南',
    price: '门票80元（前山）',
    duration: '4-5小时',
    tips: '前山观人文古迹（建福宫、天师洞），后山赏自然风光，夏日避暑绝佳'
  },
  { 
    id: 13, latitude: 30.735, longitude: 104.147, title: '成都大熊猫繁育研究基地', type: 'blue_buff', iconPath: '', width: 48, height: 48,
    category: '动物保护',
    story: '全球最大的大熊猫科研基地，可近距离观察憨态可掬的国宝，看熊猫宝宝喝奶的萌态。',
    esportChallenge: '问答：大熊猫的"黑白皮肤"在游戏中常被用来比喻哪位英雄的经典皮肤？（例如梦奇、阿古朵的熊猫皮肤）。挑战：在"月亮产房"找到一只正在睡觉的熊猫幼崽并合影，获得"萌即正义"状态，当日所有消费享9折。',
    address: '成华区熊猫大道1375号',
    price: '门票55元',
    duration: '3-4小时',
    tips: '一定要早点去（7:30开园），上午熊猫最活跃；基地较大，建议乘坐观光车'
  },
  
  // ========== 红Buff - 消费/挑战点 ==========
  // 住宿
  { id: 4, latitude: 30.6745, longitude: 104.065, title: '凡间精品民宿', type: 'red_buff', iconPath: '', width: 48, height: 48 },
  { id: 5, latitude: 30.6715, longitude: 104.1025, title: '果然24房', type: 'red_buff', iconPath: '', width: 48, height: 48 },
  // 美食
  { 
    id: 14, latitude: 30.674, longitude: 104.078, title: '明婷饭店', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '川菜',
    story: '老字号"苍蝇馆子"之王，从曹家巷菜市场边的小店起家，味道霸道，性价比高。',
    esportChallenge: '红Buff：打卡后领取"攻击加成"——"霸王别姬"双人套餐优惠券。',
    address: '金牛区外曹家巷26号附16号',
    price: '人均70元',
    duration: '1-1.5小时',
    tips: '饭点排队恐怖，建议错峰或提前前往'
  },
  { 
    id: 15, latitude: 30.6755, longitude: 104.076, title: '洞子口张老二凉粉', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '小吃',
    story: '文殊院旁的百年老店，甜水面酱料秘制，甜咸麻辣香五味俱全，是许多老成都的味觉记忆。',
    esportChallenge: '故事：李白："这面条劲道，如我剑气般柔中带刚！吃完这碗韧性，推塔更有力。"',
    address: '青羊区文殊院街39号',
    price: '人均10-15元',
    duration: '20-30分钟',
    tips: '就在文殊院门口，可一并游玩；甜水面要拌匀再吃'
  },
  { 
    id: 16, latitude: 30.665, longitude: 104.075, title: '陈麻婆豆腐（总店）', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '川菜',
    story: '始创于清朝同治初年的百年老字号，麻婆豆腐麻辣鲜香烫酥嫩，是川菜的代表名菜。',
    esportChallenge: '问答：游戏中的"麻辣香锅"队，和这道"麻婆豆腐"在味觉体验上有什么共通之处？（都强调强烈的感官冲击与团队配合）',
    address: '青羊区东华门街51号（骡马市店）',
    price: '人均60-80元',
    duration: '1-1.5小时',
    tips: '麻婆豆腐必点，建议搭配米饭；总店味道最正宗'
  },
  { 
    id: 17, latitude: 30.662, longitude: 104.058, title: '乐山鲜知味钵钵鸡（奎星楼店）', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '小吃/串串',
    story: '乐山风味在成都的人气代表，串串自选，浸泡在秘制红油或藤椒油中，麻辣鲜香，冷吃方便。',
    esportChallenge: '红Buff：消费满一定金额，可参与"抽签"小游戏，抽中"上上签"可获得"暴击"折扣或免费小吃一份。',
    address: '青羊区奎星楼街（多家分店）',
    price: '人均30-40元',
    duration: '40-60分钟',
    tips: '下午4点后需排队，建议错峰；搭配冰粉解辣'
  },
  { 
    id: 18, latitude: 30.656, longitude: 104.081, title: '吼堂老火锅（太古里店）', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '火锅',
    story: '复古装修风格，人气火爆的网红火锅店，以新鲜的食材和地道的牛油锅底著称。',
    esportChallenge: '故事：李白："在这沸腾的战场（火锅）中涮肉，犹如在峡谷中穿梭击杀，讲究的就是一个快、准、狠！"',
    address: '锦江区东大街下东大街段166号（近太古里）',
    price: '人均100-120元',
    duration: '1.5-2小时',
    tips: '提前在线上取号！锅底建议微辣起步'
  },
  { 
    id: 19, latitude: 30.635, longitude: 104.055, title: '沈堂甜水面', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '小吃',
    story: '藏在玉林路居民楼下的神级摊子，面条粗韧有嚼劲，甜辣酱裹满每一根，味道经典。',
    esportChallenge: '挑战：在1分钟内"嗦"完一碗甜水面且不咬断，即可获得"持久之力"Buff，当日店内消费享折扣。',
    address: '武侯区芳草街新能巷2号',
    price: '人均15元',
    duration: '20分钟',
    tips: '只卖中午（营业至14:00），去晚可能就吃不到了'
  },
  { 
    id: 20, latitude: 30.658, longitude: 104.082, title: '西月城潭豆花（春熙路店）', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '小吃',
    story: '老字号小吃店，冰醉豆花用醪糟制作，冰爽香甜，是解辣神器；甜水面也备受好评。',
    esportChallenge: '泉水：吃完一碗冰醉豆花，获得"清凉（减速抵抗）"Buff，30分钟内对辣味的耐受度小幅提升。',
    address: '锦江区暑袜北一街（近春熙路）',
    price: '人均20-30元',
    duration: '30分钟',
    tips: '冰醉豆花和甜水面是绝配，建议都尝尝'
  },
  { 
    id: 21, latitude: 30.674, longitude: 104.077, title: '贺记蛋烘糕', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '小吃',
    story: '从清朝流传下来的成都传统小吃，贺记是知名品牌，外皮酥脆，内馅丰富，是许多成都人的童年回忆。',
    esportChallenge: '红Buff：集齐咸、甜、怪味三种口味的蛋烘糕打卡照，可兑换一个"神秘馅料"蛋烘糕（店家随机赠送）。',
    address: '多家分店（如青羊区文殊院街）',
    price: '人均3-8元/个',
    duration: '10-15分钟',
    tips: '现做现吃口感最佳；奶油肉松味是经典'
  },
  { 
    id: 22, latitude: 30.648, longitude: 104.089, title: '小妹滋补蹄花（望平街店）', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '小吃/夜宵',
    story: '成都夜蹄花代表之一，蹄花炖得软烂脱骨，汤头乳白浓郁，搭配蘸碟，是深夜慰藉的佳品。',
    esportChallenge: '故事：李白："这蹄花汤，滋补如霸者重装，吃完顿觉气血回复，又能再战三百回合！"',
    address: '成华区望平街（近香香巷）',
    price: '人均40元',
    duration: '30-40分钟',
    tips: '适合喜欢清淡口味或作为夜宵；可搭配凉拌菜'
  },
  { 
    id: 23, latitude: 30.648, longitude: 104.088, title: '马路边边麻辣烫', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '串串香',
    story: '怀旧风格的串串香店，还原老成都街边麻辣烫的感觉，蘸碟是灵魂。',
    esportChallenge: '防御塔：在店内找到并扫描三处怀旧物件（如老式电视机、收音机），可解锁"复古皮肤"优惠，享受特定菜品折扣。',
    address: '多家分店（如锦江区致民路店）',
    price: '人均60-80元',
    duration: '1-1.5小时',
    tips: '蘸碟推荐干碟配牛肉，油碟配蔬菜'
  },
  // 街区
  { 
    id: 24, latitude: 30.645, longitude: 104.049, title: '锦里古街', type: 'red_buff', iconPath: '', width: 48, height: 48,
    category: '民俗街区',
    story: '紧邻武侯祠的三国文化主题街区，夜晚灯笼亮起时仿佛穿越千年，汇聚川西民俗与地道小吃。',
    esportChallenge: '红Buff：在古街内找到三家售卖"三国"主题文创的店铺并打卡，可领取"攻击力"优惠券，用于指定美食消费。',
    address: '武侯区武侯祠旁',
    price: '免费',
    duration: '1-2小时',
    tips: '建议傍晚前往，华灯初上时氛围最佳；小吃价格偏高，建议浅尝'
  },
  
  // ========== 防御塔 - 文化地标/AR挑战 ==========
  // 住宿
  { id: 6, latitude: 30.6755, longitude: 104.048, title: '成都院子酒店', type: 'tower', iconPath: '', width: 56, height: 56 },
  // 景点
  { 
    id: 25, latitude: 30.6245, longitude: 104.055, title: '杜甫草堂', type: 'tower', iconPath: '', width: 56, height: 56,
    category: '文学圣地',
    story: '诗圣杜甫流寓成都的故居，《茅屋为秋风所破歌》诞生地。',
    esportChallenge: '故事：李白可调侃："杜子美在此栖身时，可没少写诗抱怨屋子破。哪像我们剑客，以天为被，以地为席！"',
    address: '青羊区青华路37号',
    price: '门票50元',
    duration: '1.5-2小时',
    tips: '雨天游览别有韵味，隔壁浣花溪竹林可一并游玩'
  },
  { 
    id: 26, latitude: 30.669, longitude: 104.055, title: '宽窄巷子', type: 'tower', iconPath: '', width: 56, height: 56,
    category: '历史街区',
    story: '由宽巷子、窄巷子、井巷子平行排列组成，是清朝古街与现代文艺的完美融合。',
    esportChallenge: '防御塔：在巷子里的"砖"文化墙、网红书店等地设置AR打卡点，集齐三个点可召唤"城市守护灵"（虚拟形象），解锁隐藏故事线。',
    address: '青羊区长顺上街127号',
    price: '免费',
    duration: '1.5-2小时',
    tips: '适合拍照，咖啡馆、手作店、川剧变脸表演一应俱全'
  },
  
  // ========== 泉水 - 故事点/回城补给 ==========
  // 住宿
  { 
    id: 1, latitude: 30.6575, longitude: 104.082, title: '禅驿·锦官里', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '禅意美学',
    story: '隐于市井的静谧空间，有茶道、抄经体验，设计融合东方禅意与现代简约。',
    esportChallenge: '泉水：入住可领取"蓝Buff"，解锁一段"诸葛亮"AI的睡前智慧故事音频，助您好眠。',
    address: '锦江区东风路1号（参考区域）',
    price: '400-600元/晚',
    duration: '过夜',
    tips: '喜静、好文化、追求禅意体验者'
  },
  { 
    id: 7, latitude: 30.6585, longitude: 104.088, title: '背包十年青年旅舍', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '青春文艺',
    story: '设计师青旅，社交氛围好，定期组织观影、桌游、城市徒步等活动，是年轻旅行者的聚集地。',
    esportChallenge: '故事：这里是"野生"召唤师的聚集地，李白可能会在公共留言墙留下"剑谱"（旅行攻略彩蛋）。',
    address: '锦江区红星路二段（参考区域）',
    price: '50-100元/床位',
    duration: '过夜',
    tips: '背包客、年轻玩家、喜欢社交的独行者'
  },
  { 
    id: 4, latitude: 30.6745, longitude: 104.065, title: '凡间精品民宿（文殊院店）', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '温馨网红风',
    story: '地理位置优越，拍照氛围感十足，店家服务暖心（如接送、延迟退房），性价比高。',
    esportChallenge: '红Buff：在民宿指定网红角落拍照打卡并分享，可获得"颜值加成"——免费早餐或饮品券。',
    address: '青羊区文殊院附近',
    price: '150-300元/晚',
    duration: '过夜',
    tips: '情侣、闺蜜、追求高性价比和出片的旅客'
  },
  { 
    id: 2, latitude: 30.655, longitude: 104.0845, title: '盈嘉･云曦天际S高空设计师酒店', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '现代轻奢、高空景观',
    story: '位于太古里商圈高空，部分房间可俯瞰太古里璀璨夜景，配备巨幕投影、智能客控等设施。',
    esportChallenge: '泉水：选择"天际线"房型，在窗边完成"俯瞰水晶"打卡任务，可获得房型升级或延迟退房权益。',
    address: '锦江区南纱帽街77号盈嘉·赢家12楼',
    price: '700-1500元/晚',
    duration: '过夜',
    tips: '追求奢华体验、景观、现代设计感的情侣或家庭'
  },
  { 
    id: 6, latitude: 30.6755, longitude: 104.048, title: '成都院子酒店', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '川西院落、非遗文化主题',
    story: '由16座川西院落组成，以蜀锦、蜀绣等非遗文化为主题，配备管家服务、院落茶吧，文化氛围浓厚。',
    esportChallenge: '故事：入住仿佛穿越回古代"蜀国"。李白："此间院落，颇有我当年与杜甫、高适纵酒论诗之地的神韵。"',
    address: '青羊区文殊坊街区',
    price: '800元起/晚',
    duration: '过夜',
    tips: '喜欢传统文化、静谧院落、深度文化体验的旅客'
  },
  { 
    id: 5, latitude: 30.6715, longitude: 104.1025, title: '果然24房', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '工业复古、创意设计',
    story: '由前苏联援建工厂改造，24个房间有24个主题（如黑胶碟、未来水世界），设计感极强，毗邻东郊记忆艺术区。',
    esportChallenge: '挑战：找到与自己星座或生日对应的主题房并入住，可触发"专属剧情"彩蛋，获得周边小礼物。',
    address: '成华区建设南支路4号（东郊记忆内）',
    price: '300-900元/晚',
    duration: '过夜',
    tips: '文艺青年、设计师、追求独特住宿体验的玩家'
  },
  { 
    id: 3, latitude: 30.6245, longitude: 104.2185, title: '栖牛·自助投影民宿', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '侘寂风、影音主题',
    story: '靠近东安湖体育公园（电竞场馆），房间以侘寂风为主，配备巨幕投影和自助入住设施，适合观影爱好者。',
    esportChallenge: '泉水：民宿提供"赛事回放"片单，观看一场指定《王者荣耀》经典赛事并答对相关问题，可获得零食礼包。',
    address: '龙泉驿区东安湖公园附近',
    price: '200-500元/晚',
    duration: '过夜',
    tips: '电竞观赛爱好者、情侣、家庭、喜欢私密影音空间者'
  },
  { 
    id: 8, latitude: 30.668, longitude: 104.055, title: '融舍·村里民宿', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '市井烟火、现代慢生活',
    story: '独门独院，融合传统成都市井烟火与现代生活，周边有菜市场、小吃店，能感受浓厚的本地生活氛围。',
    esportChallenge: '故事：李白："大隐于市。在此处歇脚，方能体会成都真正的慢生活节奏，如同游戏中对线期的稳健发育。"',
    address: '市区"新二村"内',
    price: '300-600元/晚',
    duration: '过夜',
    tips: '想深度体验成都本地生活、喜欢安静院落的旅客'
  },
  // 景点
  { 
    id: 27, latitude: 30.675, longitude: 104.076, title: '文殊院', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '宗教/文化',
    story: '千年禅林，香火鼎盛，红墙外能体验老成都的盖碗茶文化，素斋"香积厨"口碑爆棚。',
    esportChallenge: '泉水：在香园茶社点一碗盖碗茶，静坐10分钟，即可完成"回城补给"，获得"心静（冷却缩减）"Buff，1小时内思维更清晰。',
    address: '青羊区文殊院街66号',
    price: '免费',
    duration: '1-2小时',
    tips: '后院银杏茶社是绝佳机位，红墙上的"幸""福"字是网红打卡点'
  },
  { 
    id: 28, latitude: 30.656, longitude: 104.082, title: '春熙路/太古里', type: 'spirit_lighthouse', iconPath: '', width: 64, height: 64,
    category: '商业地标',
    story: '成都最繁华的时尚中心，传统与现代结合，是街拍圣地。IFS楼顶的"爬墙大熊猫"雕塑是经典打卡点。',
    esportChallenge: '故事：李白："此地人声鼎沸，经济繁荣，乃我方水晶所在。在此消费（击败野怪），可获得大量金币奖励。"',
    address: '锦江区红星路三段',
    price: '免费',
    duration: '2-3小时',
    tips: '打卡IFS爬墙熊猫，逛方所书店；太古里建筑适合拍照'
  },
  
  // ========== 电竞俱乐部 ==========
  { 
    id: 29, latitude: 30.54, longitude: 104.06, title: '成都AG超玩会', type: 'club', iconPath: '', width: 64, height: 64,
    category: '电竞俱乐部/王朝战队',
    story: 'KPL联盟元老战队，2016年成立，2020年落地成都。2018年曾降级，2019年回归后开启复兴之路，建立辉煌"红色王朝"。KPL史上首支四连冠、五连冠战队，首支在"鸟巢"夺冠的中国电竞战队，队史冠军奖杯已达8座（含世界冠军杯）。',
    esportChallenge: '俱乐部挑战：了解AG王朝历史，认识冠军阵容（轩染、钟意、长生、一诺、大帅），感受六连冠统治力！',
    address: '四川省成都市武侯区高新区吉泰路666号花样年·福年广场T1写字楼',
    price: '免费参观',
    duration: '1-2小时',
    tips: '主场位于成都高新区中国-欧洲中心天府音乐厅，关注战队微博获取最新活动信息'
  },
  
  // ========== 电竞比赛场馆 ==========
  { 
    id: 30, latitude: 30.75, longitude: 104.07, title: '凤凰山体育公园', type: 'arena', iconPath: '', width: 64, height: 64,
    category: '电竞比赛场馆',
    story: '2023年王者荣耀世界冠军杯(KIC)总决赛举办地。成都AG超玩会在此以4:2击败北京WB，时隔1477天再次捧起顶级赛事奖杯，发育路选手一诺成为王者荣耀顶级赛事史上首位发育路FMVP。',
    esportChallenge: '场馆打卡：感受世界冠军杯总决赛现场氛围，回顾AG夺冠历程！',
    address: '成都市金牛区北星大道一段',
    price: '根据赛事定价',
    duration: '3-4小时',
    tips: '公交：46路、168路、157路至"凤凰山体育公园站"；地铁：5号线"杜家碾站"或"九道堰站"',
    transport: '地铁5号线杜家碾站/九道堰站，公交46/168/157路',
    events: '2023年王者荣耀世界冠军杯总决赛'
  },
  { 
    id: 31, latitude: 30.66, longitude: 104.09, title: '量子光电竞中心', type: 'arena', iconPath: '', width: 64, height: 64,
    category: '电竞比赛场馆',
    story: '2018年3月起作为KPL西部主场常规赛场地，是KPL联盟推行主客场制时设立的西部主场。在两年多的时间里承办了数百场KPL常规赛，为成都积累了首批线下电竞观众，标志着成都成为早期两大赛区主场之一。',
    esportChallenge: '历史回顾：了解KPL地域化发展第一步，感受早期电竞氛围！',
    address: '成都市锦江区蜀都大道大慈寺路15号（太古里东北侧）',
    price: '根据赛事定价',
    duration: '2-3小时',
    tips: '地铁：2号线/3号线"春熙路站"',
    transport: '地铁2/3号线春熙路站',
    events: '2018-2020年KPL西部主场常规赛'
  },
  { 
    id: 32, latitude: 30.65, longitude: 104.03, title: 'AG电竞中心', type: 'arena', iconPath: '', width: 64, height: 64,
    category: '电竞比赛场馆',
    story: '西南地区最大的专业级XR数字电竞场馆之一，获评"电子竞技场馆·甲B级"。2024年6月15日启用，设有近1000个座位，配备巨型曲面LED屏和地面互动屏，提供沉浸式观赛体验。2025年KPL年度总决赛擂台赛和突围赛阶段也在此举办。',
    esportChallenge: '沉浸体验：感受专业级XR数字电竞场馆，体验沉浸式观赛！',
    address: '成都市武侯区武科西五路235号西部智谷C区',
    price: '根据赛事定价',
    duration: '2-3小时',
    tips: '公交：248路、1090路、339路至"武兴五路中站"；地铁：3号线/9号线"武青南路站"',
    transport: '地铁3/9号线武青南路站，公交248/1090/339路',
    events: '2024年KPL夏季赛及后续赛季常规赛'
  },
]



export default function Checkin() {
  // 状态
  // 初始位置设在宽窄巷子旁边，方便测试徽章获取功能
  const [userLat, setUserLat] = useState(30.669)
  const [userLng, setUserLng] = useState(104.055)
  const [heading, setHeading] = useState(0)
  const [mapRotate, setMapRotate] = useState<number>(0)
  const [scale, setScale] = useState<number>(17)

  const [markers, setMarkers] = useState<POIMarker[]>([])
  // 5分钟冷却机制：记录每个POI的下次可触发时间
  const [poiCooldowns, setPoiCooldowns] = useState<Record<number, number>>({})
  const [nearbyPOI, setNearbyPOI] = useState<POIMarker | null>(null)
  const [showGoldenGlow, setShowGoldenGlow] = useState(false)
  const [mode, setMode] = useState<'free' | 'explore'>('free')
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [selectedHero, setSelectedHero] = useState('李白')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', content: string}>>([
    { role: 'ai', content: '召唤师，有什么我可以帮你的吗？' }
  ])
  const [isChatLoading, setIsChatLoading] = useState(false)
  
  // 聊天面板拖拽相关状态
  const [chatPanelHeight, setChatPanelHeight] = useState(65) // 默认65vh
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(65)
  const MIN_HEIGHT = 30 // 最小高度vh
  const MAX_HEIGHT = 90 // 最大高度vh
  const [isMockLocation, setIsMockLocation] = useState(true) // 默认使用模拟定位
  const [showControls, setShowControls] = useState(false) // 控制按钮显示状态
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false) // 用户登录状态
  const [userInfo, setUserInfo] = useState<any>(null) // 用户信息
  // POI点击预览模式（仅查看，不能打卡）
  const [previewPOI, setPreviewPOI] = useState<POIMarker | null>(null)
  const [canCheckin, setCanCheckin] = useState(false) // 是否满足LBS打卡条件
  const [isPOICheckedIn, setIsPOICheckedIn] = useState(false) // 当前预览的POI是否已打卡
  const [checkedInPOIIds, setCheckedInPOIIds] = useState<number[]>([]) // 已打卡的POI ID列表
  // AG超玩会特殊流程状态
  const [showAGHistoryDialog, setShowAGHistoryDialog] = useState(false)
  const [showAGVideo, setShowAGVideo] = useState(false)
  const [agVideoEnded, setAgVideoEnded] = useState(false)
  const pendingAGPOI = useRef<POIMarker | null>(null)
  // 凤凰山体育公园特殊流程状态
  const [showArenaHistoryDialog, setShowArenaHistoryDialog] = useState(false)
  const [showArenaVideo, setShowArenaVideo] = useState(false)
  const [arenaVideoEnded, setArenaVideoEnded] = useState(false)
  const pendingArenaPOI = useRef<POIMarker | null>(null)
  // 可拖动组件位置状态 - 将在useEffect中根据屏幕尺寸初始化
  const [avatarPos, setAvatarPos] = useState({ x: 0, y: 300 })
  const [modeSwitchPos, setModeSwitchPos] = useState({ x: 350, y: 200 })

  const mapCtx = useRef<any>(null)
  const lastUpdateTime = useRef(0)
  // 拖动相关ref
  const avatarDragRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0, isDragging: false })
  const modeDragRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0, isDragging: false })
  const walkTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ========== 羁绊碎片系统状态 ==========
  const [collectedFragmentIds, setCollectedFragmentIds] = useState<string[]>([])
  const [, setHiddenBookmarkUnlocked] = useState(false)
  const [activeBondTrace, setActiveBondTrace] = useState<any>(null)
  const memoryOverlayRef = useRef<any>(null)
  const rewardPopupRef = useRef<RewardPopupRef>(null)
  // 羁绊碎片冷却记录（防止重复触发）
  const [bondCooldowns, setBondCooldowns] = useState<Record<string, number>>({})
  // 调试面板显示
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  // 藏宝图相关状态
  const [treasureMapVisible, setTreasureMapVisible] = useState(false)
  const [currentRouteId, setCurrentRouteId] = useState(1)
  const [floatOpen, setFloatOpen] = useState(false)
  // 英雄选择锁定状态
  const [hasSelectedHero, setHasSelectedHero] = useState(true)
  // 云存储图片 URL
  const [heroAvatarUrls, setHeroAvatarUrls] = useState<Record<string, string>>({})
  const [bottomIconUrls, setBottomIconUrls] = useState<Record<string, string>>({})
  // MVP战报弹窗状态
  const [showReportModal, setShowReportModal] = useState(false)
  const [showPoster, setShowPoster] = useState(false)
  const [reportData, setReportData] = useState<MVPReportData | null>(null)
  // 碎片奖励弹窗状态
  const [showFragPopup, setShowFragPopup] = useState(false)
  const [fragData, setFragData] = useState({ hero: 0, skin: 0, isFirst: false })
  const [showTowerQuiz, setShowTowerQuiz] = useState(false)
  const [quizPOI, setQuizPOI] = useState<POIMarker | null>(null)
  // MVP定时器引用
  const mvpTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 故事系统状态
  const [exploreMode, setExploreModeState] = useState<StoryMode>('free')
  const [storyProgress, setStoryProgress] = useState<UserStoryProgress | null>(null)
  const [currentStoryNode, setCurrentStoryNode] = useState<StoryNode | null>(null)
  const [showStoryDialog, setShowStoryDialog] = useState(false)
  const [storyChapterTitle, setStoryChapterTitle] = useState<string>('')
  const [showStoryRoute, setShowStoryRoute] = useState(false)
  const [isPetDragging, setIsPetDragging] = useState(false)

  // ---- 导航路线（路线规划功能）----
  const [routePolyline, setRoutePolyline] = useState<any[]>([])
  const [routeInfo, setRouteInfo] = useState<{
    distance: number
    duration: number
    mode: import('../../utils/map-route').TravelMode
    transitDetail?: TransitRouteDetail
  } | null>(null)
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [showTransitDetail, setShowTransitDetail] = useState(false)
  const [currentTravelMode, setCurrentTravelMode] = useState<import('../../utils/map-route').TravelMode>('walking')
  const targetLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const [transitTitle, setTransitTitle] = useState({ from: '', to: '' })
  
  // 公交详情面板拖拽相关
  const [transitPanelHeight, setTransitPanelHeight] = useState(70)
  const transitPanelDragRef = useRef({ startY: 0, startHeight: 70, isDragging: false })

  // ============ 路线信息条：状态定义 ============
  const [routeBarPos, setRouteBarPos] = useState({ x: 0, y: 0 })
  const [routeBarShape, setRouteBarShape] = useState<'bar' | 'circle'>('bar')
  const [routeBarSnapping, setRouteBarSnapping] = useState(false) // 是否正在执行吸附/恢复动画

  const routeBarDragRef = useRef({
    startX: 0,
    startY: 0,
    startBarX: 0,
    startBarY: 0,
    isDragging: false,
    hasMoved: false,        // 区分点击和拖拽
    currentX: 0,            // 实时记录当前X，避免闭包问题
    currentY: 0,
  })

  // 屏幕信息只取一次，存起来
  const screenInfoRef = useRef({ width: 0, height: 0, pixelRatio: 2 })
  useEffect(() => {
    const info = Taro.getSystemInfoSync()
    screenInfoRef.current = {
      width: info.windowWidth,
      height: info.windowHeight,
      pixelRatio: info.pixelRatio
    }
    // 强制刷新一次，确保后续逻辑能拿到正确的屏幕尺寸
    setRouteBarPos(prev => ({ ...prev }))
  }, [])

  // 变形阈值（单位 px，真实像素）
  const CIRCLE_THRESHOLD = 80   // 水平拖动超过这个距离变圆形
  const SNAP_CENTER_THRESHOLD = 60  // 圆形时距离中心小于这个距离恢复条形

  // 初始化
  useEffect(() => {
    mapCtx.current = Taro.createMapContext('exploreMap')
    loadPOIMarkers()

    // 获取屏幕尺寸并计算拖动组件初始位置
    const sysInfo = Taro.getSystemInfoSync()
    const screenHeight = sysInfo.windowHeight
    const screenWidth = sysInfo.windowWidth
    const safeArea = sysInfo.safeArea || { left: 0, right: screenWidth, top: 0, bottom: screenHeight }
    // 头像初始位置：左侧紧贴屏幕边缘(8px边距)，垂直35%
    setAvatarPos({ x: 8, y: screenHeight * 0.35 })
    // 模式切换按钮初始位置：右侧留4px边距，垂直25%
    // 按钮宽度60px，所以left = screenWidth - 60 - 4
    setModeSwitchPos({ x: screenWidth - 46, y: screenHeight * 0.25 })

    // 获取选择的英雄
    const hero = Taro.getStorageSync('selectedHero')
    if (!hero) {
      setHasSelectedHero(false)
    } else {
      setHasSelectedHero(true)
      setSelectedHero(hero)
    }

    // 加载羁绊碎片收集数据
    loadBondData()

    // 加载已打卡POI列表
    const checkins = Taro.getStorageSync('my_checkins') || []
    const checkedIds = checkins.map((c: any) => c.id)
    setCheckedInPOIIds(checkedIds)

    // 预加载视频临时链接
    preloadAllTempURLs().catch(console.error)

    // 预加载云存储图片（英雄头像、图标等）
    preloadAllCloudImages().catch(console.error)

    // 加载云存储图片 URL
    const loadCloudImages = async () => {
      const heroUrls: Record<string, string> = {}
      const iconUrls: Record<string, string> = {}
      
      // 加载英雄头像
      for (const [name, fileID] of Object.entries(heroAvatarFileIDs)) {
        const url = await getHeroAvatar(name)
        heroUrls[name] = url
      }
      
      // 加载底部图标
      for (const [type, fileID] of Object.entries(bottomIconFileIDs)) {
        const url = await getBottomIcon(type as keyof typeof bottomIconFileIDs)
        iconUrls[type] = url
      }
      
      setHeroAvatarUrls(heroUrls)
      setBottomIconUrls(iconUrls)
    }
    loadCloudImages()

    // 根据模式启动定位
    console.log('[Init] 定位模式:', isMockLocation ? '模拟定位' : '真实定位')
    if (isMockLocation) {
      // 模拟定位模式：不启动真实定位，显示控制按钮
      setShowControls(true)
    } else {
      // 真实定位模式
      console.log('[Init] 启动真实定位监听')
      startLocationWatch()
      startCompassWatch()
    }

    // 检查登录状态，未登录则自动触发登录
    checkLoginStatus().then((loggedIn) => {
      if (!loggedIn) {
        // 自动触发登录
        handleAutoLogin()
      }
    })

    // 启动MVP战报定时检查
    startMVPReportCheck()

    return () => {
      Taro.stopLocationUpdate()
      Taro.stopCompass()
      if (walkTimerRef.current) {
        clearTimeout(walkTimerRef.current)
      }
      if (lighthouseTimerRef.current) {
        clearInterval(lighthouseTimerRef.current)
      }
      // 清理MVP定时器
      if (mvpTimerRef.current) {
        clearInterval(mvpTimerRef.current)
      }
    }
  }, [isMockLocation])

  /**
   * 启动MVP战报定时检查
   */
  const startMVPReportCheck = () => {
    // 立即检查一次
    checkMVPReport()
    
    // 每分钟检查一次
    mvpTimerRef.current = setInterval(() => {
      checkMVPReport()
    }, 60000)
  }

  /**
   * 检查是否需要显示MVP战报
   */
  const checkMVPReport = () => {
    if (shouldShowDailyReport()) {
      setShowReportModal(true)
    }
  }

  /**
   * 处理生成战报
   */
  const handleGenerateReport = (data: MVPReportData) => {
    setReportData(data)
    setShowPoster(true)
  }

  /**
   * 关闭海报
   */
  const handleClosePoster = () => {
    setShowPoster(false)
  }

  // 页面显示时重新读取英雄选择和故事进度
  useDidShow(() => {
    // 检查是否已选择英雄，未选择则显示锁定遮罩
    const hero = Taro.getStorageSync('selectedHero')
    if (!hero) {
      setHasSelectedHero(false)
      // 清除可能残留的故事状态
      setShowStoryDialog(false)
      setCurrentStoryNode(null)
      setStoryProgress(null)
      return
    } else {
      setHasSelectedHero(true)
      setSelectedHero(hero)
    }

    // 初始化故事系统
    initStorySystem()
  })

  // 初始化故事系统
  const initStorySystem = () => {
    const mode = getExploreMode()
    setExploreModeState(mode)
    setMode(mode)  // 同步设置 mode 状态，保持 UI 一致

    // 调试输出
    const progress = getCurrentStoryProgress()
    const shouldShowWelcome = shouldShowFreeModeWelcome()
    console.log('🎮 初始化故事系统:', {
      mode,
      hasProgress: !!progress,
      progressStatus: progress?.status,
      currentNodeId: progress?.currentNodeId,
      storyId: progress?.storyId,
      shouldShowWelcome,
      freeModeWelcomeNode: !!freeModeWelcomeNode
    })

    if (mode === 'explore' && progress) {
      console.log('🎮 进入探索模式，恢复故事进度')
      setStoryProgress(progress)
      resumeStory()
      
      // 恢复当前节点并显示对话框
      const story = getStoryById(progress.storyId)
      if (story && progress.currentNodeId) {
        const currentNode = story.nodes[progress.currentNodeId]
        if (currentNode) {
          console.log('🎯 恢复当前节点:', currentNode.id)
          setCurrentStoryNode(currentNode)
          setShowStoryDialog(true)
        }
      }
    } else if (mode === 'free') {
      console.log('🎮 进入自由模式，检查欢迎剧情')
      // 检查用户是否已选择英雄
      const hero = Taro.getStorageSync('selectedHero')
      if (!hero) {
        console.log('🎮 用户未选择英雄，跳过欢迎剧情')
        return
      }
      if (shouldShowWelcome) {
        console.log('🎮 显示自由模式欢迎剧情')
        setCurrentStoryNode(freeModeWelcomeNode)
        setShowStoryDialog(true)
        markFreeModeWelcomeShown()
      } else {
        console.log('🎮 欢迎剧情已显示过，跳过')
      }
    }
  }

  // 处理模式切换
  const handleModeChange = (mode: StoryMode) => {
    console.log('🔄 模式切换:', mode)
    setExploreModeState(mode)
    
    if (mode === 'explore') {
      const progress = getCurrentStoryProgress()
      console.log('📖 当前故事进度:', progress)
      
      if (progress) {
        // 检查故事是否已完成
        if (progress.status === 'completed') {
          // 故事已完成，显示结局卡片
          console.log('✅ 故事已完成，显示结局')
          const story = getStoryById(progress.storyId)
          if (story) {
            // 找到结局节点
            const endingNode = Object.values(story.nodes).find(node => node.type === 'ending')
            if (endingNode) {
              setStoryProgress(progress)
              setCurrentStoryNode(endingNode)
              setShowStoryDialog(true)
              return
            }
          }
        }
        
        // 有进行中的故事，恢复它
        console.log('✅ 恢复已有故事')
        setStoryProgress(progress)
        resumeStory()
        
        // 恢复当前节点并显示对话框
        const story = getStoryById(progress.storyId)
        if (story && progress.currentNodeId) {
          const currentNode = story.nodes[progress.currentNodeId]
          if (currentNode) {
            console.log('🎯 恢复当前节点:', currentNode.id)
            setCurrentStoryNode(currentNode)
            setShowStoryDialog(true)
          }
        }
      } else {
        // 没有故事进度，尝试开始新故事
        console.log('🆕 开始新故事')
        const story = getStoryByHero(selectedHero)
        if (story) {
          // 清除可能存在的旧进度
          clearStoryProgress()
          
          // 自动开始故事
          const newProgress = startStory(story.id, selectedHero)
          console.log('📝 新进度:', newProgress)
          setStoryProgress(newProgress)
          
          // 获取第一个节点并显示
          const firstNode = story.nodes[newProgress.currentNodeId]
          if (firstNode) {
            console.log('🎬 显示第一个节点:', firstNode.id)
            setCurrentStoryNode(firstNode)
            setShowStoryDialog(true)
            Taro.showToast({
              title: `${story.heroName}的故事已开始`,
              icon: 'success'
            })
          } else {
            console.error('❌ 无法获取故事第一个节点')
            Taro.showToast({
              title: '故事加载失败，请重试',
              icon: 'none'
            })
          }
        } else {
          // 当前英雄没有专属故事
          console.log('❌ 英雄无故事线:', selectedHero)
          Taro.showModal({
            title: '暂无故事线',
            content: `${selectedHero}暂无专属探索故事，切换回自由模式？`,
            success: (res) => {
              if (res.confirm) {
                setMode('free')
                setExploreModeState('free')
              }
            }
          })
        }
      }
    } else {
      console.log('⏸️ 暂停故事')
      pauseStory()
    }
  }

  // 检查故事触发
  const checkStoryTriggerAtLocation = (lat: number, lng: number) => {
    console.log('[StoryTrigger] 检查触发:', { lat, lng, exploreMode })
    if (exploreMode !== 'explore') {
      console.log('[StoryTrigger] 非探索模式，跳过')
      return
    }

    const result = checkStoryTrigger(lat, lng)
    console.log('[StoryTrigger] 结果:', result)
    
    if (result.triggered && result.node) {
      console.log('[StoryTrigger] 触发成功:', result.node.id, '当前显示:', currentStoryNode?.id, '对话框显示:', showStoryDialog)
      
      // 如果当前节点是 transition 类型，且已经到达目的地，推进到下一个节点
      const story = getStoryById(storyProgress?.storyId || '')
      const currentNode = story?.nodes[result.node.id]
      const nextNodeId = currentNode?.nextNodeId
      
      if (currentNode?.type === 'transition' && nextNodeId) {
        const nextNode = story?.nodes[nextNodeId]
        if (nextNode) {
          console.log('[StoryTrigger] transition节点到达目的地，推进到:', nextNodeId)
          // 推进故事进度
          const updatedProgress = advanceStory(storyProgress!)
          setStoryProgress(updatedProgress)
          // 显示下一个节点
          setCurrentStoryNode(nextNode)
          setShowStoryDialog(true)
          return
        }
      }
      
      // 检查是否需要显示节点：
      // 1. 如果是新节点，显示它
      // 2. 如果是同一个节点但对话框已关闭（如前往下一站后），重新显示
      if (currentStoryNode?.id !== result.node.id || !showStoryDialog) {
        console.log('[StoryTrigger] 显示节点:', result.node.id)
        setCurrentStoryNode(result.node)
        setShowStoryDialog(true)
        if (result.isNewChapter && result.chapterTitle) {
          setStoryChapterTitle(result.chapterTitle)
        }
      } else {
        console.log('[StoryTrigger] 已经在显示该节点且对话框已打开，跳过')
      }
    } else {
      console.log('[StoryTrigger] 未触发')
    }
  }

  // 获取下一个节点
  const getNextStoryNode = useCallback(() => {
    if (!storyProgress) return null
    const story = getStoryById(storyProgress.storyId)
    if (!story) return null
    const currentNode = story.nodes[storyProgress.currentNodeId]
    if (!currentNode) return null
    
    // 确定下一个节点ID
    let nextNodeId: string | undefined
    if (currentNode.nextNodeId) {
      nextNodeId = currentNode.nextNodeId
    }
    
    return nextNodeId ? story.nodes[nextNodeId] : null
  }, [storyProgress])

  // 定义需要使用路径规划的节点范围（MVP阶段演示用）
  // 注意：ch1-temple-dialog2 开始不再使用路径规划
  const ROUTE_PLANNING_NODES = [
    'prologue-chunxi-transition',
    'prologue-chunxi-scene', 
    'prologue-chunxi-fashion',
    'ch1-temple-start',
    // 'ch1-temple-dialog1'
  ]

  // 检查当前节点是否使用路径规划功能
  const shouldUseRoutePlanning = useCallback(() => {
    if (!currentStoryNode) return false
    return ROUTE_PLANNING_NODES.includes(currentStoryNode.id)
  }, [currentStoryNode])

  // 检查是否是当前地点的最后一个节点
  const isLastNodeAtCurrentLocation = useCallback(() => {
    if (!storyProgress || !currentStoryNode) return false
    const story = getStoryById(storyProgress.storyId)
    if (!story) return false
    
    // 获取当前节点的location
    const currentLocation = currentStoryNode.location?.name || null
    
    // transition 类型节点（景点转移节点）总是显示转移卡片，且不允许跳过
    if (currentStoryNode.type === 'transition') {
      console.log('🎯 transition节点，显示转移提示:', { currentLocation })
      return true
    }
    
    // 处理选择节点：检查所有选项的下一个节点
    if (currentStoryNode.type === 'choice' && currentStoryNode.choices) {
      // 检查是否所有选项都指向同一个新地点
      const nextLocations = new Set<string>()
      for (const choice of currentStoryNode.choices) {
        const nextNode = choice.nextNodeId ? story.nodes[choice.nextNodeId] : null
        if (nextNode?.location) {
          nextLocations.add(nextNode.location.name)
        }
      }
      // 如果所有选项都指向同一个新地点，且与当前地点不同，显示转移提示
      if (nextLocations.size === 1) {
        const nextLocation = Array.from(nextLocations)[0]
        console.log('🎯 选择节点地点对比:', { currentLocation, nextLocation, isDifferent: currentLocation !== nextLocation })
        return currentLocation !== nextLocation
      }
      return false
    }
    
    // 普通节点：直接从 currentStoryNode 获取下一个节点
    const nextNodeId = currentStoryNode.nextNodeId
    if (!nextNodeId) {
      console.log('🎯 没有下一个节点，是当前地点最后一个')
      return true // 没有下一个节点，是当前地点最后一个
    }
    
    const nextNode = story.nodes[nextNodeId]
    if (!nextNode) {
      console.log('🎯 下一个节点不存在，是当前地点最后一个')
      return true // 下一个节点不存在，是当前地点最后一个
    }
    
    const nextLocation = nextNode.location?.name || null
    
    console.log('🎯 普通节点地点对比:', { 
      currentNodeId: currentStoryNode.id, 
      nextNodeId: nextNode.id,
      currentLocation, 
      nextLocation, 
      isDifferent: currentLocation !== nextLocation 
    })
    
    // 关键逻辑：如果下一个节点有不同的location，则需要显示转移提示
    if (nextLocation && currentLocation) {
      return currentLocation !== nextLocation
    }
    
    // 如果下一个节点有location但当前没有（中间节点→transition节点），显示转移提示
    if (nextLocation && !currentLocation) {
      console.log('🎯 中间节点→transition节点，显示转移提示:', { nextLocation })
      return true
    }
    
    // 如果当前节点有location但下一个没有（transition节点→中间节点），显示转移提示
    if (currentLocation && !nextLocation) {
      console.log('🎯 transition节点→中间节点，显示转移提示:', { currentLocation })
      return true
    }
    
    return false
  }, [storyProgress, currentStoryNode])

  // 处理故事对话下一步
  const handleStoryNext = () => {
    console.log('🎬 handleStoryNext 被调用', { storyProgress, currentStoryNode: currentStoryNode?.id })
    
    // 特殊处理：自由模式欢迎剧情（没有 storyProgress，直接关闭对话框）
    if (currentStoryNode?.id === 'free-mode-welcome') {
      console.log('🎬 自由模式欢迎剧情结束，关闭对话框')
      setShowStoryDialog(false)
      setCurrentStoryNode(null)
      return
    }
    
    if (!storyProgress || !currentStoryNode) {
      console.log('🎬 缺少 storyProgress 或 currentStoryNode，直接返回')
      return
    }

    // 发放奖励
    const rewards = claimNodeRewards(storyProgress)
    if (rewards.bondPoints > 0) {
      console.log('获得奖励:', rewards)
    }

    // 推进故事
    const updatedProgress = advanceStory(storyProgress)
    console.log('🎬 故事已推进到:', updatedProgress.currentNodeId)
    setStoryProgress(updatedProgress)

    // 获取下一个节点
    const story = getStoryById(updatedProgress.storyId)
    if (story) {
      const nextNode = story.nodes[updatedProgress.currentNodeId]
      console.log('🎬 下一个节点:', nextNode?.id, nextNode?.type)
      if (nextNode) {
        setCurrentStoryNode(nextNode)
        // 重新打开对话框显示新节点内容
        setShowStoryDialog(true)
        // 如果是结局节点，完成故事
        if (nextNode.type === 'ending' && nextNode.ending) {
          completeStory(nextNode.ending.type)
        }
      } else {
        // 故事结束
        setShowStoryDialog(false)
        setCurrentStoryNode(null)
      }
    }
  }

  // 处理前往下一站（带路线规划功能）
  const handleNavigateToNextLocation = useCallback(async () => {
    console.log('🧭 用户确认前往下一站')
    console.log('📍 当前位置:', { userLat, userLng })

    // 1. 关闭对话框
    setShowStoryDialog(false)

    // 2. 拿到下一个节点的目标坐标
    const progress = getCurrentStoryProgress()
    console.log('📖 当前故事进度:', progress)
    if (!progress) {
      console.log('❌ 没有故事进度，直接推进剧情')
      setTimeout(() => {
        handleStoryNext()
      }, 300)
      return
    }

    const story = getStoryById(progress.storyId)
    console.log('📚 获取到的故事:', story?.id)
    if (!story) {
      console.log('❌ 没有找到故事，直接推进剧情')
      setTimeout(() => {
        handleStoryNext()
      }, 300)
      return
    }

    // 获取当前节点（用户已经推进到的新节点）
    const currentNode = story.nodes[progress.currentNodeId]
    
    // 获取下一个节点（用户需要前往的目的地）
    const nextNodeId = currentNode?.nextNodeId
    const nextNode = nextNodeId ? story.nodes[nextNodeId] : null
    
    // 目标位置是下一个节点的位置（用户需要前往的位置）
    const targetLocation = nextNode?.location

    console.log('🎯 当前节点:', currentNode?.id, 'nextNodeId:', nextNodeId)
    console.log('🎯 下一节点:', nextNode?.id)
    console.log('📍 目标位置:', targetLocation)

    if (!targetLocation) {
      // 没有目标坐标，直接推进剧情
      console.log('⚠️ 没有目标位置坐标，直接推进剧情')
      setTimeout(() => {
        handleStoryNext()
      }, 300)
      return
    }

    // 保存目标位置用于后续切换出行方式
    targetLocationRef.current = { lat: targetLocation.lat, lng: targetLocation.lng }

    // 检查是否使用路径规划功能
    const useRoutePlanning = shouldUseRoutePlanning()
    console.log('🗺️ 是否使用路径规划:', useRoutePlanning, '当前节点:', currentNode?.id)

    if (!useRoutePlanning) {
      // 不使用路径规划：直接推进剧情到下一节点
      console.log('🗺️ 不使用路径规划，直接推进剧情')
      // 延迟一下让用户看到对话框关闭，然后推进剧情
      setTimeout(() => {
        handleStoryNext()
      }, 300)
      return
    }

    // 3. 开始规划路线
    console.log('🗺️ 开始调用路线规划API...')
    Taro.showLoading({ title: '规划路线中…', mask: false })

    try {
      console.log('🗺️ 调用 fetchRoute...')
      const { fetchRoute } = await import('../../utils/map-route')
      const result = await fetchRoute(
        { latitude: userLat, longitude: userLng },
        { latitude: targetLocation.lat, longitude: targetLocation.lng },
        currentTravelMode
      )

      // 4. 写入 polyline，地图自动渲染
      console.log('🗺️ 设置polyline:', {
        pointsCount: result.polyline.length,
        firstPoint: result.polyline[0],
        lastPoint: result.polyline[result.polyline.length - 1],
        distance: result.distance,
        duration: result.duration,
        mode: result.mode
      })
      
      // 根据出行方式设置不同颜色
      const modeColors: Record<string, { color: string; border: string }> = {
        walking: { color: '#4285F4CC', border: '#3367D666' },
        driving: { color: '#34A853CC', border: '#2E7D3266' },
        bicycling: { color: '#FBBC04CC', border: '#F9A82566' },
        ebicycling: { color: '#EA4335CC', border: '#C6282866' },
        transit: { color: '#9C27B0CC', border: '#7B1FA266' }
      }
      const colors = modeColors[result.mode] || modeColors.walking
      
      // 确保polyline格式正确
      const formattedPolyline = result.polyline.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude
      }))
      
      setRoutePolyline([
        {
          points: formattedPolyline,
          color: colors.color,
          width: 6,
          arrowLine: true,
          borderColor: colors.border,
          borderWidth: 2
        }
      ])

      setRouteInfo({
        distance: result.distance,
        duration: result.duration,
        mode: result.mode,
        transitDetail: result.transitDetail
      })
      
      // 设置公交路线标题
      // 优先使用API返回的真实地点名称，如果没有则使用故事节点名称
      let fromName: string
      let toName: string
      
      if (result.transitDetail?.startName) {
        // 使用API返回的真实起点名称（如"西大街地铁站"）
        fromName = result.transitDetail.startName
      } else {
        fromName = currentNode?.location?.name || '当前位置'
      }
      
      if (result.transitDetail?.endName) {
        // 使用API返回的真实终点名称
        toName = result.transitDetail.endName
      } else {
        toName = nextNode?.location?.name || '目的地'
      }
      
      // 如果起点和终点名称相同，添加区分标识
      if (fromName === toName && fromName !== '当前位置') {
        setTransitTitle({
          from: `${fromName}(起点)`,
          to: `${toName}(终点)`
        })
      } else {
        setTransitTitle({
          from: fromName,
          to: toName
        })
      }

      // 5. 调整地图视野，包含起点和终点
      console.log('🗺️ 调整地图视野:', {
        from: { latitude: userLat, longitude: userLng },
        to: { latitude: targetLocation.lat, longitude: targetLocation.lng }
      })
      mapCtx.current?.includePoints({
        points: [
          { latitude: userLat, longitude: userLng },
          { latitude: targetLocation.lat, longitude: targetLocation.lng }
        ],
        padding: [80, 60, 80, 60]
      })

      // 6. 暂停故事
      pauseStory()

      Taro.hideLoading()

      const modeNames: Record<string, string> = {
        walking: '步行',
        driving: '驾车',
        bicycling: '骑行',
        ebicycling: '电动车',
        transit: '公交'
      }
      Taro.showToast({
        title: `${modeNames[result.mode]}约 ${Math.ceil(result.duration)} 分钟`,
        icon: 'none',
        duration: 2500
      })
    } catch (err: any) {
      console.error('❌ 路线规划失败:', err)
      console.error('❌ 错误详情:', err.message || err)
      Taro.hideLoading()
      pauseStory()
      Taro.showToast({
        title: `路线规划失败: ${err.message || '请手动前往'}`,
        icon: 'none',
        duration: 3000
      })
    }
  }, [userLat, userLng, currentTravelMode, handleStoryNext])

  // 切换出行方式
  const handleSwitchTravelMode = async (mode: import('../../utils/map-route').TravelMode) => {
    if (mode === currentTravelMode || !targetLocationRef.current) return
    
    setCurrentTravelMode(mode)
    setShowModeSelector(false)
    
    // 重新规划路线
    Taro.showLoading({ title: '规划路线中…', mask: false })
    
    try {
      const { fetchRoute } = await import('../../utils/map-route')
      const result = await fetchRoute(
        { latitude: userLat, longitude: userLng },
        { latitude: targetLocationRef.current.lat, longitude: targetLocationRef.current.lng },
        mode
      )
      
      // 根据出行方式设置不同颜色
      const modeColors: Record<string, { color: string; border: string }> = {
        walking: { color: '#4285F4CC', border: '#3367D666' },
        driving: { color: '#34A853CC', border: '#2E7D3266' },
        bicycling: { color: '#FBBC04CC', border: '#F9A82566' },
        ebicycling: { color: '#EA4335CC', border: '#C6282866' },
        transit: { color: '#9C27B0CC', border: '#7B1FA266' }
      }
      const colors = modeColors[mode] || modeColors.walking
      
      const formattedPolyline = result.polyline.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude
      }))
      
      setRoutePolyline([
        {
          points: formattedPolyline,
          color: colors.color,
          width: 6,
          arrowLine: true,
          borderColor: colors.border,
          borderWidth: 2
        }
      ])

      setRouteInfo({
        distance: result.distance,
        duration: result.duration,
        mode: result.mode,
        transitDetail: result.transitDetail
      })
      
      // 更新公交路线标题（使用当前用户位置和目的地）
      if (result.transitDetail) {
        // 优先使用API返回的真实地点名称
        let fromName: string = result.transitDetail.startName || ''
        let toName: string = result.transitDetail.endName || ''
        
        // 如果没有API返回的名称，则使用故事节点名称
        if (!fromName || !toName) {
          const progress = getCurrentStoryProgress()
          if (progress) {
            const story = getStoryById(progress.storyId)
            if (story) {
              const currentNode = story.nodes[progress.currentNodeId]
              const nextNodeId = currentNode?.nextNodeId
              const nextNode = nextNodeId ? story.nodes[nextNodeId] : null
              fromName = fromName || currentNode?.location?.name || '当前位置'
              toName = toName || nextNode?.location?.name || '目的地'
            }
          }
        }
        
        // 如果起点和终点名称相同，添加区分标识
        if (fromName === toName && fromName !== '当前位置') {
          setTransitTitle({
            from: `${fromName}(起点)`,
            to: `${toName}(终点)`
          })
        } else {
          setTransitTitle({
            from: fromName,
            to: toName
          })
        }
      }
      
      Taro.hideLoading()
      
      const modeNames: Record<string, string> = {
        walking: '步行',
        driving: '驾车',
        bicycling: '骑行',
        ebicycling: '电动车',
        transit: '公交'
      }
      Taro.showToast({
        title: `已切换${modeNames[mode]}`,
        icon: 'success',
        duration: 2000
      })
    } catch (err: any) {
      console.error('❌ 切换出行方式失败:', err)
      Taro.hideLoading()
      Taro.showToast({
        title: `切换失败: ${err.message}`,
        icon: 'none',
        duration: 2500
      })
    }
  }

  // 公交详情面板拖拽处理
  const handleTransitPanelDragStart = (e: any) => {
    const touch = e.touches[0]
    transitPanelDragRef.current = {
      startY: touch.clientY,
      startHeight: transitPanelHeight,
      isDragging: true
    }
  }

  const handleTransitPanelDragMove = (e: any) => {
    if (!transitPanelDragRef.current.isDragging) return
    
    const touch = e.touches[0]
    const deltaY = transitPanelDragRef.current.startY - touch.clientY
    const sysInfo = Taro.getSystemInfoSync()
    const deltaVh = (deltaY / sysInfo.windowHeight) * 100
    
    let newHeight = transitPanelDragRef.current.startHeight + deltaVh
    // 限制高度范围：30vh - 90vh
    newHeight = Math.max(30, Math.min(90, newHeight))
    
    setTransitPanelHeight(newHeight)
  }

  const handleTransitPanelDragEnd = () => {
    transitPanelDragRef.current.isDragging = false
    // 吸附到最近的档位
    if (transitPanelHeight < 45) {
      setTransitPanelHeight(30)
    } else if (transitPanelHeight < 70) {
      setTransitPanelHeight(55)
    } else {
      setTransitPanelHeight(85)
    }
  }

  // 处理故事选择
  const handleStoryChoice = (choiceId: string) => {
    if (!storyProgress) return

    const updatedProgress = advanceStory(storyProgress, choiceId)
    setStoryProgress(updatedProgress)

    const story = getStoryById(updatedProgress.storyId)
    if (story) {
      const nextNode = story.nodes[updatedProgress.currentNodeId]
      setCurrentStoryNode(nextNode || null)
    }
  }

  // ============ 触摸开始 ============
  const handleRouteBarTouchStart = useCallback((e: any) => {
    const touch = e.touches[0]
    const drag = routeBarDragRef.current
    drag.startX = touch.clientX
    drag.startY = touch.clientY
    drag.startBarX = routeBarPos.x
    drag.startBarY = routeBarPos.y
    drag.currentX = routeBarPos.x
    drag.currentY = routeBarPos.y
    drag.isDragging = true
    drag.hasMoved = false

    // 拖拽开始时立刻取消吸附动画，让组件跟手
    setRouteBarSnapping(false)
  }, [routeBarPos.x, routeBarPos.y])

  // ============ 触摸移动 ============
  const handleRouteBarTouchMove = useCallback((e: any) => {
    const drag = routeBarDragRef.current
    if (!drag.isDragging) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - drag.startX
    const deltaY = touch.clientY - drag.startY

    const newX = drag.startBarX + deltaX
    const newY = drag.startBarY + deltaY

    // 移动超过 4px 才算拖拽，避免误触
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.hasMoved = true
    }

    drag.currentX = newX
    drag.currentY = newY

    // 小程序端只能走 setState，但我们把 snapping 设为 false
    // 确保 transition 不生效，实现跟手
    setRouteBarPos({ x: newX, y: newY })

    // 判断变形（仅在条形状态下根据水平距离变形）
    const absX = Math.abs(newX)

    if (routeBarShape === 'bar' && absX > CIRCLE_THRESHOLD) {
      // 条形拖到边缘变圆形
      setRouteBarShape('circle')
    } else if (routeBarShape === 'circle' && absX < SNAP_CENTER_THRESHOLD) {
      // 圆形拖回中间变条形
      setRouteBarShape('bar')
    }
  }, [routeBarShape])

  // ============ 触摸结束 ============
  const handleRouteBarTouchEnd = useCallback(() => {
    const drag = routeBarDragRef.current
    drag.isDragging = false

    // 如果没有移动，当作点击处理，不执行吸附
    if (!drag.hasMoved) return

    const currentX = drag.currentX
    const currentY = drag.currentY

    if (routeBarShape === 'circle') {
      // 圆形状态下，吸附到最近的边缘
      setRouteBarSnapping(true)

      const isLeftSide = currentX < 0
      
      // 获取屏幕信息
      if (screenInfoRef.current.width === 0) {
        const info = Taro.getSystemInfoSync()
        screenInfoRef.current.width = info.windowWidth
        screenInfoRef.current.height = info.windowHeight
      }
      const { width } = screenInfoRef.current
      
      // 计算吸附位置（px 单位，小程序 transform 直接用 px）
      // 左边缘：translateX = 16px（留边距）
      // 右边缘：translateX = width - 40 - 44 - 16 = width - 100px
      const edgeMargin = 16
      const leftOffset = 20  // 40rpx ≈ 20px
      const circleSize = 44  // 88rpx ≈ 44px
      
      const snapX = isLeftSide 
        ? edgeMargin - leftOffset  // 左边缘
        : (width - edgeMargin - circleSize - leftOffset)  // 右边缘

      setRouteBarPos({ x: snapX, y: 0 })
    } else {
      // 条形状态：松手后 X 归零（水平居中），Y 保持当前位置
      setRouteBarSnapping(true)
      setRouteBarPos({ x: 0, y: currentY })
    }
  }, [routeBarShape])

  // ============ 点击圆形恢复条形 ============
  const handleCircleButtonClick = useCallback(() => {
    if (routeBarShape !== 'circle') return

    setRouteBarSnapping(true)
    setRouteBarShape('bar')
    // 回到初始位置（屏幕底部中央）
    setRouteBarPos({ x: 0, y: 0 })
  }, [routeBarShape])

  // 位置监听
  const startLocationWatch = useCallback(() => {
    console.log('[Location] 启动位置监听...')
    Taro.startLocationUpdate({
      type: 'gcj02',
      success: () => {
        console.log('[Location] 位置监听启动成功')
        Taro.onLocationChange((res) => {
          const { latitude, longitude } = res
          console.log('[Location] 位置更新:', { latitude, longitude })
          setUserLat(latitude)
          setUserLng(longitude)
          checkNearbyPOI(latitude, longitude)
          // 检查故事触发
          checkStoryTriggerAtLocation(latitude, longitude)
        })
      },
      fail: (err) => {
        console.error('[Location] 位置监听启动失败:', err)
      }
    })
  }, [])

  // 罗盘监听（节流）
  const startCompassWatch = useCallback(() => {
    Taro.startCompass({
      success: () => {
        Taro.onCompassChange((res) => {
          const now = Date.now()
          if (now - lastUpdateTime.current < 200) return
          lastUpdateTime.current = now
          setHeading(res.direction)
          setMapRotate(-res.direction)
        })
      }
    })
  }, [])

  // 加载POI标记
  const loadPOIMarkers = useCallback(async () => {
    // 获取所有图标类型的临时链接
    const iconUrls: Record<string, string> = {}
    try {
      // 使用云存储API获取临时链接
      const fileList = Object.values(mapIconFileIDs).map(fileID => ({ fileID, maxAge: 7200 }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await (Taro.cloud as any).getTempFileURL({ fileList })
      
      if (res && res.fileList) {
        Object.keys(mapIconFileIDs).forEach((key, index) => {
          if (res.fileList[index]?.tempFileURL) {
            iconUrls[key] = res.fileList[index].tempFileURL
          }
        })
      }
    } catch (e) {
      console.error('获取地图图标临时链接失败:', e)
    }

    // 为每个POI设置对应的图标URL
    const poiList = mockPOIs.map(poi => {
      const iconType = getIconType(poi.type)
      return {
        ...poi,
        iconPath: iconUrls[iconType] || '',
        anchor: { x: 0.5, y: 1.0 }
      }
    })
    setMarkers(poiList)
  }, [])

  // 检查附近POI
  const checkNearbyPOI = useCallback((lat: number, lng: number) => {
    // 剧情模式下不弹出打卡小卡片
    if (exploreMode === 'explore' && showStoryDialog) {
      return
    }

    const TRIGGER_RADIUS = 80
    const now = Date.now()
    markers.forEach(marker => {
      const distance = haversineDistance(lat, lng, marker.latitude, marker.longitude)
      // 检查是否在触发范围内，且没有正在显示的POI，且不在冷却期内，且未打卡过
      const cooldownEnd = poiCooldowns[marker.id] || 0
      const isCheckedIn = checkedInPOIIds.includes(marker.id)
      if (distance <= TRIGGER_RADIUS && !nearbyPOI && !showAGHistoryDialog && !showAGVideo && !showArenaHistoryDialog && !showArenaVideo && now >= cooldownEnd && !isCheckedIn) {
        // 剧情模式下不触发打卡相关的震动和效果（在剧情完成后再启用）
        if (exploreMode !== 'explore') {
          Taro.vibrateShort({ type: 'medium' })
        }
        // AG超玩会俱乐部特殊处理：先显示历史询问弹窗
        if (marker.type === 'club' && marker.title.includes('AG')) {
          pendingAGPOI.current = marker
          setShowAGHistoryDialog(true)
          triggerLighthouseEffect()
        }
        // 凤凰山体育公园特殊处理：先显示历史询问弹窗
        else if (marker.type === 'arena' && marker.title.includes('凤凰山')) {
          pendingArenaPOI.current = marker
          setShowArenaHistoryDialog(true)
          triggerLighthouseEffect()
        }
        else {
          setNearbyPOI(marker)
          // 荣耀灯塔、电竞俱乐部、比赛场馆触发金色光晕效果
          if (marker.type === 'spirit_lighthouse' || marker.type === 'club' || marker.type === 'arena') {
            triggerLighthouseEffect()
          }
        }
      }
    })

    // 检查羁绊碎片触发（剧情模式下也暂不触发）
    if (exploreMode !== 'explore' || !showStoryDialog) {
      checkBondTraces(lat, lng)
    }
  }, [markers, nearbyPOI, poiCooldowns, showAGHistoryDialog, showAGVideo, showArenaHistoryDialog, showArenaVideo, checkedInPOIIds, exploreMode, showStoryDialog])

  // ========== 羁绊碎片系统 ==========
  // 加载羁绊数据
  const loadBondData = () => {
    try {
      const fragments = Taro.getStorageSync('collected_fragments') || '[]'
      setCollectedFragmentIds(JSON.parse(fragments))
      const hidden = Taro.getStorageSync('hidden_bookmark_unlocked') || false
      setHiddenBookmarkUnlocked(hidden)
    } catch (e) {
      console.error('加载羁绊数据失败', e)
    }
  }

  // 检查附近羁绊碎片
  const checkBondTraces = (lat: number, lng: number) => {
    // 剧情模式下不触发羁绊碎片
    if (exploreMode === 'explore') {
      return
    }

    const BOND_RADIUS = 100 // 羁绊碎片触发半径100米
    const now = Date.now()

    ALL_EASTER_EGGS.forEach(trace => {
      // 跳过已收集的碎片
      if (collectedFragmentIds.includes(trace.fragmentId)) return

      const distance = haversineDistance(lat, lng, trace.latitude, trace.longitude)
      const cooldownEnd = bondCooldowns[trace.id] || 0

      // 检查是否在触发范围内，且没有正在显示的羁绊碎片，且不在冷却期内
      if (distance <= BOND_RADIUS && !activeBondTrace && now >= cooldownEnd) {
        Taro.vibrateShort({ type: 'heavy' })
        setTimeout(() => Taro.vibrateLong(), 200)

        // 触发羁绊碎片
        setActiveBondTrace(trace)

        // 触发MemoryOverlay
        setTimeout(() => {
          memoryOverlayRef.current?.trigger?.(trace)
        }, 100)
      }
    })
  }

  // 处理羁绊收集完成
  const handleBondCollected = (data: {
    traceId: string
    fragmentId: string
    rarity: string
    badgeId: string | null
    newCollectedIds: string[]
  }) => {
    // 保存到本地存储
    Taro.setStorageSync('collected_fragments', JSON.stringify(data.newCollectedIds))
    Taro.setStorageSync('collected_fragments_data', JSON.stringify({
      ...collectedDataFromStorage(),
      [data.fragmentId]: {
        fragmentId: data.fragmentId,
        collectDate: new Date().toLocaleDateString('zh-CN'),
        traceId: data.traceId
      }
    }))

    setCollectedFragmentIds(data.newCollectedIds)

    Taro.showToast({
      title: `获得羁绊：${data.rarity === 'legendary' ? '传说' : data.rarity === 'epic' ? '史诗' : data.rarity === 'rare' ? '精良' : '普通'}`,
      icon: 'success',
      duration: 2000
    })
  }

  // 处理隐藏书签解锁
  const handleHiddenUnlocked = (data: { bookmarkId: string }) => {
    Taro.setStorageSync('hidden_bookmark_unlocked', true)
    setHiddenBookmarkUnlocked(true)

    Taro.showToast({
      title: '🏆 解锁限定羁绊书签！',
      icon: 'none',
      duration: 3000
    })
  }

  // 处理记忆覆盖层关闭
  const handleMemoryOverlayClosed = () => {
    // 设置5分钟冷却期
    if (activeBondTrace) {
      const cooldownEnd = Date.now() + 5 * 60 * 1000
      setBondCooldowns(prev => ({
        ...prev,
        [activeBondTrace.id]: cooldownEnd
      }))
    }

    setActiveBondTrace(null)
  }

  // 辅助函数：获取存储的收集数据
  const collectedDataFromStorage = (): Record<string, any> => {
    try {
      return JSON.parse(Taro.getStorageSync('collected_fragments_data') || '{}')
    } catch {
      return {}
    }
  }

  // 荣耀灯塔特效 - 持续闪烁模式
  const lighthouseTimerRef = useRef<any>(null)
  
  const triggerLighthouseEffect = () => {
    // 剧情模式下不触发荣耀灯塔效果
    if (exploreMode === 'explore') {
      return
    }

    // 清除之前的定时器
    if (lighthouseTimerRef.current) {
      clearInterval(lighthouseTimerRef.current)
    }
    
    setShowGoldenGlow(true)
    Taro.vibrateShort({ type: 'heavy' })
    setTimeout(() => Taro.vibrateShort({ type: 'medium' }), 200)
    setTimeout(() => Taro.vibrateShort({ type: 'light' }), 400)
    
    // 启动持续闪烁 - 每2秒闪烁一次
    lighthouseTimerRef.current = setInterval(() => {
      setShowGoldenGlow(prev => !prev)
    }, 2000)
  }
  
  // 停止荣耀灯塔特效
  const stopLighthouseEffect = () => {
    if (lighthouseTimerRef.current) {
      clearInterval(lighthouseTimerRef.current)
      lighthouseTimerRef.current = null
    }
    setShowGoldenGlow(false)
  }

  // 距离计算
  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // 处理地图POI标记点击 - 仅预览，打卡仍需LBS
  const handleMarkerTap = useCallback((e: any) => {
    const markerId = e.detail.markerId
    const clickedMarker = markers.find(m => m.id === markerId)
    if (clickedMarker) {
      // 检查是否满足LBS打卡条件（距离80米内）
      const distance = haversineDistance(userLat, userLng, clickedMarker.latitude, clickedMarker.longitude)
      const canDoCheckin = distance <= 80
      // 检查该POI是否已打卡
      const isCheckedIn = checkedInPOIIds.includes(clickedMarker.id)
      setCanCheckin(canDoCheckin && !isCheckedIn)
      setIsPOICheckedIn(isCheckedIn)
      setPreviewPOI(clickedMarker)
      // 如果是特殊类型，触发金色光晕
      if (clickedMarker.type === 'spirit_lighthouse' || clickedMarker.type === 'club' || clickedMarker.type === 'arena') {
        triggerLighthouseEffect()
      }
      Taro.vibrateShort({ type: 'light' })
    }
  }, [markers, userLat, userLng, checkedInPOIIds])

  // 关闭POI预览卡片
  const handleClosePreview = () => {
    if (previewPOI && (previewPOI.type === 'spirit_lighthouse' || previewPOI.type === 'club' || previewPOI.type === 'arena')) {
      stopLighthouseEffect()
    }
    setPreviewPOI(null)
    setCanCheckin(false)
  }

  // 切换模式 - 自由/探索
  const toggleMode = () => {
    const newMode = mode === 'free' ? 'explore' : 'free'
    
    // 如果是从探索模式切换到自由模式，且当前有进行中的剧情，显示确认提示
    if (newMode === 'free' && exploreMode === 'explore' && currentStoryNode) {
      Taro.showModal({
        title: '确认切换模式',
        content: '目前还在剧情中，若切换模式，将中断剧情。是否继续？',
        confirmText: '确认切换',
        cancelText: '继续剧情',
        confirmColor: '#F5C518',
        success: (res) => {
          if (res.confirm) {
            // 用户确认切换，关闭剧情并切换到自由模式
            setShowStoryDialog(false)
            setCurrentStoryNode(null)
            setMode(newMode)
            handleModeChange(newMode)
            Taro.showToast({
              title: '已切换至自由模式，剧情已中断',
              icon: 'none',
              duration: 2000
            })
          }
        }
      })
      return
    }
    
    setMode(newMode)
    handleModeChange(newMode)
    
    // 显示切换提示
    const message = newMode === 'explore' 
      ? '已切换至探索模式，跟随故事探索成都' 
      : '已切换至自由模式，自由探索不受约束'
    Taro.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  }

  // AG超玩会历史询问弹窗处理
  const [agVideoUrl, setAgVideoUrl] = useState('')
  const [preloadedVideoUrls, setPreloadedVideoUrls] = useState<Record<string, string>>({})

  // 预加载视频链接
  useEffect(() => {
    const preloadVideos = async () => {
      try {
        const urls: Record<string, string> = {}
        const agUrl = await getTempFileURL('agVideo')
        const phoenixUrl = await getTempFileURL('phoenixVideo')
        if (agUrl) urls.agVideo = agUrl
        if (phoenixUrl) urls.phoenixVideo = phoenixUrl
        console.log('预加载视频链接:', urls)
        setPreloadedVideoUrls(urls)
      } catch (e) {
        console.error('预加载视频失败:', e)
      }
    }
    preloadVideos()
  }, [])

  const handleAGHistoryYes = () => {
    setShowAGHistoryDialog(false)
    // 使用预加载的链接
    const url = preloadedVideoUrls.agVideo
    console.log('AG视频预加载链接:', url)
    
    if (!url) {
      console.error('预加载链接不存在')
      Taro.showToast({ title: '视频加载中，请稍后重试', icon: 'none' })
      return
    }
    
    setAgVideoUrl(url)
    setShowAGVideo(true)
  }

  const handleAGHistoryNo = () => {
    setShowAGHistoryDialog(false)
    if (pendingAGPOI.current) {
      setNearbyPOI(pendingAGPOI.current)
      pendingAGPOI.current = null
    }
  }

  // 视频播放结束处理
  const handleVideoEnded = () => {
    setShowAGVideo(false)
    setAgVideoEnded(true)
    if (pendingAGPOI.current) {
      setNearbyPOI(pendingAGPOI.current)
      pendingAGPOI.current = null
    }
  }

  // 凤凰山体育公园历史询问弹窗处理
  const [arenaVideoUrl, setArenaVideoUrl] = useState('')

  const handleArenaHistoryYes = async () => {
    setShowArenaHistoryDialog(false)
    // 使用缓存获取云存储临时链接
    const url = await getTempFileURL('phoenixVideo')
    setArenaVideoUrl(url || '')
    setShowArenaVideo(true)
  }

  const handleArenaHistoryNo = () => {
    setShowArenaHistoryDialog(false)
    if (pendingArenaPOI.current) {
      setNearbyPOI(pendingArenaPOI.current)
      pendingArenaPOI.current = null
    }
  }

  // 凤凰山视频播放结束处理
  const handleArenaVideoEnded = () => {
    setShowArenaVideo(false)
    setArenaVideoEnded(true)
    if (pendingArenaPOI.current) {
      setNearbyPOI(pendingArenaPOI.current)
      pendingArenaPOI.current = null
    }
  }

  // AI头像拖动处理
  const handleAvatarTouchStart = (e: any) => {
    const touch = e.touches[0]
    avatarDragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialLeft: avatarPos.x,
      initialTop: avatarPos.y,
      isDragging: false
    }
  }

  const handleAvatarTouchMove = (e: any) => {
    e.stopPropagation()
    const touch = e.touches[0]
    const dx = touch.clientX - avatarDragRef.current.startX
    const dy = touch.clientY - avatarDragRef.current.startY
    
    // 移动超过5px认为是拖动
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      avatarDragRef.current.isDragging = true
    }
    
    setAvatarPos({
      x: avatarDragRef.current.initialLeft + dx,
      y: avatarDragRef.current.initialTop + dy
    })
  }

  const handleAvatarTouchEnd = (e: any) => {
    // 如果是拖动操作，阻止点击事件
    if (avatarDragRef.current.isDragging) {
      e.stopPropagation()
    }
  }

  // 模式切换按钮拖动处理
  const handleModeTouchStart = (e: any) => {
    const touch = e.touches[0]
    modeDragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialLeft: modeSwitchPos.x,
      initialTop: modeSwitchPos.y,
      isDragging: false
    }
  }

  const handleModeTouchMove = (e: any) => {
    e.stopPropagation()
    const touch = e.touches[0]
    const dx = touch.clientX - modeDragRef.current.startX
    const dy = touch.clientY - modeDragRef.current.startY
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      modeDragRef.current.isDragging = true
    }
    
    setModeSwitchPos({
      x: modeDragRef.current.initialLeft + dx,
      y: modeDragRef.current.initialTop + dy
    })
  }

  const handleModeTouchEnd = (e: any) => {
    if (modeDragRef.current.isDragging) {
      e.stopPropagation()
    }
  }

  // 切换定位模式（真实/模拟）
  const toggleLocationMode = () => {
    setIsMockLocation(prev => !prev)
  }

  // 手动移动位置
  const movePosition = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 0.0005 // 移动步长（约50米）
    
    let newLat = userLat
    let newLng = userLng
    
    switch (direction) {
      case 'up':
        newLat = userLat + step
        setUserLat(newLat)
        setHeading(0)
        break
      case 'down':
        newLat = userLat - step
        setUserLat(newLat)
        setHeading(180)
        break
      case 'left':
        newLng = userLng - step
        setUserLng(newLng)
        setHeading(270)
        break
      case 'right':
        newLng = userLng + step
        setUserLng(newLng)
        setHeading(90)
        break
    }
    
    console.log('[MockLocation] 模拟移动:', { direction, newLat, newLng })
    
    // 检查附近POI
    checkNearbyPOI(newLat, newLng)
    
    // 检查故事触发（模拟定位模式下也需要检查）
    checkStoryTriggerAtLocation(newLat, newLng)
  }

  // 打开聊天面板
  const openChatPanel = () => {
    setShowChatPanel(true)
  }

  // 关闭聊天面板
  const closeChatPanel = () => {
    setShowChatPanel(false)
    // 重置高度
    setChatPanelHeight(65)
  }

  // 获取屏幕高度
  const [screenHeight, setScreenHeight] = useState(800)
  useEffect(() => {
    const sysInfo = Taro.getSystemInfoSync()
    setScreenHeight(sysInfo.screenHeight)
  }, [])

  // 拖拽开始
  const handleDragStart = useCallback((e: any) => {
    setIsDragging(true)
    dragStartY.current = e.touches[0].clientY
    dragStartHeight.current = chatPanelHeight
    // 小程序中不能操作DOM，使用状态管理
  }, [chatPanelHeight])

  // 拖拽中
  const handleDragMove = useCallback((e: any) => {
    if (!isDragging) return

    const currentY = e.touches[0].clientY
    const deltaY = dragStartY.current - currentY
    const deltaVh = (deltaY / screenHeight) * 100

    let newHeight = dragStartHeight.current + deltaVh
    newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight))

    setChatPanelHeight(newHeight)
  }, [isDragging, screenHeight])

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    // 小程序中不能操作DOM，过渡效果通过CSS类控制
    
    // 吸附到最近的档位
    if (chatPanelHeight < 40) {
      setChatPanelHeight(MIN_HEIGHT)
    } else if (chatPanelHeight < 75) {
      setChatPanelHeight(65)
    } else {
      setChatPanelHeight(MAX_HEIGHT)
    }
  }, [chatPanelHeight])

  // 检查登录状态
  const checkLoginStatus = useCallback(async (): Promise<boolean> => {
    const loggedIn = isLoggedIn()
    setIsUserLoggedIn(loggedIn)
    if (loggedIn) {
      const user = getUser()
      setUserInfo(user)
    }
    return loggedIn
  }, [])

  // 自动登录（页面加载时调用）
  const handleAutoLogin = useCallback(async () => {
    // 显示登录中提示
    Taro.showLoading({ title: '登录中...', mask: true })

    try {
      const success = await doLogin()
      if (success) {
        setIsUserLoggedIn(true)
        setUserInfo(getUser())
        Taro.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
      } else {
        // 登录失败，显示重试按钮
        Taro.showModal({
          title: '登录失败',
          content: '无法完成微信登录，是否重试？',
          confirmText: '重试',
          cancelText: '暂不登录',
          success: (res) => {
            if (res.confirm) {
              handleAutoLogin()
            }
          }
        })
      }
    } catch (error) {
      console.error('自动登录失败', error)
      Taro.showModal({
        title: '登录异常',
        content: '登录过程发生错误，是否重试？',
        confirmText: '重试',
        cancelText: '暂不登录',
        success: (res) => {
          if (res.confirm) {
            handleAutoLogin()
          }
        }
      })
    } finally {
      Taro.hideLoading()
    }
  }, [])

  // 处理登录
  const handleLogin = useCallback(async () => {
    Taro.showLoading({ title: '登录中...' })
    const success = await doLogin()
    Taro.hideLoading()

    if (success) {
      setIsUserLoggedIn(true)
      setUserInfo(getUser())
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '登录失败', icon: 'none' })
    }
  }, [])

  // 发送消息
  const handleSendMessage = useCallback(async () => {
    // 检查登录状态
    if (!isUserLoggedIn) {
      Taro.showModal({
        title: '需要登录',
        content: '登录后即可与李白对话',
        confirmText: '立即登录',
        success: (res) => {
          if (res.confirm) {
            handleLogin()
          }
        }
      })
      return
    }

    if (!chatInput.trim() || isChatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')

    // 添加用户消息
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsChatLoading(true)

    try {
      // 调用后端AI接口
      const result = await api.chat({
        hero_id: 'libai',
        message: userMessage,
        city_code: 'CD',
        need_tts: true
      })

      // 添加AI回复
      setChatMessages(prev => [...prev, { role: 'ai', content: result.reply }])

      // 先结束loading状态，让用户看到回复
      setIsChatLoading(false)

      // 异步播放语音，不阻塞UI
      if (result.audio_ready && result.audio_base64) {
        playBase64Audio(result.audio_base64).catch((e) => {
          console.warn('语音播放失败', e)
        })
      }
    } catch (error) {
      console.error('发送消息失败', error)
      // 先结束loading，再显示降级回复
      setIsChatLoading(false)
      // 降级显示
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: '哈哈，峡谷信号不太好，容我饮一杯再与你细说！'
      }])
    }
  }, [chatInput, isChatLoading])

  // 底部工具栏点击事件
  const handleMedalClick = () => {
    // 跳转到羁绊书签展示页面
    Taro.navigateTo({
      url: '/pages/bookmark-gallery/index'
    })
  }

  const handleBackpackClick = () => {
    Taro.navigateTo({ url: '/pages/backpack/index' })
  }

  // 藏宝图相关函数
  const openRouteMap = () => {
    setFloatOpen(true)
    setTreasureMapVisible(true)
  }

  const closeRouteMap = () => {
    setTreasureMapVisible(false)
    setFloatOpen(false)
  }

  const startFromRouteMap = (routeId: number) => {
    setCurrentRouteId(routeId)
    setTreasureMapVisible(false)
    setFloatOpen(false)
    Taro.showToast({ title: `开始路线${routeId}`, icon: 'none' })
  }

  // 英雄标记
  const heroMarker: POIMarker = {
    id: 9999,
    latitude: userLat,
    longitude: userLng,
    iconPath: '',
    width: 48,
    height: 64,
    anchor: { x: 0.5, y: 0.9 },
    title: selectedHero,
    type: 'player_footprint'
  }

  const allMarkers = [...markers, heroMarker]

  // 探索范围光圈（多层）- 静态无动画
  const exploreCircles = [
    { latitude: userLat, longitude: userLng, radius: 80, color: '#F5C51820', fillColor: '#F5C51808', strokeWidth: 1 },
    { latitude: userLat, longitude: userLng, radius: 80, color: '#F5C51840', fillColor: '#F5C51815', strokeWidth: 2 },
    { latitude: userLat, longitude: userLng, radius: 15, color: '#F5C518', fillColor: '#F5C51860', strokeWidth: 0 },
  ]

  // 计算碎片奖励（与后端规则保持一致）
  const calcFragments = (poiType: string, poiName: string) => {
    const map: Record<string, [number, number, number, number]> = {
      blue_buff: [2, 3, 1, 1],
      red_buff: [3, 5, 1, 2],
      tower: [5, 8, 2, 3],
      player_footprint: [5, 8, 2, 3],
      spirit_lighthouse: [8, 15, 3, 5],
      club: [3, 5, 1, 2],
      arena: [5, 8, 2, 3],
    }
    const rng = map[poiType] || map.blue_buff
    const hero = rng[0] + Math.floor(Math.random() * (rng[1] - rng[0] + 1))
    const skin = rng[2] + Math.floor(Math.random() * (rng[3] - rng[2] + 1))

    // 按 POI 名称判断是否首次打卡
    const history: any[] = Taro.getStorageSync('my_checkins') || []
    const isFirst = !history.some((h: any) => h.name === poiName)

    if (isFirst) {
      return { hero: hero * 2, skin: skin * 2, isFirst }
    }
    return { hero, skin, isFirst }
  }

  const doPerformCheckin = (poi: POIMarker) => {
    // 如果是荣耀灯塔、电竞俱乐部或比赛场馆，停止金色光晕
    if (poi.type === 'spirit_lighthouse' || poi.type === 'club' || poi.type === 'arena') {
      stopLighthouseEffect()
    }

    // 记录打卡到本地存储（含名称用于首次判断）
    const checkins = Taro.getStorageSync('my_checkins') || []
    checkins.push({ id: poi.id, name: poi.title, type: poi.type, time: Date.now() })
    Taro.setStorageSync('my_checkins', checkins)

    // 更新已打卡POI列表
    setCheckedInPOIIds(prev => [...prev, poi.id])

    // 计算碎片奖励
    const frags = calcFragments(poi.type, poi.title)
    setFragData({ hero: frags.hero, skin: frags.skin, isFirst: frags.isFirst })

    // 异步同步后端（非阻塞）
    const user = getUser()
    api.checkin({
      poi_id: String(poi.id),
      hero_id: user?.selected_hero || 'li_bai',
      user_lat: userLat,
      user_lng: userLng,
    }).then((res: any) => {
      if (res.fragments) {
        // 用后端返回的真实数据覆盖前端随机值
        setFragData({
          hero: res.fragments.hero_fragments,
          skin: res.fragments.skin_fragments,
          isFirst: res.fragments.is_first_time,
        })
        // 更新本地资产缓存
        const current = Taro.getStorageSync('user_assets') || { heroFragments: 0, skinFragments: 0 }
        Taro.setStorageSync('user_assets', {
          heroFragments: (current.heroFragments || 0) + res.fragments.hero_fragments,
          skinFragments: (current.skinFragments || 0) + res.fragments.skin_fragments,
        })
      }
    }).catch(() => {
      // 后端失败时，前端随机值仍然有效，也更新本地缓存
      const current = Taro.getStorageSync('user_assets') || { heroFragments: 0, skinFragments: 0 }
      Taro.setStorageSync('user_assets', {
        heroFragments: (current.heroFragments || 0) + frags.hero,
        skinFragments: (current.skinFragments || 0) + frags.skin,
      })
    })

    // 显示打卡成功提示
    Taro.showToast({ title: `打卡成功：${poi.title}`, icon: 'success' })

    // 关闭POI弹窗
    setNearbyPOI(null)

    // 触发奖励弹窗
    setTimeout(() => {
      rewardPopupRef.current?.trigger({
        id: poi.id,
        name: poi.title,
        type: poi.type
      })
    }, 500)

    // 延迟展示碎片奖励弹窗
    setTimeout(() => {
      setShowFragPopup(true)
    }, 1200)
  }

  const handleCheckin = () => {
    if (nearbyPOI) {
      const poi = nearbyPOI

      // 防御塔需要先答题推塔
      if (poi.type === 'tower') {
        const cooldowns = Taro.getStorageSync('tower_cooldowns') || {}
        const cooldownEnd = cooldowns[String(poi.id)]
        if (cooldownEnd && Date.now() < cooldownEnd) {
          const remain = Math.ceil((cooldownEnd - Date.now()) / 1000)
          const mins = Math.floor(remain / 60)
          const secs = remain % 60
          Taro.showToast({ title: `冷却中，请${mins}分${secs}秒后再试`, icon: 'none' })
          return
        }
        setQuizPOI(poi)
        setShowTowerQuiz(true)
        return
      }

      doPerformCheckin(poi)
    }
  }

  const handleClosePOI = () => {
    // 如果是荣耀灯塔、电竞俱乐部或比赛场馆，停止金色光晕
    if (nearbyPOI && (nearbyPOI.type === 'spirit_lighthouse' || nearbyPOI.type === 'club' || nearbyPOI.type === 'arena')) {
      stopLighthouseEffect()
    }
    // 设置5分钟冷却期
    if (nearbyPOI) {
      const cooldownEnd = Date.now() + 5 * 60 * 1000 // 5分钟后
      setPoiCooldowns(prev => ({
        ...prev,
        [nearbyPOI.id]: cooldownEnd
      }))
      Taro.showToast({ title: '5分钟后可再次触发', icon: 'none' })
    }
    setNearbyPOI(null)
  }

  // 跳转到英雄选择页面
  const goToHeroSelect = () => {
    Taro.navigateTo({ url: '/packageA/pages/hero-select/index' })
  }

  // 返回首页
  const goToHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  return (
    <View className='explore-page'>
      {/* 英雄未选择锁定遮罩 */}
      {!hasSelectedHero && (
        <View className='hero-lock-overlay'>
          <View className='hero-lock-content'>
            <Text className='hero-lock-icon'>🔒</Text>
            <Text className='hero-lock-title'>请先选择英雄</Text>
            <Text className='hero-lock-desc'>选择你的专属英雄后才能开始探索之旅</Text>
            <View className='hero-lock-buttons'>
              <View className='hero-lock-btn primary' onClick={goToHeroSelect}>
                <Text className='btn-text'>去选择英雄</Text>
              </View>
              <View className='hero-lock-btn ghost' onClick={goToHome}>
                <Text className='btn-text'>返回首页</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 3D透视地图 */}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Map
        id='exploreMap'
        className='explore-map'
        latitude={userLat}
        longitude={userLng}
        scale={scale}
        skew={35}
        rotate={mapRotate}
        enable-3D
        enable-rotate
        enable-overlooking
        enable-zoom
        show-compass={false}
        markers={allMarkers}
        circles={exploreCircles}
        polyline={routePolyline}
        show-location={false}
        enableScroll={!isPetDragging}
        onMarkerTap={handleMarkerTap}
      />

      {/* 英雄脚下光效 */}
      <CoverView className='hero-glow-overlay'>
        <CoverView className='hero-glow' />
      </CoverView>

      {/* 荣耀灯塔金色光晕 - 使用View组件提高兼容性 */}
      {showGoldenGlow && (
        <View className='golden-glow-overlay animate-fadeInOut' />
      )}

      {/* 路线规划信息悬浮条 - 可拖拽变形 */}
      {routeInfo && (
        <View
          id='routeInfoBar'
          className={[
            'route-info-bar',
            routeBarShape === 'circle' ? 'route-info-bar--circle' : '',
            routeBarSnapping ? 'route-info-bar--snapping' : 'route-info-bar--dragging'
          ].join(' ')}
          style={{
            transform: `translate(${routeBarPos.x}px, ${routeBarPos.y}px)`
          }}
          onTouchStart={handleRouteBarTouchStart}
          onTouchMove={handleRouteBarTouchMove}
          onTouchEnd={handleRouteBarTouchEnd}
          catchMove
          onClick={() => {
            if (!routeBarDragRef.current.hasMoved) {
              if (routeBarShape === 'circle') {
                handleCircleButtonClick()
              } else if (routeInfo.mode === 'transit' && routeInfo.transitDetail) {
                setShowTransitDetail(true)
              } else {
                setShowModeSelector(true)
              }
            }
          }}
        >
          {routeBarShape === 'bar' ? (
            // 条形内容
            <View className='rib-bar-content'>
              <View className='rib-accent-line' />
              <View className='rib-info'>
                <Text className='rib-distance'>
                  {routeInfo.distance >= 1000
                    ? `${(routeInfo.distance / 1000).toFixed(1)} km`
                    : `${routeInfo.distance} m`}
                </Text>
                <Text className='rib-sep'>·</Text>
                <Text className='rib-duration'>
                  {(() => {
                    const names: Record<string, string> = {
                      walking: '步行', driving: '驾车',
                      bicycling: '骑行', ebicycling: '电动车', transit: '公交'
                    }
                    return `${names[routeInfo.mode] || '步行'} ${Math.ceil(routeInfo.duration)} 分钟`
                  })()}
                </Text>
              </View>
              <View
                className='rib-close'
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  setRoutePolyline([])
                  setRouteInfo(null)
                  setRouteBarPos({ x: 0, y: 0 })
                  setRouteBarShape('bar')
                }}
              >
                <Text className='rib-close-icon'>✕</Text>
              </View>
            </View>
          ) : (
            // 圆形内容
            <View className='rib-circle-content'>
              <Image
                className='rib-circle-icon'
                src={require('../../assets/icons/walking.svg')}
                mode='aspectFit'
              />
            </View>
          )}
        </View>
      )}

      {/* 出行方式选择器 */}
      {showModeSelector && (
        <View className='mode-selector-overlay' onClick={() => setShowModeSelector(false)}>
          <View className='mode-selector' onClick={(e) => e.stopPropagation()}>
            <View className='mode-selector__header'>
              <Text className='mode-selector__title'>选择出行方式</Text>
              <View className='mode-selector__close' onClick={() => setShowModeSelector(false)}>
                <Text className='mode-selector__close-text'>✕</Text>
              </View>
            </View>
            <View className='mode-selector__options'>
              {[
                { key: 'walking', label: '步行', icon: '🚶', color: '#4285F4' },
                { key: 'driving', label: '驾车', icon: '🚗', color: '#34A853' },
                { key: 'bicycling', label: '骑行', icon: '🚴', color: '#FBBC04' },
                { key: 'ebicycling', label: '电动车', icon: '🛵', color: '#EA4335' },
                { key: 'transit', label: '公交', icon: '🚌', color: '#9C27B0' }
              ].map((option) => (
                <View
                  key={option.key}
                  className={`mode-option ${currentTravelMode === option.key ? 'active' : ''}`}
                  onClick={() => handleSwitchTravelMode(option.key as import('../../utils/map-route').TravelMode)}
                >
                  <Text className='mode-option__icon' style={{ color: option.color }}>
                    {option.icon}
                  </Text>
                  <Text className='mode-option__label'>{option.label}</Text>
                  {currentTravelMode === option.key && (
                    <View className='mode-option__check' style={{ backgroundColor: option.color }}>
                      <Text className='mode-option__check-icon'>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 公交路线详情面板 */}
      {showTransitDetail && routeInfo?.transitDetail && (
        <View className='transit-detail-overlay' onClick={() => setShowTransitDetail(false)}>
          <View 
            className='transit-detail-panel' 
            onClick={(e) => e.stopPropagation()}
            style={{ height: `${transitPanelHeight}vh` }}
          >
            {/* 拖拽把手 */}
            <View 
              className='transit-detail-drag-handle'
              onTouchStart={handleTransitPanelDragStart}
              onTouchMove={handleTransitPanelDragMove}
              onTouchEnd={handleTransitPanelDragEnd}
            >
              <View className='transit-detail-drag-bar'></View>
              <Text className='transit-detail-drag-hint'>⋮⋮ 上下滑动调整高度 ⋮⋮</Text>
            </View>
            
            {/* 头部：路线标题 */}
            <View className='transit-detail-header'>
              <View className='transit-detail-title-row'>
                <Text className='transit-detail-from'>{transitTitle.from}</Text>
                <Text className='transit-detail-arrow'>→</Text>
                <Text className='transit-detail-to'>{transitTitle.to}</Text>
              </View>
              <View className='transit-detail-tags'>
                {routeInfo.transitDetail.transferCount === 0 ? (
                  <Text className='transit-tag transit-tag--direct'>直达</Text>
                ) : (
                  <Text className='transit-tag transit-tag--transfer'>换乘{routeInfo.transitDetail.transferCount}次</Text>
                )}
                <Text className='transit-summary'>预计{Math.ceil(routeInfo.duration)}分钟 · 步行{(routeInfo.transitDetail.walkingDistance / 1000).toFixed(1)}公里</Text>
              </View>
              <View className='transit-detail-close' onClick={() => setShowTransitDetail(false)}>
                <Text className='transit-detail-close-text'>✕</Text>
              </View>
            </View>

            {/* 步骤列表 */}
            <ScrollView className='transit-steps' scrollY>
              {routeInfo.transitDetail.steps.map((step, index) => (
                <View key={index} className='transit-step'>
                  {/* 时间线 */}
                  <View className='transit-step-timeline'>
                    <View className={`transit-step-dot transit-step-dot--${step.mode === 'TRANSIT' ? (step.vehicle === 'SUBWAY' ? 'subway' : 'bus') : 'walking'}`} />
                    {index < routeInfo.transitDetail!.steps.length - 1 && (
                      <View className='transit-step-line' />
                    )}
                  </View>

                  {/* 内容 */}
                  <View className='transit-step-content'>
                    {/* 公共交通（公交/地铁） */}
                    {step.mode === 'TRANSIT' && step.lines && (
                      <View className='transit-step-transit'>
                        {/* 线路头部信息 */}
                        <View className='transit-step-header'>
                          <View className={`transit-step-icon-wrap ${step.vehicle === 'SUBWAY' ? 'transit-step-icon-wrap--subway' : ''}`}>
                            <Text className='transit-step-icon'>
                              {step.vehicle === 'SUBWAY' ? '🚇' : '🚌'}
                            </Text>
                          </View>
                          <View className='transit-step-main'>
                            <Text className='transit-step-title'>{step.lines[0]?.title}</Text>
                            {step.destination && (
                              <Text className='transit-step-direction'>开往 {step.destination.name} 方向</Text>
                            )}
                          </View>
                          <View className='transit-step-meta'>
                            <Text className='transit-step-duration'>{step.duration}分钟</Text>
                            {step.stationCount ? (
                              <Text className='transit-step-station-count'>{step.stationCount}站</Text>
                            ) : null}
                          </View>
                        </View>
                        
                        {/* 上下车站点详情 */}
                        {(step.getOn || step.getOff) && (
                          <View className='transit-step-stations-detail'>
                            {step.getOn && (
                              <View className='transit-station-row transit-station-row--on'>
                                <View className='transit-station-marker transit-station-marker--on' />
                                <View className='transit-station-info'>
                                  <Text className='transit-station-name'>{step.getOn.name}</Text>
                                  <Text className='transit-station-label'>上车</Text>
                                </View>
                              </View>
                            )}
                            {step.getOn && step.getOff && (
                              <View className='transit-station-connector'>
                                <Text className='transit-station-connector-line' />
                                {step.stationCount ? (
                                  <Text className='transit-station-connector-text'>途经{step.stationCount}站</Text>
                                ) : null}
                              </View>
                            )}
                            {step.getOff && (
                              <View className='transit-station-row transit-station-row--off'>
                                <View className='transit-station-marker transit-station-marker--off' />
                                <View className='transit-station-info'>
                                  <Text className='transit-station-name'>{step.getOff.name}</Text>
                                  <Text className='transit-station-label'>下车</Text>
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                        
                        {/* 距离和票价信息 */}
                        <View className='transit-step-distance'>
                          <Text className='transit-distance-text'>
                            {step.distance > 0 ? (
                              step.distance >= 1000 
                                ? `全程${(step.distance / 1000).toFixed(1)}公里`
                                : `全程${step.distance}米`
                            ) : null}
                            {step.price !== undefined && step.price > 0 ? (
                              <Text className='transit-price'> · {(step.price / 100).toFixed(1)}元</Text>
                            ) : step.price === 0 ? (
                              <Text className='transit-price'> · 免费</Text>
                            ) : null}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* 步行 */}
                    {step.mode === 'WALKING' && (
                      <View className='transit-step-walking'>
                        <View className='transit-step-header'>
                          <View className='transit-step-icon-wrap transit-step-icon-wrap--walking'>
                            <Text className='transit-step-icon'>🚶</Text>
                          </View>
                          <View className='transit-step-main'>
                            <Text className='transit-step-title transit-step-title--walking'>
                              {index === 0 
                                ? '步行至上车点'
                                : index === routeInfo.transitDetail!.steps.length - 1 
                                  ? '步行至终点'
                                  : '步行至换乘点'
                              }
                            </Text>
                            {step.instruction && step.instruction !== '步行' && (
                              <Text className='transit-step-instruction'>{step.instruction}</Text>
                            )}
                          </View>
                          <View className='transit-step-meta'>
                            <Text className='transit-step-duration'>{step.duration}分钟</Text>
                            <Text className='transit-step-distance-short'>
                              {step.distance >= 1000 
                                ? `${(step.distance / 1000).toFixed(1)}公里`
                                : `${step.distance}米`
                              }
                            </Text>
                          </View>
                        </View>
                        
                        {/* 步行详细指引 */}
                        {step.steps && step.steps.length > 0 && (
                          <View className='transit-walking-details'>
                            {step.steps.slice(0, 3).map((walkStep, wIndex) => (
                              <View key={wIndex} className='transit-walking-step'>
                                <Text className='transit-walking-bullet'>•</Text>
                                <Text className='transit-walking-text'>{walkStep.instruction}</Text>
                                <Text className='transit-walking-distance'>{walkStep.distance}米</Text>
                              </View>
                            ))}
                            {step.steps.length > 3 && (
                              <Text className='transit-walking-more'>...等共{step.steps.length}段路程</Text>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* 底部操作栏 */}
            <View className='transit-detail-footer'>
              <View className='transit-detail-btn' onClick={() => { setShowTransitDetail(false); setShowModeSelector(true) }}>
                <Text className='transit-detail-btn-text'>切换出行方式</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 顶部状态栏 - 播放视频、剧情模式、路线卡片或MVP弹窗/海报显示时隐藏 */}
      {!showAGVideo && !showArenaVideo && !showReportModal && !showPoster && !showStoryDialog && !showStoryRoute && (
        <CoverView className='top-status-bar'>
          <CoverView className='bond-progress'>
            <CoverView className='bond-label'>羁绊值 Lv.7</CoverView>
            <CoverView className='progress-track'>
            <CoverView className='progress-fill' style={{ width: '68%' }} />
          </CoverView>
        </CoverView>
          <CoverView className='checkin-count'>📍 已打卡 5/12 | 🔖 羁绊 {collectedFragmentIds.length}/4</CoverView>
        </CoverView>
      )}

      {/* AI桌宠 */}
      <WebPet heroAvatarUrl={heroAvatarUrls[selectedHero] || ''} heroName={selectedHero} onDragStateChange={setIsPetDragging} />

      {/* 可拖动的模式切换按钮 - 自由/探索 */}
      <View
        className='draggable-mode-switch'
        style={{ left: `${modeSwitchPos.x}px`, top: `${modeSwitchPos.y}px` }}
        onTouchStart={handleModeTouchStart}
        onTouchMove={handleModeTouchMove}
        onTouchEnd={handleModeTouchEnd}
      >
        <View className='mode-switch' onClick={toggleMode}>
          <View className={`mode-btn ${mode === 'free' ? 'active' : ''}`}>
            <Text className='mode-text'>自由</Text>
          </View>
          <View className={`mode-btn ${mode === 'explore' ? 'active' : ''}`}>
            <Text className='mode-text'>探索</Text>
          </View>
        </View>
      </View>

      {/* 定位模式切换按钮 */}
      <CoverView className='location-mode-btn' onClick={toggleLocationMode}>
        <CoverView className='location-mode-text'>
          {isMockLocation ? '🎮 模拟' : '📍 真实'}
        </CoverView>
      </CoverView>

          {/* 羁绊调试按钮（仅模拟模式显示） */}
          {isMockLocation && (
            <View className='debug-bond-btn' onClick={() => setShowDebugPanel(true)}>
              <Text className='debug-icon'>🔖</Text>
            </View>
          )}

      {/* 模拟定位方向控制 - 使用View组件提高兼容性 */}
      {isMockLocation && showControls && (
        <View className='direction-controls'>
          <View className='d-pad'>
            <View className='d-btn up' onClick={() => movePosition('up')}>
              <Text className='d-btn-text'>▲</Text>
            </View>
            <View className='d-btn left' onClick={() => movePosition('left')}>
              <Text className='d-btn-text'>◀</Text>
            </View>
            <View className='d-btn center'>
              <Text className='d-btn-text'>●</Text>
            </View>
            <View className='d-btn right' onClick={() => movePosition('right')}>
              <Text className='d-btn-text'>▶</Text>
            </View>
            <View className='d-btn down' onClick={() => movePosition('down')}>
              <Text className='d-btn-text'>▼</Text>
            </View>
          </View>
        </View>
      )}



      {/* 羁绊碎片调试面板 */}
      {showDebugPanel && (
        <View className='debug-panel-overlay' onClick={() => setShowDebugPanel(false)}>
          <View className='debug-panel' onClick={(e) => e.stopPropagation()}>
            <View className='debug-header'>
              <View className='debug-title-row'>
                <Text className='debug-title'>🔖 羁绊碎片位置</Text>
                <View style={{ display: 'flex', gap: '20rpx' }}>
                  {/* 重置故事进度按钮 */}
                  <View
                    className='debug-reset-icon'
                    style={{ background: 'rgba(100, 200, 255, 0.2)' }}
                    onClick={() => {
                      // 重置故事进度
                      clearStoryProgress()
                      Taro.removeStorageSync('story_progress')
                      Taro.removeStorageSync('explore_mode')
                      setShowDebugPanel(false)
                      setStoryProgress(null)
                      setCurrentStoryNode(null)
                      setShowStoryDialog(false)
                      setMode('free')
                      setExploreModeState('free')
                      Taro.showToast({
                        title: '故事进度已重置',
                        icon: 'success'
                      })
                      console.log('🔄 故事进度已重置')
                    }}
                  >
                    <Text className='reset-icon-text'>📖</Text>
                  </View>
                  {/* 测试MVP战报按钮 */}
                  <View
                    className='debug-reset-icon'
                    style={{ background: 'rgba(245, 197, 24, 0.2)' }}
                    onClick={() => {
                      // 重置检查状态，直接触发MVP战报弹窗
                      Taro.removeStorageSync('daily_report_checked')
                      setShowReportModal(true)
                      setShowDebugPanel(false)
                      console.log('🎮 MVP战报弹窗测试已触发')
                    }}
                  >
                    <Text className='reset-icon-text'>🏆</Text>
                  </View>
                  <View
                    className='debug-reset-icon'
                    onClick={() => {
                      Taro.showModal({
                        title: '确认清除',
                        content: '确定要清除所有打卡记录和羁绊数据吗？\n\n包括：\n• 打卡记录\n• 探索度\n• 背包奖励\n• 羁绊碎片',
                        success: (res) => {
                          if (res.confirm) {
                            // 清除羁绊数据
                            Taro.removeStorageSync('collected_fragments')
                            Taro.removeStorageSync('collected_fragments_data')
                            Taro.removeStorageSync('hidden_bookmark_unlocked')
                            // 清除打卡数据
                            Taro.removeStorageSync('my_checkins')
                            Taro.removeStorageSync('explore_score_base')
                            // 清除奖励数据
                            Taro.removeStorageSync('my_rewards')
                            Taro.removeStorageSync('my_badges')
                            // 重置状态
                            setCollectedFragmentIds([])
                            setHiddenBookmarkUnlocked(false)
                            setBondCooldowns({})
                            setActiveBondTrace(null)
                            setCheckedInPOIIds([])
                            Taro.showToast({ title: '所有数据已清除', icon: 'success' })
                          }
                        }
                      })
                    }}
                  >
                    <Text className='reset-icon-text'>🔄</Text>
                  </View>
                </View>
              </View>
              <View className='debug-close' onClick={() => setShowDebugPanel(false)}>✕</View>
            </View>
            <ScrollView className='debug-list' scrollY>
              <View className='debug-list-inner'>
                {ALL_EASTER_EGGS.map((trace, index) => {
                  const isCollected = collectedFragmentIds.includes(trace.fragmentId)
                  const distance = haversineDistance(userLat, userLng, trace.latitude, trace.longitude)
                  return (
                    <View key={trace.id} className={`debug-item ${isCollected ? 'collected' : ''}`}>
                      <View className='debug-item-header'>
                        <Text className='debug-item-name'>{index + 1}. {trace.name}</Text>
                        <Text className='debug-item-rarity' style={{ color: trace.rarityColor }}>
                          {trace.rarityLabel}
                        </Text>
                      </View>
                      <Text className='debug-item-location'>{trace.bondData?.locationContext || '未知位置'}</Text>
                      <Text className='debug-item-coords'>
                        📍 {trace.latitude.toFixed(4)}, {trace.longitude.toFixed(4)}
                      </Text>
                      <Text className='debug-item-distance'>
                        距离: {Math.round(distance)}m {distance <= 100 ? '✓ 可触发' : ''}
                      </Text>
                      <View 
                        className='debug-teleport-btn'
                        onClick={() => {
                          setUserLat(trace.latitude)
                          setUserLng(trace.longitude)
                          setShowDebugPanel(false)
                          Taro.showToast({ title: `已传送到: ${trace.name}`, icon: 'none' })
                        }}
                      >
                        <Text className='teleport-text'>传送到此位置</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* AG超玩会历史询问弹窗 */}
      {showAGHistoryDialog && (
        <View className='ag-history-dialog' onClick={handleAGHistoryNo}>
          <View className='ag-history-content' onClick={(e) => e.stopPropagation()}>
            <Text className='ag-history-title'>🏆 AG超玩会</Text>
            <Text className='ag-history-desc'>你是否想了解AG超玩会辉煌历史？</Text>
            <View className='ag-history-buttons'>
              <View className='ag-btn-ghost' onClick={handleAGHistoryNo}>否</View>
              <View className='ag-btn-primary' onClick={handleAGHistoryYes}>是</View>
            </View>
          </View>
        </View>
      )}

      {/* AG超玩会历史视频播放器 */}
      {showAGVideo && (
        <View className='ag-video-overlay' onClick={handleVideoEnded}>
          <View className='ag-video-container' onClick={(e) => e.stopPropagation()}>
            <Video
              className='ag-video-player'
              src={agVideoUrl}
              autoplay
              controls
              objectFit='contain'
              showProgress
              showFullscreenBtn
              showPlayBtn
              showCenterPlayBtn
              enableProgressGesture
              vslideGestureInFullscreen
              onEnded={handleVideoEnded}
              onError={(e) => {
                console.error('视频播放错误:', e)
                Taro.showToast({ title: '视频加载失败', icon: 'none' })
                handleVideoEnded()
              }}
            />
          </View>
          <View className='ag-video-skip' onClick={handleVideoEnded}>
            <Text className='ag-skip-text'>跳过</Text>
          </View>
        </View>
      )}

      {/* 凤凰山体育公园历史询问弹窗 */}
      {showArenaHistoryDialog && (
        <View className='ag-history-dialog' onClick={handleArenaHistoryNo}>
          <View className='ag-history-content' onClick={(e) => e.stopPropagation()}>
            <Text className='ag-history-title'>🏟️ 凤凰山体育公园</Text>
            <Text className='ag-history-desc'>是否想感受这个场馆曾经发生的热血的过去？</Text>
            <View className='ag-history-buttons'>
              <View className='ag-btn-ghost' onClick={handleArenaHistoryNo}>否</View>
              <View className='ag-btn-primary' onClick={handleArenaHistoryYes}>是</View>
            </View>
          </View>
        </View>
      )}

      {/* 凤凰山体育公园历史视频播放器 */}
      {showArenaVideo && (
        <View className='ag-video-overlay' onClick={handleArenaVideoEnded}>
          <View className='ag-video-container' onClick={(e) => e.stopPropagation()}>
            <Video
              className='ag-video-player'
              src={arenaVideoUrl}
              autoplay
              controls
              objectFit='contain'
              showProgress
              showFullscreenBtn
              showPlayBtn
              showCenterPlayBtn
              enableProgressGesture
              vslideGestureInFullscreen
              onEnded={handleArenaVideoEnded}
              onError={(e) => {
                console.error('视频播放错误:', e)
                Taro.showToast({ title: '视频加载失败', icon: 'none' })
                handleArenaVideoEnded()
              }}
            />
          </View>
          <View className='ag-video-skip' onClick={handleArenaVideoEnded}>
            <Text className='ag-skip-text'>跳过</Text>
          </View>
        </View>
      )}

      {/* 底部POI提示浮窗 - 支持LBS触发和地图点击预览 */}
      {(nearbyPOI || previewPOI) && (
        <>
          {/* POI遮罩层 - 点击关闭 */}
          <View 
            className='poi-overlay-backdrop'
            onClick={nearbyPOI ? handleClosePOI : handleClosePreview}
          />
          <View 
            className='poi-float animate-slideUp'
            onClick={(e) => e.stopPropagation()}
          >
            <View className='poi-float-header'>
              <Text className='poi-float-icon'>{getPOIIcon((nearbyPOI || previewPOI)!.type)}</Text>
              <View className='poi-float-info'>
                <Text className='poi-float-title'>
                  {nearbyPOI ? `${getPOITitle(nearbyPOI.type)}就在附近！` : `${getPOITitle((previewPOI)!.type)}预览`}
                </Text>
                <Text className='poi-float-name'>{(nearbyPOI || previewPOI)!.title}</Text>
              </View>
            </View>
          
          {/* 预览模式提示 */}
          {previewPOI && !canCheckin && !isPOICheckedIn && (
            <View className='poi-preview-notice'>
              <Text className='poi-preview-text'>📍 需要靠近该位置80米内才能打卡</Text>
            </View>
          )}
          
          {/* 已打卡提示 */}
          {previewPOI && isPOICheckedIn && (
            <View className='poi-checked-in-notice'>
              <Text className='poi-checked-in-text'>✅ 已打卡</Text>
            </View>
          )}
          
          {/* 可滑动的详细信息区域 */}
          {((nearbyPOI || previewPOI)!.category || (nearbyPOI || previewPOI)!.story) && (
            <ScrollView 
              className='poi-detail-section' 
              scrollY 
              scrollX
              scrollWithAnimation
              enableFlex
            >
              {(nearbyPOI || previewPOI)!.category && (
                <View className='poi-detail-row'>
                  <Text className='poi-detail-label'>类别</Text>
                  <Text className='poi-detail-value'>{(nearbyPOI || previewPOI)!.category}</Text>
                </View>
              )}
              {(nearbyPOI || previewPOI)!.story && (
                <View className='poi-detail-row'>
                  <Text className='poi-detail-label'>核心故事</Text>
                  <Text className='poi-detail-value poi-detail-story'>{(nearbyPOI || previewPOI)!.story}</Text>
                </View>
              )}
              {(nearbyPOI || previewPOI)!.esportChallenge && (
                <View className='poi-detail-row'>
                  <Text className='poi-detail-label'>电竞挑战</Text>
                  <Text className='poi-detail-value poi-detail-challenge'>{(nearbyPOI || previewPOI)!.esportChallenge}</Text>
                </View>
              )}
              {(nearbyPOI || previewPOI)!.address && (
                <View className='poi-detail-row'>
                  <Text className='poi-detail-label'>地址</Text>
                  <Text className='poi-detail-value'>{(nearbyPOI || previewPOI)!.address}</Text>
                </View>
              )}
              {((nearbyPOI || previewPOI)!.price || (nearbyPOI || previewPOI)!.duration) && (
                <View className='poi-detail-row poi-detail-inline'>
                  {(nearbyPOI || previewPOI)!.price && (
                    <View className='poi-detail-item'>
                      <Text className='poi-detail-label'>参考花费</Text>
                      <Text className='poi-detail-value'>{(nearbyPOI || previewPOI)!.price}</Text>
                    </View>
                  )}
                  {(nearbyPOI || previewPOI)!.duration && (
                    <View className='poi-detail-item'>
                      <Text className='poi-detail-label'>建议时长</Text>
                      <Text className='poi-detail-value'>{(nearbyPOI || previewPOI)!.duration}</Text>
                    </View>
                  )}
                </View>
              )}
              {(nearbyPOI || previewPOI)!.transport && (
                <View className='poi-detail-row'>
                  <Text className='poi-detail-label'>交通方式</Text>
                  <Text className='poi-detail-value'>{(nearbyPOI || previewPOI)!.transport}</Text>
                </View>
              )}
              {(nearbyPOI || previewPOI)!.events && (
                <View className='poi-detail-row'>
                  <Text className='poi-detail-label'>举办赛事</Text>
                  <Text className='poi-detail-value poi-detail-events'>🏆 {(nearbyPOI || previewPOI)!.events}</Text>
                </View>
              )}
              {(nearbyPOI || previewPOI)!.tips && (
                <View className='poi-detail-row'>
                  <Text className='poi-detail-label'>小贴士</Text>
                  <Text className='poi-detail-value poi-detail-tips'>💡 {(nearbyPOI || previewPOI)!.tips}</Text>
                </View>
              )}
            </ScrollView>
          )}
          
          <View className='poi-float-buttons'>
            <View className='poi-btn-ghost' onClick={nearbyPOI ? handleClosePOI : handleClosePreview}>
              {nearbyPOI ? '稍后' : '关闭'}
            </View>
            {isPOICheckedIn ? (
              <View className='poi-btn-checked'>✅ 已打卡</View>
            ) : nearbyPOI ? (
              <View className='poi-btn-primary' onClick={handleCheckin}>⚡ 立即打卡</View>
            ) : canCheckin ? (
              <View className='poi-btn-primary' onClick={() => { setNearbyPOI(previewPOI); handleClosePreview(); }}>⚡ 立即打卡</View>
            ) : (
              <View className='poi-btn-disabled'>📍 需靠近打卡</View>
            )}
          </View>
        </View>
        </>
      )}

      {/* 羁绊碎片收集覆盖层 */}
      <MemoryOverlay
        ref={memoryOverlayRef}
        heroId='li_bai'
        heroName={selectedHero}
        heroAvatar={heroAvatarUrls[selectedHero] || ''}
        collectedIds={collectedFragmentIds}
        onCollected={handleBondCollected}
        onHiddenUnlocked={handleHiddenUnlocked}
        onClosed={handleMemoryOverlayClosed}
      />

      {/* 底部弧形工具栏 */}
      <View className='bottom-toolbar'>
        <View className='toolbar-bg' />
        <View className='toolbar-content'>
          <View className='toolbar-item side' onClick={handleMedalClick}>
            {bottomIconUrls.medal ? (
              <Image className='toolbar-icon-img' src={bottomIconUrls.medal} mode='aspectFit' />
            ) : (
              <Text className='toolbar-icon-emoji'>🏅</Text>
            )}
            <Text className='toolbar-label'>成就</Text>
            {/* 羁绊收集进度角标 */}
            {collectedFragmentIds.length > 0 && (
              <View className='badge'>
                <Text className='badge-text'>{collectedFragmentIds.length}</Text>
              </View>
            )}
          </View>
          {/* 中间指南针按钮 */}
          <View className='toolbar-item center'>
            <View className='compass-btn-wrap' style={{ transform: `rotate(${heading}deg)` }}>
              <View className='compass-arrow' />
              <Text className='compass-text'>N</Text>
            </View>
          </View>
          <View className='toolbar-item side' onClick={handleBackpackClick}>
            {bottomIconUrls.backpack ? (
              <Image className='toolbar-icon-img' src={bottomIconUrls.backpack} mode='aspectFit' />
            ) : (
              <Text className='toolbar-icon-emoji'>🎒</Text>
            )}
            <Text className='toolbar-label'>背包</Text>
          </View>
        </View>
      </View>

      {/* 路线悬浮按钮 */}
      <View 
        className={`float-route-btn ${floatOpen ? 'hide' : ''}`}
        onClick={openRouteMap}
      >
        <Text className='float-route-icon'>🗺️</Text>
        <Text className='float-route-text'>路线</Text>
      </View>

      {/* 藏宝图组件 */}
      <TreasureMap
        visible={treasureMapVisible}
        routeId={currentRouteId}
        onClose={closeRouteMap}
        onStartExplore={startFromRouteMap}
      />

      {/* 打卡奖励弹窗 */}
      <RewardPopup ref={rewardPopupRef} />

      {/* 碎片奖励弹窗 */}
      {showFragPopup && (
        <FragmentRewardPopup
          heroFragments={fragData.hero}
          skinFragments={fragData.skin}
          isFirstTime={fragData.isFirst}
          onClose={() => setShowFragPopup(false)}
        />
      )}

      {/* MVP战报弹窗 */}
      <MVPReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={handleGenerateReport}
      />
      
      {/* MVP海报展示 */}
      {reportData && (
        <MVPPoster
          visible={showPoster}
          reportData={reportData}
          onClose={handleClosePoster}
          onSave={() => {
            Taro.showToast({ title: '海报已保存', icon: 'success' })
          }}
        />
      )}

      {/* 故事对话组件 */}
      {showStoryDialog && currentStoryNode && (
        <StoryDialog
          node={currentStoryNode}
          nextNode={getNextStoryNode() || undefined}
          onNext={handleStoryNext}
          onChoice={handleStoryChoice}
          onNavigateToNext={handleNavigateToNextLocation}
          useRoutePlanning={shouldUseRoutePlanning()}
          autoPlay={true}
          isLastNodeAtLocation={isLastNodeAtCurrentLocation()}
          disableSkip={currentStoryNode.id === 'free-mode-welcome'}
          onCompleteStory={() => {
            // 故事完成，切换到自由模式
            setShowStoryDialog(false)
            setCurrentStoryNode(null)
            setStoryProgress(null)
            // 同时更新两个模式状态
            setMode('free')
            setExploreModeState('free')
            // 保存到本地存储
            setExploreMode('free')
            // 清除故事进度
            clearStoryProgress()
            // 显示精美的完成提示
            Taro.showModal({
              title: '',
              content: '故事已完成，接下来自由探索这美妙的巴蜀之地吧',
              showCancel: false,
              confirmText: '好的',
              confirmColor: '#F5C518',
              success: () => {
                // 用户点击确认后可以执行其他操作
              }
            })
          }}
        />
      )}

      {/* 故事路线组件 */}
      <StoryRoute
        visible={showStoryRoute}
        onClose={() => setShowStoryRoute(false)}
      />

      {/* 推塔答题弹窗 */}
      {showTowerQuiz && quizPOI && (
        <TowerQuizModal
          poiId={quizPOI.id}
          poiName={quizPOI.title}
          onSuccess={() => {
            setShowTowerQuiz(false)
            doPerformCheckin(quizPOI)
            setQuizPOI(null)
          }}
          onFail={() => {
            setShowTowerQuiz(false)
            setQuizPOI(null)
          }}
          onClose={() => {
            setShowTowerQuiz(false)
            setQuizPOI(null)
          }}
        />
      )}
    </View>
  )
}

// 获取POI图标
const getPOIIcon = (type: string) => {
  const icons: Record<string, string> = {
    blue_buff: '🔵',
    red_buff: '🔴',
    tower: '🏛️',
    spirit_lighthouse: '🏮',
    player_footprint: '⭐',
    club: '🏆',
    arena: '🏟️',
  }
  return icons[type] || '📍'
}

// 获取POI标题
const getPOITitle = (type: string) => {
  const titles: Record<string, string> = {
    blue_buff: '蓝Buff',
    red_buff: '红Buff',
    tower: '防御塔',
    spirit_lighthouse: '荣耀灯塔',
    player_footprint: '选手足迹',
    club: '电竞俱乐部',
    arena: '比赛场馆',
  }
  return titles[type] || '打卡点'
}
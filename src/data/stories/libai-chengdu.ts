/**
 * 《李白·成都寻梦记》
 * 李白专属成都探索故事线
 * 
 * 故事主题：诗酒趁年华，电竞永不弃
 * 预计时长：3-4小时
 * 核心地点：春熙路→太古里→人民公园→武侯祠→杜甫草堂→AG电竞中心→九眼桥
 */

import type { StoryLine, StoryNode, StoryChapter } from '../../types/story'

// 故事节点定义
const storyNodes: Record<string, StoryNode> = {
  // ===== 序章：初入锦官城 =====
  'prologue-start': {
    id: 'prologue-start',
    type: 'dialog',
    chapter: 'prologue',
    isKeyNode: true,
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，欢迎来到锦官城！九天开出一成都，万户千门入画图——此城之美，古今闻名。今日李某做东，带你领略这城中诗酒、电竞、羁绊之妙！',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/01-序章/001-prologue-start-happy.wav',
      media: {
        type: 'scene',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/成都双子塔.jpg',
        caption: '双子塔 · 成都象征',
        tag: '成都·双子塔'
      }
    },
    nextNodeId: 'prologue-chunxi-choice'
  },
  'prologue-chunxi-scene': {
    id: 'prologue-chunxi-scene',
    type: 'dialog',
    chapter: 'prologue',
    location: {
      name: '春熙路/太古里',
      address: '成都市锦江区春熙路',
      lat: 30.6560,
      lng: 104.0820,
      radius: 200
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠你看，这春熙路果然名不虚传！霓虹闪烁，人潮如织，现代繁华与千年古韵在此交融。那边高楼林立，这边古刹深藏——这太古里与千年古刹大慈寺仅一墙之隔，正是"闹中取静"的绝佳写照。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/01-序章/002-prologue-chunxi-scene-excited.wav',
      media: {
        type: 'scene',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/春熙路.jpg',
        caption: '春熙路 · 繁华商圈',
        tag: '成都·春熙路'
      }
    },
    nextNodeId: 'prologue-chunxi-fashion'
  },
  'prologue-chunxi-fashion': {
    id: 'prologue-chunxi-fashion',
    type: 'dialog',
    chapter: 'prologue',
    location: {
      name: '春熙路/太古里',
      address: '成都市锦江区春熙路',
      lat: 30.6560,
      lng: 104.0820,
      radius: 200
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '此地不仅有时尚名店、网红美食，更有那量子光电竞中心就在不远处——那里可是KPL西部主场，承载着无数少年电竞梦想的圣地。少侠，你觉得这现代繁华之地，可还入眼？',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/01-序章/003-prologue-chunxi-fashion-happy.wav'
    },
    nextNodeId: 'ch1-temple-start'
  },
  'prologue-chunxi-choice': {
    id: 'prologue-chunxi-choice',
    type: 'choice',
    chapter: 'prologue',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，今日你我先去何处？是寻诗酒风流，还是问道电竞江湖？',
      emotion: 'normal',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/01-序章/004-prologue-chunxi-choice-normal.wav'
    },
    choices: [
      {
        id: 'route-poetry',
        text: '随李兄寻诗酒风流',
        nextNodeId: 'prologue-chunxi-transition'
      },
      {
        id: 'route-esports',
        text: '去探访电竞江湖',
        nextNodeId: 'ch4-ag-start'
      }
    ]
  },
  'prologue-chunxi-transition': {
    id: 'prologue-chunxi-transition',
    type: 'transition',
    chapter: 'prologue',
    location: {
      name: '春熙路/太古里',
      address: '成都市锦江区春熙路',
      lat: 30.6560,
      lng: 104.0820,
      radius: 200
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '好！既然是寻诗酒风流，那我们就先去那繁华之地春熙路看看吧！那里霓虹闪烁、人潮如织，是成都最热闹的地方。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/01-序章/005-prologue-chunxi-transition-excited.wav'
    },
    nextNodeId: 'prologue-chunxi-scene'
  },

  // ===== 第一章：诗酒趁年华（太古里+人民公园） =====
  'ch1-temple-start': {
    id: 'ch1-temple-start',
    type: 'transition',
    chapter: 'ch1',
    location: {
      name: '大慈寺',
      address: '成都市锦江区中纱帽街8号太古里',
      lat: 30.6555,
      lng: 104.0825,
      radius: 150
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，随我来！下一站我们去大慈寺，感受古刹与繁华的交融之美。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/02-第一章/006-ch1-temple-start-excited.wav'
    },
    nextNodeId: 'ch1-temple-dialog1'
  },
  'ch1-temple-dialog1': {
    id: 'ch1-temple-dialog1',
    type: 'dialog',
    chapter: 'ch1',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '古刹与繁华只一墙之隔。大慈寺的晨钟暮鼓，与身旁的时尚潮流，奇异地相融。这便如电竞与传统文化，新旧交融，各放异彩。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/02-第一章/007-ch1-temple-dialog1-thoughtful.wav'
    },
    nextNodeId: 'ch1-temple-dialog2'
  },
  'ch1-temple-dialog2': {
    id: 'ch1-temple-dialog2',
    type: 'transition',
    chapter: 'ch1',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '登高而望，自有"今来一登望，如上九天游"之感。少侠，你我虽在凡尘，心却可向九天。下一站，我们去人民公园，品一盏盖碗茶，感受地道的成都安逸！',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/02-第一章/008-ch1-temple-dialog2-excited.wav'
    },
    nextNodeId: 'ch1-park-transition'
  },
  'ch1-park-transition': {
    id: 'ch1-park-transition',
    type: 'dialog',
    chapter: 'ch1',
    location: {
      name: '人民公园鹤鸣茶社',
      address: '成都市青羊区祠堂街9号人民公园',
      lat: 30.6625,
      lng: 104.0585,
      radius: 150
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，我们到了人民公园鹤鸣茶社！这里是成都慢生活的绝佳写照。',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/02-第一章/009-ch1-park-transition-happy.wav'
    },
    nextNodeId: 'ch1-park-dialog1'
  },
  'ch1-park-dialog1': {
    id: 'ch1-park-dialog1',
    type: 'dialog',
    chapter: 'ch1',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '一盏盖碗茶，一把竹椅，看人来人往，听麻将声声——这才是地道的成都安逸！',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/02-第一章/010-ch1-park-dialog1-happy.wav'
    },
    nextNodeId: 'ch1-park-dialog2'
  },
  'ch1-park-dialog2': {
    id: 'ch1-park-dialog2',
    type: 'dialog',
    chapter: 'ch1',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '人生得意须尽欢，莫使金樽空对月。来，与我共饮此茶，且谈那电竞江湖中的"老男孩"追梦之事。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/02-第一章/011-ch1-park-dialog2-excited.wav'
    },
    nextNodeId: 'ch1-park-story'
  },
  'ch1-park-story': {
    id: 'ch1-park-story',
    type: 'dialog',
    chapter: 'ch1',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '770与SK，两个"老男孩"，26岁重新出发，只为一句承诺。虽最终差一步登顶，却诠释了何为不忘初心。这便如诗中所言：长风破浪会有时，直挂云帆济沧海。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/02-第一章/012-ch1-park-story-thoughtful.wav'
    },
    checkinReward: {
      bondPoints: 10,
      fragments: ['羁绊碎片·诗酒'],
      poetryLines: ['人生得意须尽欢，莫使金樽空对月']
    },
    nextNodeId: 'ch1-end'
  },
  'ch1-end': {
    id: 'ch1-end',
    type: 'transition',
    chapter: 'ch1',
    isKeyNode: true,
    location: {
      name: '人民公园鹤鸣茶社',
      address: '成都市青羊区祠堂街9号人民公园',
      lat: 30.6625,
      lng: 104.0585,
      radius: 150
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '茶过三巡，诗酒已尽兴。少侠，下一站我们去武侯祠，感受君臣合祀的忠义之情，丞相与玄德公正在那里等候着我们！',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/02-第一章/013-ch1-end-excited.wav'
    },
    nextNodeId: 'ch2-wuhou-start'
  },

  // ===== 第二章：君臣合祀（武侯祠+锦里） =====
  'ch2-wuhou-start': {
    id: 'ch2-wuhou-start',
    type: 'dialog',
    chapter: 'ch2',
    location: {
      name: '武侯祠',
      address: '成都市武侯区武侯祠大街231号',
      lat: 30.6415,
      lng: 104.0480,
      radius: 200
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '前方就是武侯祠了，红墙竹影，千年古韵。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/03-第二章/014-ch2-wuhou-start-thoughtful.wav',
      media: {
        type: 'scene',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/武侯寺.jpg',
        caption: '武侯祠 · 红墙竹影',
        tag: '成都·武侯祠'
      }
    },
    nextNodeId: 'ch2-wuhou-dialog1'
  },
  'ch2-wuhou-dialog1': {
    id: 'ch2-wuhou-dialog1',
    type: 'dialog',
    chapter: 'ch2',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '红墙竹影，古木参天。千年前的羽扇纶巾与金戈铁马，仿佛犹在耳畔。丞相与玄德公，君臣相知，肝胆相照。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/03-第二章/015-ch2-wuhou-dialog1-thoughtful.wav'
    },
    nextNodeId: 'ch2-wuhou-dialog2'
  },
  'ch2-wuhou-dialog2': {
    id: 'ch2-wuhou-dialog2',
    type: 'dialog',
    chapter: 'ch2',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '这便如Cat与Hurt，"过命的兄弟"。他们在QG，一起经历低谷与巅峰，彼此信任，肝胆相照。',
      emotion: 'normal',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/03-第二章/016-ch2-wuhou-dialog2-normal.wav'
    },
    nextNodeId: 'ch2-wuhou-choice'
  },
  'ch2-wuhou-choice': {
    id: 'ch2-wuhou-choice',
    type: 'choice',
    chapter: 'ch2',
    location: {
      name: '武侯祠',
      address: '成都市武侯区武侯祠大街231号',
      lat: 30.6415,
      lng: 104.0480,
      radius: 200
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，午间 hungry 否？锦里古街就在隔壁，可要随我去尝尝那地道的成都味道？',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/03-第二章/017-ch2-wuhou-choice-happy.wav'
    },
    choices: [
      {
        id: 'eat-yes',
        text: '正好饿了，去尝尝！',
        nextNodeId: 'ch2-jinli-food'
      },
      {
        id: 'eat-no',
        text: '先去下一处，回头再吃',
        nextNodeId: 'ch3-caotang-start'
      }
    ]
  },
  'ch2-jinli-food': {
    id: 'ch2-jinli-food',
    type: 'transition',
    chapter: 'ch2',
    location: {
      name: '锦里古街',
      address: '成都市武侯区武侯祠大街',
      lat: 30.6420,
      lng: 104.0475,
      radius: 100
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '夫妻肺片，麻、辣、鲜、香；龙抄手，皮薄馅鲜。这夫妻肺片总店，藏着百年江湖味，最是下酒！吃饱喝足后，少侠，下一站我们去杜甫草堂，拜访诗圣的幽居之所。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/03-第二章/018-ch2-jinli-food-excited.wav'
    },
    checkinReward: {
      bondPoints: 15,
      fragments: ['羁绊碎片·美食'],
      poetryLines: ['但使主人能醉客，不知何处是他乡']
    },
    nextNodeId: 'ch3-caotang-start'
  },

  // ===== 第三章：诗圣幽居（杜甫草堂+文殊院） =====
  'ch3-caotang-start': {
    id: 'ch3-caotang-start',
    type: 'dialog',
    chapter: 'ch3',
    location: {
      name: '杜甫草堂',
      address: '成都市青羊区青华路37号',
      lat: 30.6600,
      lng: 104.0330,
      radius: 200
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，我们到了杜甫草堂！这里可是诗圣杜甫流寓成都时的故居，让我带你感受诗圣当年的情怀。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/04-第三章/019-ch3-caotang-start-thoughtful.wav'
    },
    nextNodeId: 'ch3-caotang-dialog1'
  },
  'ch3-caotang-dialog1': {
    id: 'ch3-caotang-dialog1',
    type: 'dialog',
    chapter: 'ch3',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '诗圣昔年流寓之所，在此听雨、观竹，写下二百四十余首诗篇。秋来银杏叶黄时，更添几分诗情。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/04-第三章/020-ch3-caotang-dialog1-thoughtful.wav'
    },
    nextNodeId: 'ch3-caotang-dialog2'
  },
  'ch3-caotang-dialog2': {
    id: 'ch3-caotang-dialog2',
    type: 'transition',
    chapter: 'ch3',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少陵野老，与李某虽未曾谋面，却神交已久。他那"安得广厦千万间"的胸怀，令李某敬佩。少侠，下一站我们去文殊院，寻一份内心的宁静。',
      emotion: 'normal',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/04-第三章/021-ch3-caotang-dialog2-normal.wav'
    },
    nextNodeId: 'ch3-wenshu-start'
  },
  'ch3-wenshu-start': {
    id: 'ch3-wenshu-start',
    type: 'dialog',
    chapter: 'ch3',
    location: {
      name: '文殊院',
      address: '成都市青羊区文殊院街66号',
      lat: 30.6740,
      lng: 104.0760,
      radius: 150
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '文殊院到了，这里清净庄严，是都市中的一方净土。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/04-第三章/022-ch3-wenshu-start-thoughtful.wav'
    },
    nextNodeId: 'ch3-wenshu-dialog1'
  },
  'ch3-wenshu-dialog1': {
    id: 'ch3-wenshu-dialog1',
    type: 'dialog',
    chapter: 'ch3',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '寺内清净，寺外却是人间至味。那宫廷糕点铺，桃酥、拿破仑，香味能飘出半条街。不过李某今日带你来此，是为了寻一份内心的宁静。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/04-第三章/023-ch3-wenshu-dialog1-thoughtful.wav'
    },
    nextNodeId: 'ch3-wenshu-dialog2'
  },
  'ch3-wenshu-dialog2': {
    id: 'ch3-wenshu-dialog2',
    type: 'transition',
    chapter: 'ch3',
    location: {
      name: '文殊院',
      address: '成都市青羊区文殊院街66号',
      lat: 30.6740,
      lng: 104.0760,
      radius: 150
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '举头望明月，低头思故乡。少侠，行走江湖，莫忘初心。电竞之路漫漫，保持内心的宁静与热爱，方能走得更远。接下来，让我们去AG电竞中心，感受电竞的热血与激情！',
      emotion: 'normal',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/04-第三章/024-ch3-wenshu-dialog2-normal.wav'
    },
    checkinReward: {
      bondPoints: 10,
      fragments: ['羁绊碎片·问道'],
      poetryLines: ['举头望明月，低头思故乡']
    },
    nextNodeId: 'ch4-ag-start'
  },

  // ===== 第四章：电竞之魂（AG电竞中心） =====
  'ch4-ag-start': {
    id: 'ch4-ag-start',
    type: 'dialog',
    chapter: 'ch4',
    isKeyNode: true,
    location: {
      name: 'AG电竞中心',
      address: '成都市武侯区武科西五路235号西部智谷C区数字经济产业园',
      lat: 30.6300,
      lng: 104.0100,
      radius: 300
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '前方就是AG电竞中心，少侠，准备好感受电竞的热血了吗？',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/025-ch4-ag-start-excited.wav',
      media: {
        type: 'scene',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/ag超玩会选手.jpg',
        caption: 'AG超玩会 · 电竞战队',
        tag: '成都·AG电竞中心'
      }
    },
    nextNodeId: 'ch4-ag-dialog1'
  },
  'ch4-ag-dialog1': {
    id: 'ch4-ag-dialog1',
    type: 'dialog',
    chapter: 'ch4',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '这便是AG超玩会的所在！2024年6月15日启用的专业电竞场馆，西南地区最大的垂直电竞专业场馆之一。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/026-ch4-ag-dialog1-excited.wav'
    },
    nextNodeId: 'ch4-ag-video'
  },
  'ch4-ag-video': {
    id: 'ch4-ag-video',
    type: 'dialog',
    chapter: 'ch4',
    isKeyNode: true,
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '接下来，让我带你回顾一下AG超玩会在KPL赛场上辉煌的历史吧！',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/027-ch4-ag-video-excited.wav',
      media: {
        type: 'match',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/比赛视频/ag超玩会.mp4',
        caption: 'AG超玩会 · 辉煌历程',
        tag: 'KPL赛场回顾'
      }
    },
    nextNodeId: 'ch4-ag-dialog2'
  },
  'ch4-ag-dialog2': {
    id: 'ch4-ag-dialog2',
    type: 'transition',
    chapter: 'ch4',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '近1000个观赛席位，顶尖XR系统、超大曲面立屏...这里承载着无数少年的电竞梦想。少侠，接下来我们去凤凰山体育公园，那里有着AG最辉煌的时刻！',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/028-ch4-ag-dialog2-excited.wav'
    },
    nextNodeId: 'ch4-phoenix-start'
  },
  // 凤凰山体育公园 - AG夺冠回忆
  'ch4-phoenix-start': {
    id: 'ch4-phoenix-start',
    type: 'dialog',
    chapter: 'ch4',
    isKeyNode: true,
    location: {
      name: '凤凰山体育公园',
      address: '成都市金牛区北星大道一段',
      lat: 30.75,
      lng: 104.07,
      radius: 300
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，我们到了凤凰山体育公园！这里是2023年王者荣耀世界冠军杯总决赛的举办地，也是AG超玩会捧起冠军奖杯的荣耀之地！',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/029-ch4-phoenix-start-excited.wav',
      media: {
        type: 'scene',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/凤凰山夺冠ag.jpg',
        caption: 'AG超玩会 · 凤凰山夺冠',
        tag: '成都·凤凰山体育公园'
      }
    },
    nextNodeId: 'ch4-phoenix-memory'
  },
  'ch4-phoenix-memory': {
    id: 'ch4-phoenix-memory',
    type: 'dialog',
    chapter: 'ch4',
    isKeyNode: true,
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '2023年12月30日，那个寒冷的冬夜，AG超玩会在这里以4:2击败北京WB，时隔1477天再次捧起顶级赛事奖杯！全场金色雨落下，欢呼声震耳欲聋。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/030-ch4-phoenix-memory-excited.wav',
      media: {
        type: 'scene',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/凤凰山夺冠ag.jpg',
        caption: 'AG超玩会 · 世界冠军杯夺冠',
        tag: '2023 KIC总决赛'
      }
    },
    nextNodeId: 'ch4-phoenix-video'
  },
  'ch4-phoenix-video': {
    id: 'ch4-phoenix-video',
    type: 'dialog',
    chapter: 'ch4',
    isKeyNode: true,
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '让我们一起重温那激动人心的夺冠时刻吧！',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/031-ch4-phoenix-video-excited.wav',
      media: {
        type: 'match',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/比赛视频/凤凰山体育公园夺冠视频.mp4',
        caption: 'AG超玩会 · 凤凰山夺冠时刻',
        tag: '2023 KIC总决赛夺冠'
      }
    },
    nextNodeId: 'ch4-phoenix-story'
  },
  'ch4-phoenix-story': {
    id: 'ch4-phoenix-story',
    type: 'dialog',
    chapter: 'ch4',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '一诺成为了王者荣耀顶级赛事史上首位发育路FMVP。从"天才少年"到"团队核心"，他用七年时间证明了自己。这里的每一块砖石，都铭记着那群少年的热血与荣光。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/032-ch4-phoenix-story-thoughtful.wav'
    },
    checkinReward: {
      bondPoints: 20,
      fragments: ['羁绊碎片·荣耀'],
      poetryLines: ['长风破浪会有时，直挂云帆济沧海']
    },
    nextNodeId: 'ch4-ag-dialog3'
  },
  'ch4-ag-dialog3': {
    id: 'ch4-ag-dialog3',
    type: 'dialog',
    chapter: 'ch4',
    isKeyNode: true,
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '说起AG，不得不提神医梦泪与法师老帅——"初代双子星"。从队友到战友，共担风雨，同享荣光。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/033-ch4-ag-dialog3-excited.wav',
      media: {
        type: 'player',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/梦泪老帅.png',
        caption: 'AG超玩会 · 初代双子星',
        tag: '梦泪 & 老帅'
      }
    },
    nextNodeId: 'ch4-ag-dialog4'
  },
  'ch4-ag-dialog4': {
    id: 'ch4-ag-dialog4',
    type: 'dialog',
    chapter: 'ch4',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '如今的AG，一诺从"激进射手"成长为"团队核心"，那是数千次训练赛的沉淀。Cat转型辅助再夺冠，诠释了何为永不言弃。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/034-ch4-ag-dialog4-thoughtful.wav',
      media: {
        type: 'fit',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/一诺.jpg',
        caption: 'AG超玩会 · 一诺',
        tag: '发育路·核心',
        fit: 'contain'
      }
    },
    nextNodeId: 'ch4-ag-dialog5'
  },
  'ch4-ag-dialog5': {
    id: 'ch4-ag-dialog5',
    type: 'dialog',
    chapter: 'ch4',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '2017年，QGhappy.Hurt的孙尚香极限守家；2019年，渡劫的李信高地一打四；2024年，重庆狼队让三追四...这些，都是电竞精神的最好诠释。',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/035-ch4-ag-dialog5-excited.wav'
    },
    nextNodeId: 'ch4-ag-choice'
  },
  'ch4-ag-choice': {
    id: 'ch4-ag-choice',
    type: 'choice',
    chapter: 'ch4',
    location: {
      name: 'AG电竞中心',
      address: '成都市武侯区武科西五路235号西部智谷C区',
      lat: 30.6300,
      lng: 104.0100,
      radius: 300
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，电竞之路，你觉得最重要的是什么？',
      emotion: 'normal',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/036-ch4-ag-choice-normal.wav'
    },
    choices: [
      {
        id: 'choice-talent',
        text: '天赋异禀',
        nextNodeId: 'ch4-ag-ending-talent'
      },
      {
        id: 'choice-effort',
        text: '勤学苦练',
        nextNodeId: 'ch4-ag-ending-effort'
      },
      {
        id: 'choice-team',
        text: '团队羁绊',
        nextNodeId: 'ch4-ag-ending-team'
      }
    ]
  },
  'ch4-ag-ending-talent': {
    id: 'ch4-ag-ending-talent',
    type: 'transition',
    chapter: 'ch4',
    location: {
      name: 'AG电竞中心',
      address: '成都市武侯区武科西五路235号西部智谷C区',
      lat: 30.6300,
      lng: 104.0100,
      radius: 300
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '天生我材必有用，千金散尽还复来。天赋确实是起点，但若无勤奋加持，终究难成大器。少侠，接下来我们去九眼桥，在灯火璀璨中结束今日的旅程！',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/037-ch4-ag-ending-talent-thoughtful.wav'
    },
    nextNodeId: 'ch5-final-start'
  },
  'ch4-ag-ending-effort': {
    id: 'ch4-ag-ending-effort',
    type: 'transition',
    chapter: 'ch4',
    location: {
      name: 'AG电竞中心',
      address: '成都市武侯区武科西五路235号西部智谷C区',
      lat: 30.6300,
      lng: 104.0100,
      radius: 300
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '正是如此！职业选手平均每天训练超过10小时，全年无休。Cat精准的支援背后，是看比赛录像记满的笔记。少侠，接下来我们去九眼桥，在灯火璀璨中结束今日的旅程！',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/038-ch4-ag-ending-effort-happy.wav',
      media: {
        type: 'player',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/cat.jpg',
        caption: '成都AG超玩会 · Cat',
        tag: '辅助·冠军',
        fit: 'aspectFit'
      }
    },
    nextNodeId: 'ch5-final-start'
  },
  'ch4-ag-ending-team': {
    id: 'ch4-ag-ending-team',
    type: 'transition',
    chapter: 'ch4',
    location: {
      name: 'AG电竞中心',
      address: '成都市武侯区武科西五路235号西部智谷C区',
      lat: 30.6300,
      lng: 104.0100,
      radius: 300
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '说得好！我们一起赢，一起上场一起赢。胜利属于整个团队，包括替补、教练、粉丝——大家都是最佳第六人！少侠，接下来我们去九眼桥，在灯火璀璨中结束今日的旅程！',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/05-第四章/039-ch4-ag-ending-team-excited.wav',
      media: {
        type: 'player',
        url: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/ag超玩会选手.jpg',
        caption: 'AG超玩会 · 团队',
        tag: '成都·AG超玩会'
      }
    },
    nextNodeId: 'ch5-final-start'
  },

  // ===== 终章：江湖夜话（九眼桥） =====
  'ch5-final-start': {
    id: 'ch5-final-start',
    type: 'transition',
    chapter: 'ch5',
    location: {
      name: '九眼桥',
      address: '成都市锦江区九眼桥',
      lat: 30.6380,
      lng: 104.0900,
      radius: 200
    },
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '少侠，我们到了九眼桥！这里是成都夜生活的代表，灯火璀璨，如梦似幻。让我们在此为今日的旅程画上圆满的句号。',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/06-终章/040-ch5-final-start-happy.wav'
    },
    nextNodeId: 'ch5-final-dialog1'
  },
  'ch5-final-dialog1': {
    id: 'ch5-final-dialog1',
    type: 'dialog',
    chapter: 'ch5',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '安顺廊桥灯火璀璨，倒映在府南河中，如梦似幻。两岸酒馆林立，或有琴声，或有歌声，皆是江湖夜话。',
      emotion: 'thoughtful',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/06-终章/041-ch5-final-dialog1-thoughtful.wav'
    },
    nextNodeId: 'ch5-final-dialog2'
  },
  'ch5-final-dialog2': {
    id: 'ch5-final-dialog2',
    type: 'dialog',
    chapter: 'ch5',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '今日与君同游春熙路、太古里、武侯祠、草堂、AG电竞中心，诗酒、文旅、电竞、羁绊，尽在其中。',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/06-终章/042-ch5-final-dialog2-happy.wav'
    },
    nextNodeId: 'ch5-final-dialog3'
  },
  'ch5-final-dialog3': {
    id: 'ch5-final-dialog3',
    type: 'dialog',
    chapter: 'ch5',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '想听故事，便去那民谣小馆坐坐。李某要吟诵最后一句：长风破浪会有时，直挂云帆济沧海！',
      emotion: 'excited',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/06-终章/043-ch5-final-dialog3-excited.wav'
    },
    nextNodeId: 'ch5-ending'
  },

  // ===== 结局 =====
  'ch5-ending': {
    id: 'ch5-ending',
    type: 'ending',
    chapter: 'ch5',
    dialog: {
      speaker: '李白',
      speakerAvatar: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/卡通英雄头像/李白.png',
      speakerIllustration: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白半身像-removebg-preview.png',
      content: '你已完成《李白·成都寻梦记》全部旅程。诗酒趁年华，电竞永不弃，愿你如KPL选手一般，无论顺境逆境，永远保持热爱与信念！',
      emotion: 'happy',
      ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai-story/06-终章/044-ch5-ending-happy.wav'
    },
    ending: {
      type: 'perfect',
      title: '诗仙认可',
      content: '你已完成《李白·成都寻梦记》全部旅程。诗酒趁年华，电竞永不弃，愿你如KPL选手一般，无论顺境逆境，永远保持热爱与信念！',
      rewards: {
        bondPoints: 50,
        fragments: ['羁绊碎片·诗仙认可', '羁绊碎片·成都记忆'],
        badge: 'badge-libai-chengdu'
      }
    }
  }
}

// 章节定义
const chapters: StoryChapter[] = [
  {
    id: 'prologue',
    title: '序章',
    subtitle: '初入锦官城',
    locationName: '春熙路IFS',
    nodes: ['prologue-start', 'prologue-chunxi-choice', 'prologue-chunxi-transition', 'prologue-chunxi-scene', 'prologue-chunxi-fashion'],
    required: true
  },
  {
    id: 'ch1',
    title: '第一章',
    subtitle: '诗酒趁年华',
    locationName: '大慈寺·鹤鸣茶社',
    nodes: ['ch1-temple-start', 'ch1-temple-dialog1', 'ch1-temple-dialog2', 'ch1-park-transition', 'ch1-park-dialog1', 'ch1-park-dialog2', 'ch1-park-story', 'ch1-end'],
    required: true
  },
  {
    id: 'ch2',
    title: '第二章',
    subtitle: '君臣合祀',
    locationName: '武侯祠·锦里',
    nodes: ['ch2-wuhou-start', 'ch2-wuhou-dialog1', 'ch2-wuhou-dialog2', 'ch2-wuhou-choice', 'ch2-jinli-food'],
    required: true
  },
  {
    id: 'ch3',
    title: '第三章',
    subtitle: '诗圣幽居',
    locationName: '杜甫草堂·文殊院',
    nodes: ['ch3-caotang-start', 'ch3-caotang-dialog1', 'ch3-caotang-dialog2', 'ch3-wenshu-start', 'ch3-wenshu-dialog1', 'ch3-wenshu-dialog2'],
    required: false
  },
  {
    id: 'ch4',
    title: '第四章',
    subtitle: '电竞之魂',
    locationName: 'AG电竞中心·凤凰山',
    nodes: ['ch4-ag-start', 'ch4-ag-dialog1', 'ch4-ag-dialog2', 'ch4-phoenix-start', 'ch4-phoenix-memory', 'ch4-phoenix-story', 'ch4-ag-dialog3', 'ch4-ag-dialog4', 'ch4-ag-dialog5', 'ch4-ag-choice', 'ch4-ag-ending-talent', 'ch4-ag-ending-effort', 'ch4-ag-ending-team'],
    required: true
  },
  {
    id: 'ch5',
    title: '终章',
    subtitle: '江湖夜话',
    locationName: '九眼桥',
    nodes: ['ch5-final-start', 'ch5-final-dialog1', 'ch5-final-dialog2', 'ch5-final-dialog3', 'ch5-ending'],
    required: true
  }
]

// 故事线定义
export const libaiChengduStory: StoryLine = {
  id: 'libai-chengdu',
  heroId: 'libai',
  heroName: '李白',
  title: '李白·成都寻梦记',
  subtitle: '诗酒趁年华，电竞永不弃',
  description: '跟随诗仙李白，探索成都的诗酒文化、电竞精神、选手羁绊。从春熙路的繁华到AG电竞中心的热血，体验一场跨越千年的寻梦之旅。',
  coverImage: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.7869-xiagu-miniprogram-d7dbpz54358b2f-1410097615/图片素材/李白成都故事封面.png',
  chapters,
  nodes: storyNodes,
  totalDuration: '3-4小时',
  difficulty: 'normal'
}

// 导出所有节点便于查询
export { storyNodes }

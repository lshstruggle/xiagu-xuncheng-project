// 更新POI数据脚本 - 添加hero_narrations和rewards

const updates = [
  {
    name: "宽窄巷子",
    hero_narrations: {
      libai: "此处巷陌纵横，颇似峡谷草丛，宜伏击，亦宜品茗！",
      zhugeliang: "主公，此巷格局暗藏玄机，宽可容马，窄仅通人，乃兵法中一夫当关之地。"
    },
    rewards: { bond_value: 15 }
  },
  {
    name: "成都院子酒店",
    hero_narrations: {
      libai: "院中有院，楼中有楼，这格局倒像是红蓝双方的基地。",
      zhugeliang: "此乃川西民居之典范，四合院落，雕梁画栋，颇有古韵。"
    },
    rewards: { bond_value: 20 }
  },
  {
    name: "贺记蛋烘糕",
    hero_narrations: {
      libai: "外酥内软，香甜可口，比红buff回血还快！",
      luban: "大哥哥/大姐姐！这个糕点闻起来好香啊！鲁班想吃！"
    },
    rewards: { bond_value: 10 }
  },
  {
    name: "洞子口张老二凉粉",
    hero_narrations: {
      libai: "百年老店，手艺传承，这味道怕是比峡谷里的野怪还让人惦记！",
      zhugeliang: "五味调和，此乃民生之本。甜水面之甜，乃人生百味之首。"
    },
    rewards: { bond_value: 10 }
  },
  {
    name: "文殊院",
    hero_narrations: {
      libai: "红墙之内，禅意悠然。千年银杏下品一碗香茗，比拿蓝buff还提神！",
      zhugeliang: "主公，禅茶一味，静心修身之地。此处可暂离峡谷纷争，得片刻安宁。"
    },
    rewards: { bond_value: 20 }
  },
  {
    name: "明婷饭店",
    hero_narrations: {
      libai: "苍蝇馆子藏美味，市井烟火最动人！来，干了这碗人间烟火气！",
      zhugeliang: "大隐隐于市，真正的美食往往藏于市井之间。"
    },
    rewards: { bond_value: 10 }
  },
  {
    name: "陈麻婆豆腐",
    hero_narrations: {
      libai: "麻辣鲜香，入口即化！这麻婆豆腐比我的青莲剑歌还要辣！",
      diaochan: "这豆腐嫩滑如肌肤，麻辣似热情，真乃人间美味~"
    },
    rewards: { bond_value: 10 }
  },
  {
    name: "乐山钵钵鸡",
    hero_narrations: {
      libai: "串串香，红油亮，一口下去满嘴香！这才是成都的味道！",
      luban: "哇！好多肉肉串在一起！鲁班要全部吃掉！"
    },
    rewards: { bond_value: 10 }
  },
  {
    name: "锦里古街",
    hero_narrations: {
      libai: "推塔！成都的高地，已被你我征服！此情此景，当浮一大白！",
      guanyu: "此地颇有古战场之风，红灯笼如战旗飘扬。"
    },
    rewards: { bond_value: 15 }
  },
  {
    name: "武侯祠",
    hero_narrations: {
      libai: "遥想诸葛丞相，运筹帷幄，何异于峡谷军师？此处柏森森，清幽宜人。",
      zhugeliang: "（整理衣冠）主公，亮之祠堂，实在惭愧。鞠躬尽瘁，死而后已。"
    },
    rewards: { bond_value: 20, items: [{ type: "knowledge_card", id: "kc_wuhouci", name: "武侯祠历史卡" }] }
  },
  {
    name: "杜甫草堂",
    hero_narrations: {
      libai: "杜子美虽非我知己，但其诗文厚重，令人敬佩。这草堂虽简，却是诗意栖居之所。",
      zhugeliang: "诗圣流寓之地，虽茅屋简陋，却孕育千古诗篇。"
    },
    rewards: { bond_value: 20 }
  },
  {
    name: "沈堂甜水面",
    hero_narrations: {
      libai: "面条粗韧有嚼劲，甜辣交织，别有一番风味！",
      diaochan: "这面条如丝般缠绕，甜中带辣，恰似爱情的滋味~"
    },
    rewards: { bond_value: 10 }
  },
  {
    name: "AG电竞中心",
    hero_narrations: {
      libai: "心怀荣耀，勇往直前！AG的精神，值得敬佩。",
      hanxin: "电竞战场，亦是英雄试炼之地。"
    },
    rewards: { bond_value: 25 }
  },
  {
    name: "金沙遗址",
    hero_narrations: {
      libai: "太阳神鸟金饰，古蜀文明的瑰宝！千年之前的匠人，亦有如此精湛技艺！",
      zhugeliang: "古蜀文明，神秘莫测。这太阳神鸟，莫非是上古神器？"
    },
    rewards: { bond_value: 20, items: [{ type: "knowledge_card", id: "kc_jinsha", name: "金沙遗址历史卡" }] }
  },
  {
    name: "春熙路/太古里",
    hero_narrations: {
      libai: "哈哈哈，又下一塔！这人间烟火，比峡谷还热闹！",
      hanxin: "繁华之地，人来人往，正是观察众生百态的好去处。"
    },
    rewards: { bond_value: 30 }
  },
  {
    name: "吼堂老火锅",
    hero_narrations: {
      libai: "牛油锅底翻滚，毛肚鸭肠起舞！这才是成都的灵魂！",
      diaochan: "热气腾腾，香气扑鼻，这火锅比我的舞姿还要热烈~"
    },
    rewards: { bond_value: 10 }
  },
  {
    name: "西月城潭豆花",
    hero_narrations: {
      libai: "冰醉豆花，醪糟香甜，解辣神器也！",
      luban: "甜甜的，凉凉的，鲁班喜欢！"
    },
    rewards: { bond_value: 10 }
  },
  {
    name: "量子光电竞中心",
    hero_narrations: {
      libai: "前方那座建筑，见证了无数峡谷英雄的荣耀时刻。金雨落下时，整座城都在为他们欢呼。",
      hanxin: "KPL西部主场，承载了多少少年的电竞梦想。"
    },
    rewards: { bond_value: 25 }
  },
  {
    name: "小妹蹄花",
    hero_narrations: {
      libai: "蹄花炖得软烂脱骨，深夜慰藉的佳品！",
      diaochan: "胶原蛋白满满，美容养颜，姐妹们快来尝尝~"
    },
    rewards: { bond_value: 10 }
  }
];

let updated = 0;
updates.forEach(u => {
  const result = db.pois.updateOne(
    { name: u.name, city_code: "CD" },
    { $set: { hero_narrations: u.hero_narrations, rewards: u.rewards } }
  );
  if (result.modifiedCount > 0) updated++;
});

print("✅ 已更新 " + updated + " 个POI的英雄语音和奖励数据");

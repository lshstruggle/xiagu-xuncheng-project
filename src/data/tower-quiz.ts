export interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; explanation: string; }
export const TOWER_QUIZ_BANK = [
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "成都有一处著名的历史文化街区，由三条平行的清朝古街道及其之间的四合院群落组成，它是？",
    "options": ["锦里古街", "宽窄巷子", "春熙路", "建设路"],
    "correctIndex": 1,
    "explanation": "宽窄巷子由宽巷子、窄巷子、井巷子平行排列组成，是成都市三大历史文化保护区之一，也是老成都“慢生活”的代表。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "在成都，哪一座历史遗迹是纪念三国时期蜀汉丞相诸葛亮的胜地，且被称为“三国圣地”？",
    "options": ["杜甫草堂", "青羊宫", "武侯祠", "金沙遗址"],
    "correctIndex": 2,
    "explanation": "武侯祠是纪念诸葛亮、刘备等蜀汉英雄的重要场所，也是全国唯一的一座君臣合祀祠庙。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "来成都必看大熊猫！成都有一处距离市区最近的大熊猫繁育保护基地，它的全称是？",
    "options": ["成都大熊猫繁育研究基地", "卧龙中华大熊猫苑", "碧峰峡熊猫基地", "都江堰熊猫乐园"],
    "correctIndex": 0,
    "explanation": "成都大熊猫繁育研究基地位于成都市成华区，是距离市区最近的熊猫基地，花花（和花）就生活在这里。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "成都美食享誉全国，以下哪一道是经典的川菜，以“麻、辣、烫、香、酥、嫩、鲜、活”八字箴言著称？",
    "options": ["西湖醋鱼", "麻婆豆腐", "白切鸡", "烤冷面"],
    "correctIndex": 1,
    "explanation": "麻婆豆腐是四川省传统名菜之一，由清朝同治年间成都万福桥“陈兴盛饭铺”老板娘陈刘氏所创。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "唐代大诗人杜甫曾流寓成都，并在浣花溪畔建了一座茅屋，留下了《春夜喜雨》等名篇。这处文化地标是？",
    "options": ["望江楼", "杜甫草堂", "薛涛井", "百花潭"],
    "correctIndex": 1,
    "explanation": "杜甫草堂是唐代大诗人杜甫流寓成都时的故居，他在那里居住了近四年，创作了上百首诗歌。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "在王者荣耀峡谷中，击败“蔚蓝石像”（蓝Buff）后，英雄会获得什么增益效果？",
    "options": ["增加物理攻击", "减少技能冷却时间并持续回蓝", "普攻附带减速效果", "增加最大生命值"],
    "correctIndex": 1,
    "explanation": "击杀蓝Buff可以获得20%的冷却缩减，并且每秒回复2%的最大法力值，是法师和耗蓝型打野的最爱。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "游戏里的防御塔有一个非常重要的保护机制：当它连续攻击同一个英雄时，会发生什么？",
    "options": ["伤害保持不变", "伤害逐渐降低", "伤害逐渐递增", "附带眩晕效果"],
    "correctIndex": 2,
    "explanation": "防御塔每次攻击同一个英雄时，伤害会逐渐递增。所以抗塔越野时一定要注意自身的血量和抗塔时间。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "《峡谷寻城记》中的AI向导李白，在《王者荣耀》游戏中的职业定位是？",
    "options": ["法师", "射手", "辅助", "刺客"],
    "correctIndex": 3,
    "explanation": "李白在游戏中的定位是刺客，以高机动性、无法选中和爆发伤害著称，“十步杀一人，千里不留行”。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "游戏对局进行到10分钟时，峡谷主宰会进化为“暗影主宰”。击败暗影主宰后，己方兵线会变成什么？",
    "options": ["超级兵", "主宰先锋", "风暴龙王", "炮车兵"],
    "correctIndex": 1,
    "explanation": "击败暗影主宰后，己方接下来的三波兵线会被替换为“主宰先锋”，能极大地推进敌方防御塔。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "当英雄血量见底时，回到己方基地的“泉水”里会发生什么？",
    "options": ["立刻满血", "获得无敌护盾", "快速回复生命值和法力值", "增加移动速度"],
    "correctIndex": 2,
    "explanation": "泉水是玩家复活和回复状态的地方，站在泉水范围内可以非常快速地回复生命值和法力值。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "KPL是《王者荣耀》最高规格的专业竞技赛事，它的中文全称是？",
    "options": ["王者荣耀世界冠军杯", "王者荣耀职业联赛", "王者荣耀挑战者杯", "王者荣耀全国大赛"],
    "correctIndex": 1,
    "explanation": "KPL全称为 King Pro League（王者荣耀职业联赛），是王者荣耀最高规格的官方专业竞技赛事。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "KPL职业联赛的总冠军奖杯，因其独特的造型和颜色，被粉丝们亲切地称呼为什么？",
    "options": ["凤凰杯", "召唤师杯", "银龙杯", "金星杯"],
    "correctIndex": 2,
    "explanation": "KPL总冠军奖杯被称为“银龙杯”，捧起银龙杯是所有KPL职业选手的终极梦想。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "在KPL的赛制中，如果双方在BO7（七局四胜制）的比赛中打成3:3平手，将进入第七局。第七局采用的是什么特殊模式？",
    "options": ["克隆大作战", "巅峰对决（盲选模式）", "深渊大乱斗", "征召模式（互换英雄）"],
    "correctIndex": 1,
    "explanation": "BO7的第七局称为“巅峰对决”，双方阵容盲选，不受英雄池限制，可以看到相同的英雄在赛场上对决。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "2016年，第一届KPL秋季赛总决赛上，以“黑马”姿态夺得KPL历史上首个全国总冠军的战队是？",
    "options": ["QGhappy", "AS仙阁", "eStar", "AG超玩会"],
    "correctIndex": 1,
    "explanation": "2016年第一届KPL，AS仙阁战队在不被看好的情况下，一路逆风翻盘，拿下了首个KPL总冠军。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "在KPL赛场上，如果一支战队在前期经济大幅落后、防御塔被推掉很多的情况下，最终防守反击赢下比赛，这种情况通常被称为？",
    "options": ["顺风平推", "逆风翻盘", "偷家取胜", "运营拉扯"],
    "correctIndex": 1,
    "explanation": "“逆风翻盘”是电竞比赛中最激动人心的时刻，体现了选手们永不言弃、坚持到底的电竞精神。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "成都有一支极具人气的本土KPL战队，队内拥有“一诺”、“长生”、“钟意”等知名选手，这支战队是？",
    "options": ["武汉eStarPro", "重庆狼队", "成都AG超玩会", "北京WB"],
    "correctIndex": 2,
    "explanation": "成都AG超玩会是KPL的超人气老牌战队，也是成都本土的电竞骄傲，队史充满传奇色彩。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "成都AG超玩会的明星选手“一诺”，曾经在比赛中使用哪位射手英雄“把敌方英雄推向队友”拿下了四杀名场面？",
    "options": ["马可波罗", "百里守约", "孙尚香", "公孙离"],
    "correctIndex": 3,
    "explanation": "一诺在比赛中使用公孙离，利用大招将敌方铠推到己方队友面前并击杀，展现了极其果敢的操作，成为流传极广的名场面。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "被誉为“对抗路尽头”的选手Fly（彭云飞），最擅长并拥有专属FMVP皮肤（冠军飞将）的英雄是？",
    "options": ["关羽", "花木兰", "马超", "老夫子"],
    "correctIndex": 1,
    "explanation": "Fly的花木兰在赛场上留下了无数高光时刻，他的首款FMVP皮肤正是花木兰的“冠军飞将”。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "在成都AG超玩会的现役阵容中，“钟意”通常担任的位置是？",
    "options": ["中路", "对抗路", "打野", "游走"],
    "correctIndex": 2,
    "explanation": "钟意是成都AG超玩会的核心打野选手，在赛场上展现了强大的野区控制力和节奏带动能力。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "KPL赛场上有一位以“打野”位置闻名，被称为“海神”，并带领武汉eStarPro拿下多个冠军的选手是？",
    "options": ["无畏", "花海", "暖阳", "鹏鹏"],
    "correctIndex": 1,
    "explanation": "花海（罗思源）是武汉eStarPro的队长兼核心打野，以极其稳健和凶悍的打法带领队伍建立了属于他们的王朝。"
  }
,
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "成都有一座著名的道教名山，以其林木青翠、四季常青而享有“天下幽”的美誉，它是？",
    "options": ["峨眉山", "青城山", "乐山", "鹤鸣山"],
    "correctIndex": 1,
    "explanation": "青城山是道教发源地之一，素有“青城天下幽”的美誉，与剑门之险、峨眉之秀、夔门之雄齐名。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "战国时期，蜀郡太守李冰父子主持修建了一项伟大的水利工程，使成都平原成为“天府之国”，这项工程是？",
    "options": ["灵渠", "郑国渠", "都江堰", "京杭大运河"],
    "correctIndex": 2,
    "explanation": "都江堰是全世界迄今为止，年代最久、唯一留存、以无坝引水为特征的宏大水利工程。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "成都金沙遗址出土了一件国宝级文物，它的图案不仅是中国文化遗产的标志，还成为了成都的城市形象标识。这件文物是？",
    "options": ["青铜神树", "太阳神鸟金饰", "大金面具", "青铜立人像"],
    "correctIndex": 1,
    "explanation": "“太阳神鸟”金饰再现了远古人类“金乌负日”的神话传说，是古蜀先民智慧和艺术的结晶。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "在成都的戏园子里，你能欣赏到一种神奇的传统表演艺术：演员在瞬息之间变换脸上的脸谱来表现人物情绪。这被称为？",
    "options": ["吐火", "皮影戏", "变脸", "木偶戏"],
    "correctIndex": 2,
    "explanation": "川剧变脸是川剧表演的特技之一，用于揭示剧中人物的内心及思想感情的变化。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "成都在古代有许多别称，其中因为五代时期后蜀皇帝孟昶下令在城墙上遍植某种植物，而得名的别称是？",
    "options": ["锦城", "锦官城", "蓉城", "天府"],
    "correctIndex": 2,
    "explanation": "孟昶偏爱芙蓉花，命人在成都城墙上遍植芙蓉，花开时节“四十里为之锦绣”，成都因此得名“蓉城”。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "在王者荣耀中，击杀“猩红石像”（红Buff）后，英雄的普通攻击会附带什么特殊效果？",
    "options": ["攻速提升", "减速敌人并造成真实伤害", "获得吸血效果", "增加物理防御"],
    "correctIndex": 1,
    "explanation": "红Buff可以为英雄的普攻附加减速效果和持续的真实伤害，非常适合射手和依赖普攻的打野英雄。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "如果敌方防御塔下没有任何己方的小兵，英雄强行攻击防御塔时，防御塔会触发什么保护机制？",
    "options": ["防御塔会回血", "防御塔的伤害翻倍", "防御塔会大幅减免受到的伤害", "防御塔会发射激光"],
    "correctIndex": 2,
    "explanation": "当没有敌方兵线进入防御塔范围时，防御塔会获得高额的免伤机制，此时强行推塔效率极低。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "在峡谷的地图设计中，玩家走进“草丛”会有什么战术作用？",
    "options": ["缓慢回复生命值", "增加移动速度", "获得隐身效果，敌方失去视野", "视野范围变大"],
    "correctIndex": 2,
    "explanation": "草丛可以隐藏英雄的视野，是埋伏敌人（蹲草）或躲避追击的核心战术区域。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "游戏开局时，“原初法阵”（传送阵）会在发育路还是对抗路生成？",
    "options": ["发育路", "对抗路", "中路", "野区"],
    "correctIndex": 1,
    "explanation": "原初法阵生成在对抗路，方便对抗路英雄在前期快速支援其他分路或争夺暴君。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "游戏结算时的“MVP”全称是 Most Valuable Player，它代表的意思是？",
    "options": ["输出最高玩家", "全场最佳玩家", "承受伤害最多玩家", "推塔最多玩家"],
    "correctIndex": 1,
    "explanation": "MVP代表全场最有价值/最佳玩家，是系统根据击杀、助攻、死亡、推塔、参团率等多项数据综合评定的。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "为了增加比赛的观赏性和战术深度，KPL在BO7赛制中引入了“全局BP”模式。它的核心规则是？",
    "options": ["每局必须禁用不同的英雄", "己方使用过的英雄在后续对局中不能再次使用", "只能选择本赛季新出的英雄", "双方教练不能参与BP"],
    "correctIndex": 1,
    "explanation": "全局BP规则要求队伍在同一场BO7比赛中（除第七局巅峰对决外），己方不能重复使用已经使用过的英雄，极大地考验了队伍的英雄池深度。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "在KPL的观众文化中，经常能听到粉丝高喊某支战队的口号：“心怀荣耀，勇往直前”。这是哪支战队的口号？",
    "options": ["成都AG超玩会", "重庆狼队", "北京WB", "广州TTG"],
    "correctIndex": 0,
    "explanation": "“心怀荣耀，勇往直前”是成都AG超玩会的战队口号，代表了他们经历降级、重组后依然不屈服的精神。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "在电竞比赛中，常说的“让三追四”指的是什么情况？",
    "options": ["放弃三座塔，拿下四个人头", "开局落后3000经济，最终赢了4000", "在BO7比赛中先输三局，随后连赢四局翻盘", "牺牲三个队友换取四杀"],
    "correctIndex": 2,
    "explanation": "“让三追四”是BO7赛制中最极致的逆风翻盘，队伍在0:3落后的绝境下，顶住压力连下四城，完成惊天逆转。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "KPL的赛场除了选手，还有一群被称为“第六人”的关键人物，他们负责BP环节的排兵布阵。这个角色是？",
    "options": ["解说员", "俱乐部经理", "主教练", "裁判"],
    "correctIndex": 2,
    "explanation": "主教练在赛前的BP（Ban/Pick）环节中起着至关重要的作用，他们的战术储备往往能决定比赛的走向。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "KPL历史上有过几次被称为“黑八奇迹”的表现，这通常指的是哪种情况？",
    "options": ["一场比赛打了八十分钟", "常规赛第八名的队伍在季后赛爆冷击败强敌", "选手拿到八次连杀", "战队获得八连冠"],
    "correctIndex": 1,
    "explanation": "“黑八奇迹”源自体育赛事的说法，在KPL中指常规赛排名垫底（如第八名）勉强进入季后赛的队伍，却在季后赛中淘汰排名靠前的强队。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "KPL早期有一位传奇选手“梦泪”，他曾在比赛中使用哪位英雄上演了震撼全网的“无兵线偷水晶”名场面？",
    "options": ["李白", "韩信", "橘右京", "赵云"],
    "correctIndex": 1,
    "explanation": "梦泪使用韩信在敌方没有兵线的情况下，利用高机动性和名刀司命的效果，单人拆掉了敌方水晶，甚至促使官方修改了防御塔机制。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "重庆狼队的选手Fly（彭云飞）是KPL的荣誉第一人，他职业生涯中总共获得了多少次FMVP（总决赛最有价值球员）？",
    "options": ["3次", "5次", "7次", "9次"],
    "correctIndex": 2,
    "explanation": "Fly以其极致的大赛稳定性和操作，斩获了7次FMVP殊荣，并且拥有多款个人专属FMVP皮肤。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "KPL职业联赛中，被粉丝们称为“刺痛”的选手，他在赛场上最著名的成名之战是使用哪位英雄完成了“一打四守高地”？",
    "options": ["马可波罗", "百里守约", "孙尚香", "狄仁杰"],
    "correctIndex": 2,
    "explanation": "Hurt（刺痛）在面对敌方四人推高地时，使用孙尚香在极其极限的血量下疯狂输出，完成了一打四的反杀守家名场面。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "成都AG超玩会的选手“长生”，在赛场上被粉丝们戏称为“中路保安”，他最擅长并以极高胜率闻名的法师英雄是？",
    "options": ["不知火舞", "王昭君", "貂蝉", "上官婉儿"],
    "correctIndex": 1,
    "explanation": "长生以其极高命中率的王昭君二技能（禁锢寒霜）闻名，被誉为“王昭君天花板”，常常在关键时刻控住敌人改变战局。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "电竞选手在赛场上需要保持极高的专注度和手速，很多选手在比赛前都有一个习惯动作来保持手部温度，这个动作通常是使用什么物品？",
    "options": ["冰袋", "暖宝宝", "护腕", "按摩仪"],
    "correctIndex": 1,
    "explanation": "为了保持手指的灵活性和手速，职业选手经常在比赛间隙使用暖宝宝（暖手袋）来搓手，这也是赛场上常见的一幕。"
  }
,
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "唐代诗人杜甫的名句“窗含西岭千秋雪，门泊东吴万里船”中，提到的“西岭”位于成都的哪个风景区？",
    "options": ["峨眉山", "西岭雪山", "天台山", "瓦屋山"],
    "correctIndex": 1,
    "explanation": "西岭雪山位于成都市大邑县，是世界自然遗产，也是离成都最近的雪山，因杜甫的绝句而得名。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "在成都广汉市，有一处距今已有5000至3000年历史的古蜀文化遗址，被誉为“20世纪人类最伟大的考古发现之一”，它是？",
    "options": ["良渚遗址", "殷墟遗址", "三星堆遗址", "河姆渡遗址"],
    "correctIndex": 2,
    "explanation": "三星堆遗址出土了大量造型奇特的青铜面具、青铜神树等国宝，展现了古蜀文明的神秘与辉煌。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "来到成都，有一种以动物头部为原料的特色风味小吃，虽然外表有些“生猛”，但吃起来麻辣鲜香，深受老饕喜爱。它是？",
    "options": ["麻辣兔头", "香辣蟹", "冷吃兔", "灯影牛肉"],
    "correctIndex": 0,
    "explanation": "“没有一只兔子能活着离开四川”，双流老妈兔头等麻辣兔头是成都极具代表性的市井名小吃。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "成都市内有一条穿城而过的著名河流，自古就是水路交通要道，历代文人墨客在两岸留下了无数诗篇，这条河是？",
    "options": ["岷江", "嘉陵江", "锦江", "沱江"],
    "correctIndex": 2,
    "explanation": "锦江（又名府南河）是成都的母亲河，“锦江春色来天地，玉垒浮云变古今”便是描写锦江的千古名句。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "在成都喝茶是一项重要的市井文化活动。传统的成都老茶馆里，最具标志性的泡茶茶具是？",
    "options": ["紫砂壶", "盖碗", "玻璃杯", "建盏"],
    "correctIndex": 1,
    "explanation": "盖碗茶是成都茶馆的标配，由茶碗、茶盖、茶船（托盘）三部分组成，蕴含着天地人合一的传统哲学。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "在王者荣耀中，游戏开局时系统播报的“First Blood”代表什么意思？",
    "options": ["第一滴血（全场首次击杀）", "兵线出击", "防御塔被摧毁", "暴君刷新"],
    "correctIndex": 0,
    "explanation": "First Blood意为“第一滴血”或“首杀”，拿到首杀的玩家可以获得额外的经济奖励，通常能提振团队士气。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "在常规的峡谷地图中，射手（发育路）英雄通常会和敌方的哪一类英雄对线？",
    "options": ["法师", "刺客", "射手", "坦克"],
    "correctIndex": 2,
    "explanation": "在目前版本的地图对称机制下，己方发育路会对上敌方发育路，所以通常是射手与射手同路对线发育。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "在王者荣耀标准的5V5对局中，一名英雄的等级最高可以达到多少级？",
    "options": ["10级", "15级", "18级", "20级"],
    "correctIndex": 1,
    "explanation": "在标准的王者峡谷对局中，英雄等级上限为15级，达到满级后将无法再通过经验获取升级属性。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "为了保证游戏的平衡与策略性，每位英雄在对局中最多可以同时装备几件大件装备？",
    "options": ["4件", "5件", "6件", "8件"],
    "correctIndex": 2,
    "explanation": "英雄拥有6个装备栏，合理搭配这6件装备（包括鞋子、攻击装、防御装或保命装）是取胜的关键策略。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "在游戏进行到10分钟前，击败野区中的“暴君”会为全队带来什么收益？",
    "options": ["增加移动速度", "全队获得金币和经验", "兵线变强", "防御塔护盾"],
    "correctIndex": 1,
    "explanation": "前期的暴君是拉开经济和等级差的重要中立资源，击杀后全队都能获得基础的经验和金币奖励。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "在KPL比赛的解说中，常常听到“BP环节”这个词。这里的“BP”指的是什么？",
    "options": ["Buy/Pay (购买装备)", "Ban/Pick (禁用/挑选英雄)", "Battle/Push (打团/推塔)", "Base/Protect (守卫高地)"],
    "correctIndex": 1,
    "explanation": "BP即Ban（禁用）和Pick（挑选），是比赛开始前双方教练和选手进行战术博弈、组建阵容的核心环节。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "在KPL的历史上，有一支队伍被称为“多冠王”，建立了属于自己的王朝时代，并斩获了KPL赛场上最多的总冠军数量。这支队伍是？",
    "options": ["重庆狼队 (原QGhappy)", "广州TTG", "佛山DRG", "济南RW侠"],
    "correctIndex": 0,
    "explanation": "重庆狼队（其前身为QGhappy）是王者荣耀职业赛事历史上夺冠次数最多的战队，底蕴极其深厚。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "KPL总决赛上表现最出色、对团队胜利贡献最大的选手，会被授予哪项至高个人荣誉？",
    "options": ["最佳新锐", "常规赛MVP", "总决赛FMVP", "金牌辅助"],
    "correctIndex": 2,
    "explanation": "FMVP全称 Finals Most Valuable Player（总决赛最有价值选手），是选手个人实力的最高证明，且往往能获得专属定制皮肤。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "KPL目前的季后赛采用的是哪种淘汰机制？",
    "options": ["单败淘汰制", "积分循环制", "双败淘汰制 (分胜者组与败者组)", "KOF擂台制"],
    "correctIndex": 2,
    "explanation": "KPL季后赛采用双败淘汰制，常规赛排名前列的进入胜者组（多一次复活机会），排名靠后的在败者组（输一场即淘汰）。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "当一名选手在极短时间内连续击杀敌方五名英雄，使得敌方遭遇“团灭”时，系统会激昂地播报哪个词？",
    "options": ["三连决胜", "四连超凡", "五连绝世 (Penta Kill)", "天下无双"],
    "correctIndex": 2,
    "explanation": "“五连绝世”（Penta Kill）是峡谷中最难达成、也最令人热血沸腾的成就，是选手高光时刻的极致展现。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "成都AG超玩会的选手一诺（徐必成），曾在早期比赛中使用哪位英雄，因为一个失误“推回敌方英雄团灭队友”而诞生了经典的“杀队友”名场面梗？",
    "options": ["项羽", "关羽", "苏烈", "达摩"],
    "correctIndex": 1,
    "explanation": "在早期对阵YTG的比赛中，一诺的关羽一记大招将敌方残血吕布推到了残血队友身边，导致吕布挥出方天画斩拿下四杀，从此留下了“一诺行为”的经典热梗。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "前武汉eStarPro的传奇选手、现转职为辅助位继续征战赛场的“老将”Cat（猫神），他曾经是KPL联盟中绝无仅有的哪位位置的代表人物？",
    "options": ["对抗路", "发育路", "中路法师", "打野"],
    "correctIndex": 2,
    "explanation": "Cat（陈正正）曾是KPL最顶级的法刺代表人物、多届FMVP得主，为了继续留在赛场，他后期毅然转型为游走（辅助）位并再次夺冠，是KPL的励志典范。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "重庆狼队的打野选手“小胖”，因其极具侵略性的打法和自信的操作，被粉丝们赐予了哪个霸气的称号？",
    "options": ["胖皇", "海皇", "野区霸主", "驯龙高手"],
    "correctIndex": 0,
    "explanation": "小胖因其体型和在野区的绝对统治力，被粉丝和解说亲切地称为“胖皇”，他的赵云、澜等英雄常有逆天改命的操作。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "在KPL的教练圈里，有一位前职业选手转型教练后，带领队伍拿下了“四冠”，但现在更以直播时的“毒奶（反向预测）”玄学闻名全网。他是谁？",
    "options": ["久哲", "SK", "Gemini (郭家毅)", "Kear"],
    "correctIndex": 2,
    "explanation": "Gemini曾是QGhappy的四冠教练，转型直播后，因其预测哪支队伍赢，该队伍往往会输的“毒奶”特质，成为了KPL圈内的娱乐风向标。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "王者荣耀赛场上有一对著名的“好兄弟”，他们分别是北京WB的暖阳和成都AG超玩会的一诺。两人在私下感情极好，甚至在早年的某次总决赛约定无论谁赢都要一起去吃什么？",
    "options": ["火锅", "烤肉", "小龙虾", "肯德基"],
    "correctIndex": 0,
    "explanation": "暖阳和一诺是KPL著名的“双子星”好友。在2020年春季赛总决赛上，两人作为对手相遇，赛前约定无论谁捧杯，赛后都要一起去吃顿火锅庆祝。"
  }
,
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "成都市的市花是什么花？在深秋时节，成都的街头巷尾常能看到它盛开的身影。",
    "options": ["牡丹花", "月季花", "桂花", "芙蓉花"],
    "correctIndex": 3,
    "explanation": "成都的市花是芙蓉花。五代后蜀皇帝孟昶偏爱芙蓉，命人在城墙上遍植芙蓉，成都因此得名“蓉城”。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "成都有一个以纪念唐代著名女诗人为主的公园，里面有一口著名的“薛涛井”，这个公园是？",
    "options": ["浣花溪公园", "望江楼公园", "人民公园", "百花潭公园"],
    "correctIndex": 1,
    "explanation": "望江楼公园是为了纪念唐代女诗人薛涛而建立的，园内不仅有薛涛井，还种植了大量薛涛生前最爱的竹子。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "在四川方言（成都话）中，当人们品尝到极其美味的食物，或者感到生活非常安逸舒适时，常会用哪个词来形容？",
    "options": ["撇脱", "安逸 / 巴适", "雄起", "扎起"],
    "correctIndex": 1,
    "explanation": "“巴适”或“安逸”是四川方言中最常用的词汇之一，意为很好、舒服、正宗，是成都“慢生活”的最好注脚。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "成都自古以蜀锦闻名，被称为“中国四大名锦”之一。三国蜀汉时期，诸葛亮在成都设立了专门管理织锦的官署，这也是成都别称什么的原因？",
    "options": ["锦城 / 锦官城", "丝城", "织都", "蜀都"],
    "correctIndex": 0,
    "explanation": "因古代设立了“锦官”来管理蜀锦的织造，成都因此被美称为“锦官城”。杜甫诗云：“晓看红湿处，花重锦官城。”"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "去成都吃传统川式老火锅，当地人通常会推荐点一种经典配菜，俗称要在锅里“七上八下”地烫，口感才会最脆爽。它是？",
    "options": ["土豆片", "毛肚", "金针菇", "宽粉"],
    "correctIndex": 1,
    "explanation": "毛肚是川渝火锅的“灵魂伴侣”，讲究“七上八下”的烫法，时间过长会变老影响口感。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "在成都，有一种深受大众喜爱的街头休闲方式。三五好友围坐一桌，喝着盖碗茶，手里搓着一种传统的牌类游戏，这种游戏是？",
    "options": ["扑克牌", "象棋", "四川麻将", "桥牌"],
    "correctIndex": 2,
    "explanation": "四川麻将（特别是“血战到底”玩法）是成都人市井生活中不可或缺的娱乐活动，体现了成都人豁达乐观的生活态度。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "位于成都市中心的“天府广场”中央，有一座巨大的金色标志性雕塑，它是由三星堆和金沙遗址出土的哪件文物放大而成的？",
    "options": ["青铜立人像", "太阳神鸟", "青铜神树", "黄金面具"],
    "correctIndex": 1,
    "explanation": "天府广场中心的雕塑是太阳神鸟金饰的放大版，它象征着古蜀先民对太阳的崇拜，也是中国文化遗产标志。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "有一首民谣歌曲《成都》红遍大江南北，歌词中唱到：“和我在成都的街头走一走，直到所有的灯都熄灭了也不停留……”这首歌的创作者及原唱是？",
    "options": ["李荣浩", "赵雷", "毛不易", "薛之谦"],
    "correctIndex": 1,
    "explanation": "赵雷创作的《成都》以深情的旋律唱出了对这座城市的眷恋，也让“玉林路”、“小酒馆”成为无数文艺青年的打卡地。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "medium",
    "question": "唐代女诗人薛涛在成都浣花溪畔居住时，利用当地的水质和木芙蓉皮，制作了一种十分精美的深红色小彩笺，专用于写诗，这种纸被称为？",
    "options": ["宣纸", "蜀笺", "薛涛笺", "澄心堂纸"],
    "correctIndex": 2,
    "explanation": "薛涛笺色彩绚丽且带有花香，不仅在当时深受文人墨客喜爱，也成为了中国造纸史上的一个创举。"
  },
  {
    "category": "chengdu_culture",
    "difficulty": "easy",
    "question": "除了大熊猫，四川还有一种被称为“国宝中的国宝”的特有珍稀动物，它的长相奇特，被称为“四不像”，这种动物是？",
    "options": ["金丝猴", "麋鹿", "小熊猫", "扭角羚"],
    "correctIndex": 1,
    "explanation": "麋鹿被称为“四不像”。（注：若特指四川山区的四不像，常指扭角羚/羚牛，但普遍大众认知中的“四不像”是麋鹿。这里作为趣味科普，选项涵盖了珍稀动物体系）。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "在王者荣耀中，“打野”位置的英雄通常必须携带哪个专属召唤师技能，才能购买打野刀并快速击败野怪？",
    "options": ["闪现", "斩杀", "惩击", "狂暴"],
    "correctIndex": 2,
    "explanation": "惩击是打野英雄的核心召唤师技能，不仅能对野怪造成真实伤害，升级打野刀后还能用于减速敌方英雄。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "王者荣耀中，“大乔”的二技能（宿命之海）具有一项极具战略意义的独特机制，它是？",
    "options": ["对大范围敌人造成沉默", "将法阵内的队友传送回己方泉水并立刻回满血", "召唤海浪击退敌人", "为全队提供巨额护盾"],
    "correctIndex": 1,
    "explanation": "大乔的二技能是极其强大的电梯流核心机制，能让残血队友瞬间回城补满状态，配合大招可实现快速重返战场。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "在激烈的峡谷对局中，如果英雄的血条上方出现了一段白色的条块，这通常意味着什么？",
    "options": ["英雄处于无敌状态", "英雄处于眩晕状态", "英雄获得了一层可以抵挡伤害的护盾", "英雄即将施放终极技能"],
    "correctIndex": 2,
    "explanation": "白色的血条代表护盾（如张飞的大招、魔女斗篷的被动），在受到伤害时会优先消耗护盾值而不是真实血量。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "“魔女斗篷”是一件常用来克制高爆发法师的防御装备，它的核心被动效果是脱离战斗后，会为英雄提供什么？",
    "options": ["增加移动速度", "恢复大量生命值", "提供一个吸收法术伤害的护盾", "免疫下一次控制技能"],
    "correctIndex": 2,
    "explanation": "魔女斗篷的被动“迷雾”会在脱战后生成一个专属的法术护盾，是抵抗敌方消耗型或爆发型法师的利器。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "峡谷中的兵线通常由近战兵、远程兵组成。在游戏进行到一定时间后，哪种小兵会加入兵线，且对防御塔的伤害极高？",
    "options": ["超级兵", "炮车兵", "主宰先锋", "强化兵"],
    "correctIndex": 1,
    "explanation": "炮车兵在游戏前期结束后会加入兵线，它们血量厚且对防御塔有额外伤害，是推进防御塔的重要主力。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "英雄“百里守约”在使用被动技能时，靠近地形边缘（如墙壁）移动会触发什么特殊效果？",
    "options": ["获得物理穿透", "获得伪装（半隐身）效果并增加移动速度", "普攻射程变远", "免疫所有物理伤害"],
    "correctIndex": 1,
    "explanation": "百里守约在靠近墙壁移动时会进入伪装状态，不仅难以被敌人察觉，还能提升移动速度，非常适合用来潜伏或逃生。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "英雄“瑶”是深受许多玩家喜爱的辅助英雄，她的大招“独立兮山之上”的核心机制是？",
    "options": ["对范围内的敌人造成真实伤害", "为所有队友回复血量", "附身在一名队友身上，为其提供真实护盾", "解除范围内队友的控制效果"],
    "correctIndex": 2,
    "explanation": "瑶的大招可以附身在队友（通常是打野或射手）身上，提供抵挡真实伤害的护盾，是双排配合的热门选择。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "在王者峡谷的野区中，有一种野怪通常分布在靠近边路河道的位置，击败它可以获得金币和经验，这种野怪叫什么？",
    "options": ["赤甲", "蔚蓝石像", "猩红石像", "风暴龙王"],
    "correctIndex": 0,
    "explanation": "赤甲是分布在对抗路靠近河道边缘的野怪，是对抗路英雄除了兵线和河道之灵外，争夺经济的重要资源。"
  },
  {
    "category": "hok_game",
    "difficulty": "easy",
    "question": "射手或法师英雄在比赛大后期为了提高团战容错率，经常会购买一件俗称为“复活甲”的装备，它的正式名称是？",
    "options": ["名刀·司命", "辉月", "贤者的庇护", "血魔之怒"],
    "correctIndex": 2,
    "explanation": "贤者的庇护可以在英雄死亡后2秒于原地复活，并恢复一定比例的生命值，每局游戏最多只能触发两次。"
  },
  {
    "category": "hok_game",
    "difficulty": "medium",
    "question": "游戏中有一种特殊的控制效果叫“压制”，被压制期间英雄无法进行任何操作，且无法被常规的净化技能解除。以下哪位英雄的大招具有压制效果？",
    "options": ["王昭君", "东皇太一", "甄姬", "钟馗"],
    "correctIndex": 1,
    "explanation": "东皇太一（以及张良）的大招拥有最高优先级的“压制”控制，常被用来针对敌方极其灵活的刺客或核心输出位。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "在KPL的解说席上，当你听到解说大喊“高地塔掉了！”，指的是守护在哪里前方的最后一道防御塔被推毁了？",
    "options": ["河道", "主宰坑", "野区", "水晶（己方基地）"],
    "correctIndex": 3,
    "explanation": "高地塔是防守水晶的最后屏障。高地塔被破后，敌方将派出更加强力的超级兵，给己方水晶防守带来巨大压力。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "战队教练在BP（选英雄）环节，有时会选出一个既可以打中路，又可以打对抗路或辅助的英雄。这种战术选择在专业术语中被称为？",
    "options": ["核心位", "摇摆位", "孤儿位", "绝活位"],
    "correctIndex": 1,
    "explanation": "“摇摆位”英雄能在BP时极大地迷惑对手，让对手无法准确判断己方阵容的分路，从而在战术博弈上占据主动。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "职业比赛中，选手为了压制敌方打野的经济发育，会抱团去敌方野区抢夺蓝Buff或红Buff，这种行为通俗地称为什么？",
    "options": ["反野", "守家", "带线", "偷塔"],
    "correctIndex": 0,
    "explanation": "反野是前期建立优势的重要手段，通过掠夺敌方野区资源，拉开双方的经济和等级差距。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "在电竞赛事的赛制规定中，“BO5”代表的是一种常见的比赛场次规则，它的具体意思是？",
    "options": ["五人团队赛", "五局三胜制 (Best of 5)", "必须打满五个小时", "每局限时五十分钟"],
    "correctIndex": 1,
    "explanation": "BO5即 Best of 5，意为在最多五局的比赛中，先赢得三局的队伍获得最终胜利。常见于季后赛前几轮或杯赛。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "在观看KPL直播时，常看到弹幕刷“偷龙”。这通常指的是某支战队在做什么操作？",
    "options": ["窃取敌方的战术", "在敌方未察觉时，迅速击败暴君或主宰", "派人去敌方高地推塔", "躲在草丛里埋伏"],
    "correctIndex": 1,
    "explanation": "趁敌方视野盲区或人员不在野区时，偷偷拿下大型远古生物（龙），是比赛中打破僵局、建立优势的经典运营方式。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "KPL联盟在休赛期会有人员变动，此时俱乐部会将允许转会交易的选手名单进行全网公布，供其他俱乐部竞价。这一制度被称为？",
    "options": ["下放制", "挂牌制", "选秀制", "解约制"],
    "correctIndex": 1,
    "explanation": "“挂牌”是选手转会的必经流程，挂牌期间其他俱乐部可以进行试训和竞拍，这保证了联盟人才的流动和交易的公开性。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "当一场比赛极其焦灼，解说大喊“双方在拼惩击！”时，这两支队伍此时通常正在争夺什么？",
    "options": ["红蓝Buff", "河道之灵", "主宰或暴君等远古生物", "兵线经济"],
    "correctIndex": 2,
    "explanation": "在争夺关键远古生物（尤其是风暴龙王）时，由于血量见底，双方打野必须精准计算血量释放“惩击”技能来抢夺最后一击，这一瞬间决定了整个对局的胜负。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "在KPL的赛事体系中，每年夏天会举办一场融合了全球各个赛区强队的顶级国际性赛事，它的简称是？",
    "options": ["K甲", "世冠 (KIC)", "冬冠", "挑战者杯"],
    "correctIndex": 1,
    "explanation": "王者荣耀世界冠军杯（KIC）是官方最高规格的国际赛事，也是每年奖金池最丰厚的比赛，吸引了全球顶尖战队参与。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "easy",
    "question": "在KPL线下总决赛的场馆里，粉丝们为了给自己喜欢的战队和选手应援，手中经常举着发光且带有名字和口号的板子，这叫什么？",
    "options": ["应援灯牌", "大喇叭", "战旗", "荧光棒"],
    "correctIndex": 0,
    "explanation": "应援灯牌是电竞线下文化的重要组成部分，镜头扫过观众席时，五颜六色的灯牌海洋是赛场上最热烈的风景。"
  },
  {
    "category": "kpl_esports",
    "difficulty": "medium",
    "question": "KPL中有一种极具观赏性的阵容体系，叫“大乔体系”。这个战术体系最核心的运营打法是什么？",
    "options": ["全员出纯肉装抗伤害", "利用大乔的传送机制，进行极其灵活的带线牵扯与多打少抓人", "一直守在水晶不出去", "只打野怪不吃兵线"],
    "correctIndex": 1,
    "explanation": "大乔体系依靠其二技能和大招，能够让队伍在地图上实现“瞬间转线”和“极限回血”，是将兵线运营拉扯到极致的高端战术。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "曾经在KPL赛场上使用“赵云”、“李白”等英雄大杀四方，并以一句“我可是要成为海贼王的男人”作为经典语录的北京WB当家打野选手是？",
    "options": ["花海", "无畏", "暖阳", "鹏鹏"],
    "correctIndex": 2,
    "explanation": "暖阳（林恒）是北京WB的核心打野，曾在2020年世冠使用绝活“赵云”斩获FMVP，他非常喜欢动漫，这句台词是他的标志性语录。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "广州TTG战队的对抗路选手“清清”，因为其极强的对线压制力和边路带线能力，经常能在逆风局中单骑救主，他被KPL解说和粉丝们盛赞为？",
    "options": ["通天边路", "不死战神", "草丛杀手", "团队之盾"],
    "correctIndex": 0,
    "explanation": "“通天边路”是观众对清清个人实力的极高认可，他的马超、老夫子等英雄常常能在边路打出统治级的表现。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "在KPL选手中，有一位长相清秀、主打中路法师的选手，他叫“九尾”，他经常使用哪位身手敏捷、伤害爆炸的法刺英雄在团战中秒杀后排？",
    "options": ["甄姬", "安琪拉", "不知火舞", "扁鹊"],
    "correctIndex": 2,
    "explanation": "九尾的不知火舞是KPL最具代表性的绝活之一，常常能在团战中精准切入敌方后排，打出毁灭性的群控和爆发伤害。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "曾经效力于Hero久竞（现为DYG），在赛场上以“百里守约”四枪命中三个神仙预判震惊全网，并且拥有专属FMVP皮肤（久胜战神）的明星选手是？",
    "options": ["猫神 (Cat)", "久诚", "梦泪", "初晨"],
    "correctIndex": 1,
    "explanation": "久诚以其极致的技能命中率被誉为KPL的“神狙”和“输出机器”，他的干将莫邪和百里守约是赛场上的绝对压制力。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "南京Hero久竞的打野选手“无畏”，除了技术精湛，还因为高颜值被很多粉丝戏称为“KPL电竞男主”。他最擅长并在赛场上多次逆天改命的刺客英雄是？",
    "options": ["典韦", "兰陵王", "橘右京", "亚瑟"],
    "correctIndex": 1,
    "explanation": "无畏的兰陵王在早期KPL赛场上有着极高的胜率，其神出鬼没的节奏带动能力是Hero夺冠的重要拼图。（注：其澜、镜也极其出名，兰陵王为其成名绝活之一）。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "重庆狼队的中单选手“向鱼”，在赛场上任劳任怨，经常选用西施、周瑜等英雄为队伍提供控制、让出经济给核心，这种极具牺牲精神的中路打法被粉丝爱称为？",
    "options": ["法核打法", "吃草挤奶 (工具人中单)", "刺客流中单", "单带流中单"],
    "correctIndex": 1,
    "explanation": "“工具人中单”不吃大量经济，主要依靠技能提供控制和视野，像“吃草挤奶”一样为团队默默奉献，向鱼是这一打法的顶尖代表。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "成都AG超玩会的老将“梦泪”，除了韩信无兵线推塔，他当时另一位极其招牌、能够不可选中“刷大招”的刺客英雄是？",
    "options": ["孙悟空", "李白", "阿轲", "娜可露露"],
    "correctIndex": 1,
    "explanation": "梦泪早期的李白和韩信并称双绝，其李白经常在野区利用野怪刷出大招，然后位移进场消耗敌人，留下了无数潇洒的背影。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "在KPL赛场上，如果一个选手在一整局比赛中一次都没有死亡（0次被击杀），并在赛后结算面板上获得高度评价，观众们通常会送给他一个什么响亮的称号？",
    "options": ["峡谷提款机", "不死战神 / 零死牌面", "泉水指挥官", "团战发动机"],
    "correctIndex": 1,
    "explanation": "在对抗激烈的职业赛场上，能保持一局“零阵亡”极度考验选手的站位、意识和保命能力，因此会被称为“不死战神”。"
  },
  {
    "category": "pro_players",
    "difficulty": "easy",
    "question": "职业选手在比赛时的团队语音沟通至关重要。当选手们在语音里大喊“看我看我！”时，他通常想要表达什么意思？",
    "options": ["让队友看他的新皮肤", "他准备发起先手开团，让队友注意配合跟上伤害", "他马上就要阵亡了，让队友赶紧撤退", "他正在单挑小兵"],
    "correctIndex": 1,
    "explanation": "“看我看我”是职业比赛中最常见的集结进攻信号，通常由辅助或开团手发出，意在提醒全队将注意力和技能倾泻到他锁定的目标身上。"
  },
  {
    "category": "pro_players",
    "difficulty": "medium",
    "question": "KPL赛后采访环节，选手们除了聊比赛战术，也经常和粉丝互动。如果是异地战队来到成都打客场比赛，主持人最常问及选手关于成都的哪方面体验？",
    "options": ["今天背了几首诗", "成都有什么好吃的（比如火锅辣不辣）", "成都有几个飞机场", "成都市中心的面积有多大"],
    "correctIndex": 1,
    "explanation": "美食（特别是火锅）是成都最靓丽的城市名片之一。赛后采访中，外地选手对于成都麻辣饮食的适应程度，常常是缓和气氛的绝佳话题。"
  }
]

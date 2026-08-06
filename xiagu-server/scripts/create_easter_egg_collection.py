#!/usr/bin/env python3
"""
创建独立的彩蛋数据库表 - 统一管理所有彩蛋数据
"""

from pymongo import MongoClient, ASCENDING
from datetime import datetime

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "xiagu_xuncheng"

def main():
    print("=" * 60)
    print("🎮 创建彩蛋数据库表 (easter_eggs)")
    print("=" * 60)
    
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # 创建彩蛋集合
    easter_eggs = db["easter_eggs"]
    
    # 创建索引
    print("\n📊 创建索引...")
    easter_eggs.create_index([("id", ASCENDING)], unique=True)
    easter_eggs.create_index([("city_id", ASCENDING)])
    easter_eggs.create_index([("type", ASCENDING)])
    easter_eggs.create_index([("rarity", ASCENDING)])
    easter_eggs.create_index([("location", "2dsphere")])
    print("  ✅ 索引创建完成")
    
    # 定义所有彩蛋数据
    all_easter_eggs = [
        # ========== 原有4个彩蛋 ==========
        {
            "id": "bond_cd_01",
            "city_id": "chengdu",
            "name": "啊--将军",
            "type": "player_trace",
            "location": {"type": "Point", "coordinates": [104.0790, 30.6590]},
            "rarity": "normal",
            "rarity_label": "✦ 普通",
            "rarity_color": "#C0C0C0",
            "bond_data": {
                "team_name": "反差萌军团",
                "location_context": "宽窄巷子方向路口，选手户外直播团建地点",
                "story": "几位以冷静著称的选手来这一带做直播任务，其中一位被掏耳朵时惊叫出声，与赛场形象形成巨大反差，成为经典表情包。",
                "player_quote": "赛场上我是战神，巷子里我是普通人--一个怕掏耳朵的普通人。",
                "nearby_shop": "附近掏耳朵体验店"
            },
            "fragment_id": "frag_cd_01",
            "fragment_content": "一张表情包截图：某位选手闭着眼睛龇牙咧嘴的样子，配文'啊--'。",
            "bookmark_data": {
                "title": "啊--将军",
                "quote": "赛场战神，巷子凡人--\n一个怕掏耳朵的凡人。",
                "visual_desc": "Q版风格，竹躺椅上石化的少年剪影，头顶眩晕星星",
                "bg_color": "#FFF8E7",
                "accent_color": "#FF9800"
            },
            "ai_dialogs": {
                "li_bai": "宽窄巷子…（忍不住笑了）\n我跟你说件趣事。有一回，几个峡谷里的高手来这里做任务，其中一位，赛场上号称"泰山崩于前而面不改色"。结果被掏了个耳朵--他"啊--"了一嗓子，整条巷子都听见了。\n（大笑）英雄也有可爱的一面。客官要不要也去体验一下？",
                "zhugeliang": "（忍俊不禁）主公，亮也曾听闻一件趣事。有位勇士在峡谷中所向披靡，却在这小小的巷子里败给了一根掏耳勺。他那一声"啊--"，比他的五杀还要响亮。\n看来天下英雄，皆有软肋。",
                "luban": "大哥哥/大姐姐！这里有个超级好笑的事！有个选手哥哥超级厉害的，打比赛的时候酷酷的！结果来这里被掏耳朵--"啊--！"哈哈哈哈！鲁班笑了三天！"
            },
            "hint_text": "这段记忆藏在一声"啊--"里…",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "bond_cd_02",
            "city_id": "chengdu",
            "name": "茶馆军师",
            "type": "player_trace",
            "location": {"type": "Point", "coordinates": [104.0835, 30.6555]},
            "rarity": "rare",
            "rarity_label": "✦✦ 精良",
            "rarity_color": "#4FC3F7",
            "bond_data": {
                "team_name": "棋局之外",
                "location_context": "太古里东南侧，教练的非正式复盘地点",
                "story": "一位教练喜欢带选手来茶馆聊天，不看录像不谈战术，只谈心态。他说："比赛打的是心态，心态要在最慢的地方练。"",
                "player_quote": "峡谷里的团战只有几秒，决定胜负的是之前几个月的心态。",
                "nearby_shop": "附近盖碗茶馆"
            },
            "fragment_id": "frag_cd_02",
            "fragment_content": "一只用了很久的盖碗茶杯，杯底刻着一个小小的战队Logo。",
            "bookmark_data": {
                "title": "茶馆军师",
                "quote": "团战只有几秒，\n胜负在于之前\n几个月的心态。",
                "visual_desc": "方桌上四只盖碗茶，热气袅袅，折扇上有战术线条",
                "bg_color": "#F1F8E9",
                "accent_color": "#689F38"
            },
            "ai_dialogs": {
                "li_bai": "这附近…（放慢脚步）\n我记得有位军师，常在这种茶馆中运筹帷幄。不是排兵布阵，而是端着茶，和他的弟子们聊心境。他说："急不得。"后来他的弟子们捧杯的那天，终于懂了这两个字的分量。\n客官，来，饮一杯。",
                "zhugeliang": "（端起茶杯）好一个茶馆。主公可知，这方小小茶桌上，曾坐过一位峡谷中的军师。他常带弟子来此饮茶，不谈战术只谈心境。他说："团战只有几秒，决定胜负的是之前几个月的心态。"\n泡茶与打比赛一样，急不得。主公，来，饮一杯。",
                "luban": "大哥哥/大姐姐，这里好安静啊…鲁班听说有个教练爷爷特别喜欢带选手哥哥们来喝茶！不聊打游戏，就喝茶！鲁班觉得好奇怪…但后来那些哥哥们都拿了冠军！\n难道…茶里有秘密配方？！"
            },
            "hint_text": "这段记忆藏在一杯盖碗茶中…",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "bond_cd_03",
            "city_id": "chengdu",
            "name": "无名少年们的街",
            "type": "player_trace",
            "location": {"type": "Point", "coordinates": [104.0817, 30.6572]},
            "rarity": "epic",
            "rarity_label": "✦✦✦ 史诗",
            "rarity_color": "#AB47BC",
            "bond_data": {
                "team_name": "银龙军团",
                "location_context": "春熙路步行街中心，选手们最常出没的商圈",
                "story": "几年前一群追梦少年从全国各地来到成都，训练结束后在这条街上做普通人。后来他们成为冠军，这条街开始有人认出他们。",
                "player_quote": "我们不是天才，我们只是没有退路。",
                "nearby_shop": "巷子里的串串店"
            },
            "fragment_id": "frag_cd_03",
            "fragment_content": "一张泛黄的合照，五个少年站在春熙路的街灯下，笑得很用力。",
            "bookmark_data": {
                "title": "无名少年们的街",
                "quote": "我们不是天才，\n我们只是\n没有退路。",
                "visual_desc": "夜晚春熙路霓虹，五个少年背影走在人潮中，地面倒影有Logo轮廓",
                "bg_color": "#1A1A2E",
                "accent_color": "#AB47BC"
            },
            "ai_dialogs": {
                "li_bai": "这一带啊…（语气放缓）\n我听说过一个故事。几年前，有五个少年挤在这附近的一间小屋子里，每天训练十几个小时。没有粉丝，没有灯光，只有彼此。\n后来他们站上了最大的舞台。他们的队长说过一句话--"我们不是天才，我们只是没有退路。"\n……你尝尝那边巷子里的串串，据说他们以前常来。",
                "zhugeliang": "（驻足凝望）主公，这条街上的霓虹灯，曾照过许多匆匆过客。但有五个少年的身影，被这座城市永远记住了。\n他们从无名到加冕，只用了两年，但代价是两年中每一个不曾偷懒的日夜。\n"没有退路"--这四个字，重若千钧。",
                "luban": "大哥哥/大姐姐！这条街好热闹！鲁班听说，以前有五个哥哥每天在这里走来走去，没人认识他们。后来他们变得超级厉害，走在这里就有人喊他们名字了！\n鲁班觉得，从"没人认识"到"大家都认识"，一定超级超级努力吧！"
            },
            "hint_text": "这段记忆藏在霓虹灯最亮的街上…",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "bond_cd_04",
            "city_id": "chengdu",
            "name": "银色灯海",
            "type": "spirit_beacon",
            "location": {"type": "Point", "coordinates": [104.0800, 30.6548]},
            "rarity": "legendary",
            "rarity_label": "✦✦✦✦ 传说",
            "rarity_color": "#FFD700",
            "spirit_data": {
                "event_name": "KPL季后赛·成都站",
                "event_time": "赛季秋天",
                "venue": "成都赛事场馆",
                "story": "银色应援灯海从看台蔓延到场外，决胜局比分咬紧，年轻打野孤注一掷的切入赌赢了比赛。他站起来时手在发抖--不是害怕，是太想赢了。",
                "spirit_keyword": "孤注一掷",
                "quote": "我不是不怕输，我只是更怕自己不敢拼。",
                "easter_egg": {
                    "question": "最后一波团战，你选择稳守高地还是主动出击？",
                    "options": ["稳守高地", "主动出击"],
                    "follow_up_replies": {
                        "稳守高地": "稳重如山，亦是勇气。但那晚的少年选择了出击--有些机会只有一次。",
                        "主动出击": "好胆色！那晚的少年也这么选的。他说："我的队友值得我赌这一把。"信任才是最强装备。"
                    }
                }
            },
            "fragment_id": "frag_cd_04",
            "fragment_content": "一张赛事门票的票根，座位号已经模糊，但背面有人用笔写了一个字："赢。"",
            "badge_id": "badge_all_in",
            "badge_name": "孤注一掷",
            "bookmark_data": {
                "title": "银色灯海",
                "quote": "不是不怕输，\n只是更怕\n不敢拼。",
                "visual_desc": "俯瞰银色灯海如银河，舞台中央少年剪影双拳高举，金色彩带飘落",
                "bg_color": "#0D1B2A",
                "accent_color": "#FFD700"
            },
            "ai_dialogs": {
                "li_bai": "前方那个方向…（声音低沉下来）\n我记得那个夜晚。银色的灯海从看台蔓延到场外，像整座城市都在为峡谷中的战斗呐喊。决胜局，年轻的打野压上了一切--他赌赢了。\n他站起来的时候，手在发抖。不是害怕，是太想赢了。\n你今天走了这么远，也是因为有太想做到的事吧？",
                "zhugeliang": "（抬头远望）主公，那个方向的建筑，两年前曾承载过一场足以载入史册的对决。银色灯海如同银河倒挂，而舞台上的少年在最后时刻选择了孤注一掷。\n"不是不怕输，只是更怕不敢拼。"此言，堪比卧龙出山之决意。",
                "luban": "大哥哥/大姐姐！那边那边！以前有好多好多银色的灯！像星星一样！有个选手哥哥在最后一秒冲了上去，所有人都觉得他疯了--但他赢了！\n鲁班觉得，敢拼的人最酷了！"
            },
            "hint_text": "这段记忆藏在银色灯海的回声里…",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        
        # ========== AG超玩会彩蛋（3个） ==========
        {
            "id": "ag_egg_01",
            "city_id": "chengdu",
            "name": "心怀荣耀·AG精神图腾",
            "type": "team_spirit",
            "location": {"type": "Point", "coordinates": [104.0650, 30.6580]},
            "rarity": "epic",
            "rarity_label": "✦✦✦ 史诗",
            "rarity_color": "#E53935",
            "bond_data": {
                "team_name": "成都AG超玩会",
                "location_context": "AG精神地标，象征复兴之路",
                "story": "2019年AG跌入谷底被嘲笑为千年老二，2023年挑战者杯宣告回归。Cat历经五年从被喷上热搜到捧起冠军奖杯。一诺从激进射手成长为团队核心。",
                "player_quote": "心怀荣耀，勇往直前。",
                "nearby_shop": "AG电竞中心"
            },
            "fragment_id": "frag_ag_01",
            "fragment_content": "一枚红色的AG队徽徽章，背面刻着"2019-2024"字样。",
            "bookmark_data": {
                "title": "心怀荣耀",
                "quote": "心怀荣耀，\n勇往直前。",
                "visual_desc": "红色AG队徽在金色光芒中闪耀，背景是捧杯剪影",
                "bg_color": "#FFEBEE",
                "accent_color": "#E53935"
            },
            "ai_dialogs": {
                "li_bai": "心怀荣耀，勇往直前！\n这是成都AG超玩会的誓言，也是我今天送给你的第一句话。\n2019年，他们曾跌入谷底，被嘲笑为千年老二。可2023年的那个秋天，他们在挑战者杯决赛的舞台上，用实力告诉所有人：AG，回来了！\n从被喷上热搜第一，到捧起冠军奖杯，Cat用了整整五年。他说：就这一刻，我感觉一切都是值得的。\n少年，你的路或许也难，但请记住AG的故事，只要心怀荣耀，便永远有勇往直前的力量！",
                "zhugeliang": "主公，前方乃是AG超玩会之精神图腾。\n此战队曾跌落谷底，被世人嘲笑，然其未曾放弃。历经五载，终在挑战者杯上重登巅峰。\n"心怀荣耀，勇往直前"--非但是口号，更是其用血泪铸就之信念。",
                "luban": "大哥哥/大姐姐！AG超玩会超级厉害的！虽然他们曾经输过很多次，被人笑话，但是他们没有放弃！后来他们拿了好多冠军！\n鲁班觉得，只要不放弃，就一定能赢！"
            },
            "spirit_data": {
                "event_name": "AG复兴之路",
                "event_time": "2019-2024",
                "venue": "成都",
                "story": "从谷底到巅峰，AG用五年时间书写了电竞史上最动人的复兴故事。",
                "spirit_keyword": "复兴",
                "quote": "心怀荣耀，勇往直前。",
                "easter_egg": {
                    "question": "AG从谷底到巅峰用了五年，你为自己的梦想坚持过多久？",
                    "options": ["A. 我还在坚持，哪怕看不到终点", "B. 我曾经放弃过，现在想重新开始", "C. 我想听更多AG复兴的故事"],
                    "follow_up_replies": {
                        "A. 我还在坚持，哪怕看不到终点": "好！这才像我认识的少年郎！Cat说过：从被喷到热搜第一，到这一刻感觉一切都值得。五年，1825个日夜，他从未放弃。你的坚持，终会在某天绽放成花。",
                        "B. 我曾经放弃过，现在想重新开始": "重新开始，永远不晚。AG也曾跌落B组，Fly说：从B组开始打才有意思。每一次重新开始，都是命运给你的新机会。去吧，少年，这次别让自己后悔。",
                        "C. 我想听更多AG复兴的故事": "AG的复兴，是一部热血史诗！2023挑战者杯，他们击败老对手，宣告王者归来。2024年虽遇低谷，但长生与钟意并肩熬过。2025春决，意生意世组合捧起奖杯。这就是AG--心怀荣耀，永远勇往直前！"
                    }
                }
            },
            "trigger_conditions": {
                "type": "first_checkin",
                "description": "用户首次打卡任意POI时触发"
            },
            "hint_text": "这段记忆藏在AG复兴的荣耀里…",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "ag_egg_02",
            "city_id": "chengdu",
            "name": "一诺千金·少年成长记",
            "type": "player_spirit",
            "location": {"type": "Point", "coordinates": [104.0823, 30.6574]},
            "rarity": "rare",
            "rarity_label": "✦✦ 精良",
            "rarity_color": "#FB8C00",
            "bond_data": {
                "team_name": "成都AG超玩会",
                "location_context": "春熙路·少年成长之地",
                "story": "一诺（徐必成）从"激进射手"成长为"团队核心"，数千次训练赛的走位调整，见证了一个少年的蜕变。他说："你可以不成功，但不能不成长。"",
                "player_quote": "你可以不成功，但不能不成长，谁也不能阻止你成长。",
                "nearby_shop": "春熙路商圈"
            },
            "fragment_id": "frag_ag_02",
            "fragment_content": "一张训练室的照片，屏幕上显示着数千次走位训练的记录。",
            "bookmark_data": {
                "title": "一诺千金",
                "quote": "你可以不成功，\n但不能不成长。",
                "visual_desc": "少年持弓而立，从激进到沉稳的蜕变剪影",
                "bg_color": "#FFF3E0",
                "accent_color": "#FB8C00"
            },
            "ai_dialogs": {
                "li_bai": "成都最繁华的街头，走来一位意气风发的少年。\n这让我想起AG的一诺，徐必成，那个从激进射手成长为团队核心的少年。\n他说：你可以不成功，但不能不成长，谁也不能阻止你成长。\n从被质疑到被仰望，从个人秀到团队魂，他的每一次走位调整，都藏在数千次训练赛的汗水里。\n少年，成长从来不是一蹴而就，但只要不停下脚步，你终将成为自己想成为的人。",
                "zhugeliang": "主公，春熙路乃繁华之地，然曾有一少年于此漫步，心怀大志。\n此子初以激进闻名，后渐沉稳，终成团队之核心。其言曰："谁也不能阻止你成长。"\n此乃成长之真谛也。",
                "luban": "大哥哥/大姐姐！一诺哥哥以前打比赛好冲动的！后来变得很稳很稳！他说成长是自己的事情，别人阻止不了！\n鲁班也要像一诺哥哥一样，慢慢变强！"
            },
            "spirit_data": {
                "event_name": "一诺成长之路",
                "event_time": "2019-2024",
                "venue": "春熙路",
                "story": "从激进射手到团队核心，一诺用成长诠释了什么是真正的强者。",
                "spirit_keyword": "成长",
                "quote": "你可以不成功，但不能不成长。",
                "easter_egg": {
                    "question": "成长路上，你遇到过最大的质疑是什么？",
                    "options": ["A. 别人说我天赋不够，不适合这条路", "B. 我曾经失败太多次，怀疑自己", "C. 我想知道一诺是如何面对质疑的"],
                    "follow_up_replies": {
                        "A. 别人说我天赋不够，不适合这条路": "天赋？一诺说：谁也不能阻止你成长！AG的队长Cat，曾被嘲笑英雄池浅，可他转型辅助后再次夺冠。天赋只是起点，坚持才是终点。",
                        "B. 我曾经失败太多次，怀疑自己": "怀疑自己是每个人的必修课。一诺也曾被质疑激进、不稳。可他选择了用训练回应质疑，用成绩证明自己。你也可以。",
                        "C. 我想知道一诺是如何面对质疑的": "好问题！一诺面对质疑的方式很简单--训练。数千次训练赛，每一次走位调整，都是他对质疑最好的回应。他说：你可以不成功，但不能不成长。这就是答案。"
                    }
                }
            },
            "trigger_conditions": {
                "type": "location_checkin",
                "description": "在春熙路/IFS商圈打卡时触发",
                "keywords": ["春熙路", "IFS", "太古里"]
            },
            "hint_text": "这段记忆藏在一诺成长的足迹里…",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "ag_egg_03",
            "city_id": "chengdu",
            "name": "意生意世·最强中野羁绊",
            "type": "player_bond",
            "location": {"type": "Point", "coordinates": [104.0700, 30.6600]},
            "rarity": "legendary",
            "rarity_label": "✦✦✦✦ 传说",
            "rarity_color": "#FFD700",
            "bond_data": {
                "team_name": "成都AG超玩会",
                "location_context": "成都·知己相逢之处",
                "story": "长生（谢承峻）与钟意（陈家豪）2023年立下誓言：成为联盟最强中野。长生的沉稳与钟意的凶猛完美互补，2025春决共同捧起奖杯，EWC世界杯绝境中联手完成惊天逆转！",
                "player_quote": "意生意世，打法绑定，天下无敌。",
                "nearby_shop": "AG电竞中心"
            },
            "fragment_id": "frag_ag_03",
            "fragment_content": "一张两人击掌的照片，背景是金色的冠军奖杯。",
            "badge_id": "badge_yisheng_yishi",
            "badge_name": "意生意世",
            "bookmark_data": {
                "title": "意生意世",
                "quote": "意生意世，\n打法绑定，\n天下无敌。",
                "visual_desc": "两人背靠背站立，一人持剑一人持扇，气势如虹",
                "bg_color": "#FFF8E1",
                "accent_color": "#FFD700"
            },
            "ai_dialogs": {
                "li_bai": "妙哉！妙哉！你二人竟在同一时辰路过此地！\n这让我想起AG的意生意世组合，长生与钟意。\n2023年，钟意从狼队转会而来，与长生立下誓言：要成为联盟最强中野，携手为AG捧起冠军奖杯。\n长生的沉稳，钟意的凶猛，完美互补，天衣无缝。2024年低谷，他们并肩熬过；2025年春决，他们共同捧起奖杯；EWC世界杯绝境，他们联手完成惊天逆转！\n这就是羁绊的力量，一个人可以走得快，但两个人才能走得远。",
                "zhugeliang": "主公，此地曾有二人立下誓言，曰"意生意世"。\n一人沉稳如大地，一人凶猛如烈火，二者相辅相成，终成最强中野。\n此乃羁绊之力也--独行快，众行远。",
                "luban": "大哥哥/大姐姐！长生哥哥和钟意哥哥是最好的朋友！他们一起打比赛，一个稳一个猛，超级厉害的！\n鲁班觉得，有朋友一起努力，真的很幸福！"
            },
            "spirit_data": {
                "event_name": "意生意世羁绊",
                "event_time": "2023-2025",
                "venue": "成都",
                "story": "从誓言到冠军，长生与钟意用羁绊书写了最强中野的传奇。",
                "spirit_keyword": "羁绊",
                "quote": "意生意世，打法绑定，天下无敌。",
                "easter_egg": {
                    "question": "你有没有这样一个伙伴--既是并肩作战的队友，也是互相成就的知己？",
                    "options": ["A. 有！我们互相成就，一起走到今天", "B. 我希望未来能遇到这样的伙伴", "C. 我想知道长生和钟意是如何配合的"],
                    "follow_up_replies": {
                        "A. 有！我们互相成就，一起走到今天": "珍惜这份羁绊！长生和钟意曾说：别人能到达的地方，你也可以到达。有知己相伴，路再远也不孤单。",
                        "B. 我希望未来能遇到这样的伙伴": "会有那么一个人的。就像钟意跨越半个联盟来到AG，只为与长生完成那个誓言。最好的伙伴，总会在对的时刻出现。",
                        "C. 我想知道长生和钟意是如何配合的": "长生的沉稳，钟意的凶猛，这就是他们完美互补的秘诀。2025春决，他们首次共同捧起奖杯；EWC世界杯绝境，联手完成惊天逆转！这就是意生意世--打法绑定，天下无敌！"
                    }
                }
            },
            "trigger_conditions": {
                "type": "co_checkin",
                "description": "两个不同用户在同一地点1小时内先后打卡时触发",
                "time_window": 60
            },
            "hint_text": "这段记忆藏在最强中野的羁绊里…",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # 插入数据
    print("\n📝 插入彩蛋数据...")
    inserted_count = 0
    updated_count = 0
    
    for egg in all_easter_eggs:
        existing = easter_eggs.find_one({"id": egg["id"]})
        if existing:
            easter_eggs.update_one(
                {"id": egg["id"]},
                {"$set": {k: v for k, v in egg.items() if k not in ["created_at"]}}
            )
            updated_count += 1
            print(f"  🔄 更新: {egg['name']}")
        else:
            easter_eggs.insert_one(egg)
            inserted_count += 1
            print(f"  ✅ 新增: {egg['name']}")
    
    print(f"\n📊 统计:")
    print(f"  新增: {inserted_count} 个")
    print(f"  更新: {updated_count} 个")
    print(f"  总计: {easter_eggs.count_documents({})} 个彩蛋")
    
    # 显示彩蛋列表
    print("\n📚 彩蛋列表:")
    for egg in easter_eggs.find().sort("id", 1):
        print(f"  • [{egg['rarity_label']}] {egg['name']} ({egg['type']})")
    
    client.close()
    print("\n" + "=" * 60)
    print("🎉 彩蛋数据库表创建完成！")
    print("=" * 60)

if __name__ == "__main__":
    main()

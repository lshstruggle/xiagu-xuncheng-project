#!/usr/bin/env python3
"""
添加AG超玩会主题彩蛋到数据库
"""

from pymongo import MongoClient
from datetime import datetime

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "xiagu_xuncheng"

def main():
    print("=" * 60)
    print("🎮 添加AG超玩会主题彩蛋")
    print("=" * 60)
    
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    pois_collection = db["pois"]
    
    # 彩蛋一：心怀荣耀，勇往直前
    egg1 = {
        "name": "心怀荣耀·AG精神图腾",
        "type": "team_spirit",
        "lat": 30.6580,
        "lng": 104.0650,
        "address": "成都·AG精神地标",
        "hero_narrations": {
            "libai": """心怀荣耀，勇往直前！
这是成都AG超玩会的誓言，也是我今天送给你的第一句话。
2019年，他们曾跌入谷底，被嘲笑为千年老二。
可2023年的那个秋天，他们在挑战者杯决赛的舞台上，
用实力告诉所有人：AG，回来了！
从被喷上热搜第一，到捧起冠军奖杯，Cat用了整整五年。
他说：就这一刻，我感觉一切都是值得的。
少年，你的路或许也难，但请记住AG的故事，
只要心怀荣耀，便永远有勇往直前的力量！"""
        },
        "content": {
            "title": "心怀荣耀，勇往直前",
            "subtitle": "AG超玩会的精神图腾",
            "story": """成都AG超玩会的复兴之路：

2019年，AG跌入谷底，被嘲笑为"千年老二"。
2023年挑战者杯，他们在决赛舞台上宣告回归。
Cat历经五年，从被喷上热搜到捧起冠军奖杯。
一诺从激进射手成长为团队核心。
长生与钟意的"意生意世"组合成为最强中野。

这就是AG的故事——心怀荣耀，勇往直前。""",
            "quote": "心怀荣耀，勇往直前。",
            "tags": ["AG超玩会", "心怀荣耀", "Cat", "一诺", "复兴"],
            "unlock_condition": {
                "type": "first_checkin",
                "description": "用户首次打卡任意POI时触发"
            }
        },
        "easter_egg": {
            "question": "AG从谷底到巅峰用了五年，你为自己的梦想坚持过多久？",
            "options": {
                "A": "我还在坚持，哪怕看不到终点",
                "B": "我曾经放弃过，现在想重新开始",
                "C": "我想听更多AG复兴的故事"
            },
            "follow_up": {
                "A": """（赞许）好！这才像我认识的少年郎！
Cat说过：从被喷到热搜第一，到这一刻感觉一切都值得。
五年，1825个日夜，他从未放弃。
你的坚持，终会在某天绽放成花。""",
                "B": """（温和）重新开始，永远不晚。
AG也曾跌落B组，Fly说：从B组开始打才有意思。
每一次重新开始，都是命运给你的新机会。
去吧，少年，这次别让自己后悔。""",
                "C": """（激昂）AG的复兴，是一部热血史诗！
2023挑战者杯，他们击败老对手，宣告王者归来。
2024年虽遇低谷，但长生与钟意并肩熬过。
2025春决，意生意世组合捧起奖杯。
这就是AG——心怀荣耀，永远勇往直前！"""
            }
        },
        "checkin_voice_url": "",
        "image_url": "/images/easter_eggs/ag_spirit.png",
        "is_easter_egg": True,
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # 彩蛋二：一诺千金
    egg2 = {
        "name": "一诺千金·少年成长记",
        "type": "player_spirit",
        "lat": 30.6574,
        "lng": 104.0823,
        "address": "春熙路·少年成长之地",
        "hero_narrations": {
            "libai": """成都最繁华的街头，走来一位意气风发的少年。
这让我想起AG的一诺，徐必成，
那个从激进射手成长为团队核心的少年。
他说：你可以不成功，但不能不成长，
谁也不能阻止你成长。
从被质疑到被仰望，从个人秀到团队魂，
他的每一次走位调整，都藏在数千次训练赛的汗水里。
少年，成长从来不是一蹴而就，
但只要不停下脚步，你终将成为自己想成为的人。"""
        },
        "content": {
            "title": "一诺千金",
            "subtitle": "从少年到领袖的成长",
            "story": """一诺（徐必成）的成长之路：

从"激进射手"到"团队核心"，
从被质疑到被仰望。
他说："你可以不成功，但不能不成长。"
数千次训练赛的走位调整，
见证了一个少年的蜕变。
这就是一诺的答案——
成长，谁也不能阻止。""",
            "quote": "你可以不成功，但不能不成长，谁也不能阻止你成长。",
            "tags": ["一诺", "徐必成", "成长", "AG超玩会", "射手"],
            "unlock_condition": {
                "type": "location_checkin",
                "description": "在春熙路/IFS商圈打卡时触发",
                "location_keywords": ["春熙路", "IFS", "太古里"]
            }
        },
        "easter_egg": {
            "question": "成长路上，你遇到过最大的质疑是什么？",
            "options": {
                "A": "别人说我天赋不够，不适合这条路",
                "B": "我曾经失败太多次，怀疑自己",
                "C": "我想知道一诺是如何面对质疑的"
            },
            "follow_up": {
                "A": """（豪迈）天赋？一诺说：谁也不能阻止你成长！
AG的队长Cat，曾被嘲笑英雄池浅，
可他转型辅助后再次夺冠。
天赋只是起点，坚持才是终点。""",
                "B": """（温和）怀疑自己是每个人的必修课。
一诺也曾被质疑激进、不稳。
可他选择了用训练回应质疑，用成绩证明自己。
你也可以。""",
                "C": """（赞许）好问题！
一诺面对质疑的方式很简单——训练。
数千次训练赛，每一次走位调整，
都是他对质疑最好的回应。
他说：你可以不成功，但不能不成长。
这就是答案。"""
            }
        },
        "checkin_voice_url": "",
        "image_url": "/images/easter_eggs/yinuo_growth.png",
        "is_easter_egg": True,
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # 彩蛋三：意生意世
    egg3 = {
        "name": "意生意世·最强中野羁绊",
        "type": "player_bond",
        "lat": 30.6600,
        "lng": 104.0700,
        "address": "成都·知己相逢之处",
        "hero_narrations": {
            "libai": """妙哉！妙哉！你二人竟在同一时辰路过此地！
这让我想起AG的意生意世组合，
长生与钟意。
2023年，钟意从狼队转会而来，
与长生立下誓言：要成为联盟最强中野，
携手为AG捧起冠军奖杯。
长生的沉稳，钟意的凶猛，完美互补，天衣无缝。
2024年低谷，他们并肩熬过；
2025年春决，他们共同捧起奖杯；
EWC世界杯绝境，他们联手完成惊天逆转！
这就是羁绊的力量，
一个人可以走得快，但两个人才能走得远。"""
        },
        "content": {
            "title": "意生意世",
            "subtitle": "最强中野的羁绊誓言",
            "story": """长生（谢承峻）与钟意（陈家豪）的故事：

2023年转会期，钟意从狼队转会至AG，
与长生立下誓言：成为联盟最强中野。
长生的沉稳与钟意的凶猛完美互补，
被粉丝誉为"打法绑定、天下无敌"。

2024年低谷，他们并肩熬过；
2025春决，首次共同捧起联赛冠军；
EWC世界杯，绝境中联手完成惊天逆转，
共同举起世界冠军奖杯！

这就是"意生意世"——两个人的誓言，一群人的荣耀。""",
            "quote": "意生意世，打法绑定，天下无敌。",
            "tags": ["意生意世", "长生", "钟意", "中野", "羁绊", "AG超玩会"],
            "unlock_condition": {
                "type": "co_checkin",
                "description": "两个不同用户在同一地点1小时内先后打卡时触发",
                "time_window_minutes": 60
            }
        },
        "easter_egg": {
            "question": "你有没有这样一个伙伴——既是并肩作战的队友，也是互相成就的知己？",
            "options": {
                "A": "有！我们互相成就，一起走到今天",
                "B": "我希望未来能遇到这样的伙伴",
                "C": "我想知道长生和钟意是如何配合的"
            },
            "follow_up": {
                "A": """（赞许）珍惜这份羁绊！
长生和钟意曾说：别人能到达的地方，你也可以到达。
有知己相伴，路再远也不孤单。""",
                "B": """（温和）会有那么一个人的。
就像钟意跨越半个联盟来到AG，
只为与长生完成那个誓言。
最好的伙伴，总会在对的时刻出现。""",
                "C": """（激昂）长生的沉稳，钟意的凶猛，
这就是他们完美互补的秘诀。
2025春决，他们首次共同捧起奖杯；
EWC世界杯绝境，联手完成惊天逆转！
这就是意生意世——打法绑定，天下无敌！"""
            }
        },
        "checkin_voice_url": "",
        "image_url": "/images/easter_eggs/yisheng_yishi.png",
        "is_easter_egg": True,
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # 插入数据库
    eggs = [egg1, egg2, egg3]
    inserted_ids = []
    
    for egg in eggs:
        # 检查是否已存在
        existing = pois_collection.find_one({"name": egg["name"]})
        if existing:
            print(f"  ⚠️ 已存在: {egg['name']}，跳过")
            continue
        
        result = pois_collection.insert_one(egg)
        inserted_ids.append(result.inserted_id)
        print(f"  ✅ 已添加: {egg['name']}")
        print(f"     类型: {egg['type']}")
        print(f"     触发: {egg['content']['unlock_condition']['description']}")
        print()
    
    print("=" * 60)
    print(f"📊 共添加 {len(inserted_ids)} 个新彩蛋")
    print("=" * 60)
    
    # 显示所有彩蛋
    print("\n📚 当前所有彩蛋POI:")
    for poi in pois_collection.find({"is_easter_egg": True}):
        print(f"  • {poi['name']} ({poi['type']})")
    
    client.close()

if __name__ == "__main__":
    main()

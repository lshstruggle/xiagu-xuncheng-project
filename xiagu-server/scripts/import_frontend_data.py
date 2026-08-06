#!/usr/bin/env python3
"""
导入前端配置数据到MongoDB
将 map-hotspots.ts, bond-traces-chengdu.js, routes-chengdu.ts 的数据导入数据库
"""

import json
import os
import re
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "xiagu_xuncheng"

def parse_ts_file(filepath):
    """简单解析TS文件中的导出的数据"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 移除注释和类型定义，提取纯数据
    content = re.sub(r'//.*', '', content)  # 移除单行注释
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)  # 移除多行注释
    content = re.sub(r':\s*[A-Z][a-zA-Z<>,\s|]+', '', content)  # 移除类型定义
    content = re.sub(r'export\s+', '', content)  # 移除export
    content = re.sub(r'const\s+', '', content)  # 移除const
    
    return content

def import_routes(db):
    """导入路线数据"""
    print("\n📍 [1/3] 导入路线数据...")
    
    routes_data = [
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "宽窄巷子探秘",
            "description": "漫步千年古巷，穿越宽窄之间品味老成都的烟火与文艺",
            "duration": "约2小时",
            "difficulty": "easy",
            "distance": 2300,
            "poi_sequence": [],
            "tags": ["历史文化", "美食", "地标"],
            "spirit_lighthouse_count": 1,
            "player_footprint_count": 2,
            "recommended_heroes": ["libai"],
            "cover_image": "route_chengdu_1.jpg",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "锦里古街漫游",
            "description": "穿越三国风云，在锦里与武侯祠间寻找英雄足迹",
            "duration": "约1.5小时",
            "difficulty": "medium",
            "distance": 1800,
            "poi_sequence": [],
            "tags": ["历史文化", "美食"],
            "spirit_lighthouse_count": 2,
            "player_footprint_count": 1,
            "recommended_heroes": ["libai"],
            "cover_image": "route_chengdu_2.jpg",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "太古里巡礼",
            "description": "成都最繁华的心脏地带，霓虹之下藏着最多的峡谷秘密",
            "duration": "约1小时",
            "difficulty": "hard",
            "distance": 1200,
            "poi_sequence": [],
            "tags": ["美食", "地标", "电竞"],
            "spirit_lighthouse_count": 1,
            "player_footprint_count": 3,
            "recommended_heroes": ["libai"],
            "cover_image": "route_chengdu_3.jpg",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
    ]
    
    coll = db["routes"]
    coll.delete_many({"city_code": "CD"})
    result = coll.insert_many(routes_data)
    print(f"  ✅ 导入 {len(result.inserted_ids)} 条路线")
    return routes_data

def import_pois(db):
    """导入POI数据（基于前端的详细数据）"""
    print("\n📍 [2/3] 导入POI数据...")
    
    pois_data = [
        # ===== 宽窄巷子路线 =====
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "宽窄巷子",
            "type": "tower",
            "category": "历史街区",
            "location": {"type": "Point", "coordinates": [104.0550, 30.6690]},
            "trigger_radius": 100,
            "description": "由宽巷子、窄巷子、井巷子组成的清朝古街",
            "images": ["kuanzhai.jpg"],
            "hero_narrations": {"libai": "此处巷陌纵横，颇似峡谷草丛，宜伏击，亦宜品茗！"},
            "rewards": {"bond_value": 15},
            "status": "active",
            "priority": 95,
            "price": "免费",
            "duration": "1.5-2小时",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "成都院子酒店",
            "type": "spirit_lighthouse",
            "category": "文化体验",
            "location": {"type": "Point", "coordinates": [104.0480, 30.6755]},
            "trigger_radius": 80,
            "description": "16座川西院落组成的非遗文化主题酒店",
            "images": ["courtyard.jpg"],
            "hero_narrations": {"libai": "院中有院，楼中有楼，这格局倒像是红蓝双方的基地。"},
            "rewards": {"bond_value": 20},
            "status": "active",
            "priority": 80,
            "price": "800元起/晚",
            "duration": "过夜",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "贺记蛋烘糕",
            "type": "red_buff",
            "category": "美食",
            "location": {"type": "Point", "coordinates": [104.0770, 30.6740]},
            "trigger_radius": 60,
            "description": "清朝传下来的成都传统小吃，外酥内软",
            "images": ["danhonggao.jpg"],
            "hero_narrations": {"libai": "外酥内软，香甜可口，比红buff回血还快！"},
            "rewards": {"bond_value": 10},
            "status": "active",
            "priority": 70,
            "price": "人均3-8元",
            "duration": "10-15分钟",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "洞子口张老二凉粉",
            "type": "red_buff",
            "category": "美食",
            "location": {"type": "Point", "coordinates": [104.0760, 30.6755]},
            "trigger_radius": 60,
            "description": "文殊院旁百年老店，甜水面五味俱全",
            "images": ["liangfen.jpg"],
            "hero_narrations": {"libai": "百年老店，手艺传承，这味道怕是比峡谷里的野怪还让人惦记！"},
            "rewards": {"bond_value": 10},
            "status": "active",
            "priority": 72,
            "price": "人均10-15元",
            "duration": "20-30分钟",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "文殊院",
            "type": "spirit_lighthouse",
            "category": "历史文化",
            "location": {"type": "Point", "coordinates": [104.0760, 30.6750]},
            "trigger_radius": 100,
            "description": "千年禅林，红墙银杏，盖碗茶文化体验地",
            "images": ["wenshu.jpg"],
            "hero_narrations": {"libai": "红墙之内，禅意悠然。千年银杏下品一碗香茗，比拿蓝buff还提神！"},
            "rewards": {"bond_value": 20},
            "status": "active",
            "priority": 85,
            "price": "免费",
            "duration": "1-2小时",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        # ===== 锦里古街路线 =====
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "锦里古街",
            "type": "red_buff",
            "category": "历史街区",
            "location": {"type": "Point", "coordinates": [104.0490, 30.6450]},
            "trigger_radius": 100,
            "description": "三国文化主题街区，夜晚灯笼亮起仿佛穿越",
            "images": ["jinli.jpg"],
            "hero_narrations": {"libai": "推塔！成都的高地，已被你我征服！此情此景，当浮一大白！"},
            "rewards": {"bond_value": 15},
            "status": "active",
            "priority": 90,
            "price": "免费",
            "duration": "1-2小时",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "武侯祠",
            "type": "blue_buff",
            "category": "历史文化",
            "location": {"type": "Point", "coordinates": [104.0470, 30.6420]},
            "trigger_radius": 80,
            "description": "中国唯一君臣合祀祠庙，纪念诸葛亮与刘备的千古佳话",
            "images": ["wuhouci.jpg"],
            "hero_narrations": {"libai": "遥想诸葛丞相，运筹帷幄，何异于峡谷军师？此处柏森森，清幽宜人。"},
            "rewards": {"bond_value": 20, "items": [{"type": "knowledge_card", "id": "kc_wuhouci", "name": "武侯祠历史卡"}]},
            "status": "active",
            "priority": 95,
            "price": "门票50元",
            "duration": "2-3小时",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "杜甫草堂",
            "type": "tower",
            "category": "历史文化",
            "location": {"type": "Point", "coordinates": [104.0550, 30.6245]},
            "trigger_radius": 80,
            "description": "诗圣杜甫流寓成都时的故居，现为博物馆",
            "images": ["caotang.jpg"],
            "hero_narrations": {"libai": "杜子美虽非我知己，但其诗文厚重，令人敬佩。这草堂虽简，却是诗意栖居之所。"},
            "rewards": {"bond_value": 20},
            "status": "active",
            "priority": 85,
            "price": "门票50元",
            "duration": "1.5-2小时",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        # ===== 太古里路线 =====
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "春熙路/太古里",
            "type": "spirit_lighthouse",
            "category": "地标",
            "location": {"type": "Point", "coordinates": [104.0820, 30.6560]},
            "trigger_radius": 100,
            "description": "成都最繁华的时尚中心，IFS爬墙熊猫打卡地",
            "images": ["chunxilu.jpg"],
            "hero_narrations": {"libai": "哈哈哈，又下一塔！这人间烟火，比峡谷还热闹！"},
            "rewards": {"bond_value": 30},
            "status": "active",
            "priority": 92,
            "price": "免费",
            "duration": "2-3小时",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "量子光电竞中心",
            "type": "blue_buff",
            "category": "电竞场馆",
            "location": {"type": "Point", "coordinates": [104.0900, 30.6600]},
            "trigger_radius": 100,
            "description": "KPL西部主场，承载了成都电竞的热血记忆",
            "images": ["quantum.jpg"],
            "hero_narrations": {"libai": "前方那座建筑，见证了无数峡谷英雄的荣耀时刻。金雨落下时，整座城都在为他们欢呼。"},
            "rewards": {"bond_value": 25},
            "status": "active",
            "priority": 95,
            "price": "根据赛事定价",
            "duration": "2-3小时",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
    ]
    
    coll = db["pois"]
    coll.delete_many({"city_code": "CD"})
    result = coll.insert_many(pois_data)
    print(f"  ✅ 导入 {len(result.inserted_ids)} 个POI")
    return pois_data

def import_bond_traces(db):
    """导入羁绊/彩蛋数据"""
    print("\n📍 [3/3] 导入羁绊彩蛋数据...")
    
    # 彩蛋/羁绊数据（从前端 bond-traces-chengdu.js 转换）
    bonds_data = [
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "啊——将军",
            "type": "player_footprint",
            "rarity": "normal",
            "location": {"type": "Point", "coordinates": [104.0790, 30.6590]},
            "trigger_radius": 80,
            "player_bond": {
                "team_name": "反差萌军团",
                "era": "2023",
                "story": "几位以冷静著称的选手来这一带做直播任务，其中一位被掏耳朵时惊叫出声，与赛场形象形成巨大反差，成为经典表情包。",
                "quote": "赛场上我是战神，巷子里我是普通人——一个怕掏耳朵的普通人。",
                "quote_source": "灵感来源于电竞赛事公开报道",
                "hero_narration": {
                    "libai": "宽窄巷子…（忍不住笑了）我跟你说件趣事。有一回，几个峡谷里的高手来这里做任务，其中一位，赛场上号称'泰山崩于前而面不改色'。结果被掏了个耳朵——他'啊——'了一嗓子，整条巷子都听见了。（大笑）英雄也有可爱的一面。客官要不要也去体验一下？"
                },
                "bookmark_id": "bookmark_cd_01",
            },
            "hint_text": "这段记忆藏在一声"啊——"里…",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "茶馆军师",
            "type": "player_footprint",
            "rarity": "rare",
            "location": {"type": "Point", "coordinates": [104.0835, 30.6555]},
            "trigger_radius": 80,
            "player_bond": {
                "team_name": "棋局之外",
                "era": "2022",
                "story": "一位教练喜欢带选手来茶馆聊天，不看录像不谈战术，只谈心态。他说："比赛打的是心态，心态要在最慢的地方练。"",
                "quote": "峡谷里的团战只有几秒，决定胜负的是之前几个月的心态。",
                "quote_source": "教练语录",
                "hero_narration": {
                    "libai": "这附近…（放慢脚步）我记得有位军师，常在这种茶馆中运筹帷幄。不是排兵布阵，而是端着茶，和他的弟子们聊心境。他说："急不得。"后来他的弟子们捧杯的那天，终于懂了这两个字的分量。客官，来，饮一杯。"
                },
                "bookmark_id": "bookmark_cd_02",
            },
            "hint_text": "这段记忆藏在一杯盖碗茶中…",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "无名少年们的街",
            "type": "player_footprint",
            "rarity": "epic",
            "location": {"type": "Point", "coordinates": [104.0817, 30.6572]},
            "trigger_radius": 100,
            "player_bond": {
                "team_name": "银龙军团",
                "era": "2018-2019",
                "story": "几年前一群追梦少年从全国各地来到成都，训练结束后在这条街上做普通人。后来他们成为冠军，这条街开始有人认出他们。",
                "quote": "我们不是天才，我们只是没有退路。",
                "quote_source": "队长语录",
                "hero_narration": {
                    "libai": "这一带啊…（语气放缓）我听说过一个故事。几年前，有五个少年挤在这附近的一间小屋子里，每天训练十几个小时。没有粉丝，没有灯光，只有彼此。后来他们站上了最大的舞台。他们的队长说过一句话——"我们不是天才，我们只是没有退路。"……你尝尝那边巷子里的串串，据说他们以前常来。"
                },
                "bookmark_id": "bookmark_cd_03",
            },
            "hint_text": "这段记忆藏在霓虹灯最亮的街上…",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "city_code": "CD",
            "name": "银色灯海",
            "type": "spirit_lighthouse",
            "rarity": "legendary",
            "location": {"type": "Point", "coordinates": [104.0800, 30.6548]},
            "trigger_radius": 120,
            "spirit_event": {
                "event_name": "KPL季后赛·成都站",
                "year": 2023,
                "spirit_keyword": "孤注一掷",
                "badge_id": "badge_all_in",
                "hero_narration": {
                    "libai": "前方那个方向…（声音低沉下来）我记得那个夜晚。银色的灯海从看台蔓延到场外，像整座城市都在为峡谷中的战斗呐喊。决胜局，年轻的打野压上了一切——他赌赢了。他站起来的时候，手在发抖。不是害怕，是太想赢了。你今天走了这么远，也是因为有太想做到的事吧？"
                },
                "easter_egg": {
                    "question": "最后一波团战，你选择稳守高地还是主动出击？",
                    "options": ["稳守高地", "主动出击"],
                    "follow_up": {
                        "稳守高地": "稳重如山，亦是勇气。但那晚的少年选择了出击——有些机会只有一次。",
                        "主动出击": "好胆色！那晚的少年也这么选的。他说："我的队友值得我赌这一把。"信任才是最强装备。"
                    }
                }
            },
            "hint_text": "这段记忆藏在银色灯海的回声里…",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
    ]
    
    coll = db["pois"]
    result = coll.insert_many(bonds_data)
    print(f"  ✅ 导入 {len(result.inserted_ids)} 个羁绊/彩蛋")
    return bonds_data

def main():
    print("=" * 60)
    print("🗂️  前端数据导入工具")
    print("=" * 60)
    
    # 连接数据库
    print("\n🔌 连接MongoDB...")
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        db.command('ping')
        print("  ✅ MongoDB连接成功")
    except Exception as e:
        print(f"  ❌ 连接失败: {e}")
        return
    
    try:
        # 导入数据
        routes = import_routes(db)
        pois = import_pois(db)
        bonds = import_bond_traces(db)
        
        # 创建索引
        print("\n📇 创建索引...")
        db["pois"].create_index([("location", "2dsphere")])
        db["pois"].create_index([("city_code", 1), ("type", 1)])
        print("  ✅ 索引创建完成")
        
        # 统计
        print("\n" + "=" * 60)
        print("📊 导入完成!")
        print(f"   路线: {len(routes)} 条")
        print(f"   POI: {len(pois)} 个")
        print(f"   羁绊/彩蛋: {len(bonds)} 个")
        print(f"   总计: {len(routes) + len(pois) + len(bonds)} 条数据")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 导入失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

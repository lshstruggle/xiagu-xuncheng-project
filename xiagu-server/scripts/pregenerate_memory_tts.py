#!/usr/bin/env python3
"""
预生成回忆模式所有李白的语音
包括原有4个彩蛋 + AG彩蛋3个 共7个
"""

import hashlib
import json
import os
import requests
from pathlib import Path

# 配置
TTS_URL = "http://127.0.0.1:9881/tts"
CACHE_DIR = Path("./tts_cache")
INDEX_FILE = Path("./tts_cache/memory_tts_index.json")

# 所有回忆模式的李白 narration（7个彩蛋）
MEMORY_NARRATIONS = [
    {
        "id": "bond_cd_01",
        "name": "啊——将军",
        "text": '宽窄巷子…（忍不住笑了）\n我跟你说件趣事。有一回，几个峡谷里的高手来这里做任务，其中一位，赛场上号称"泰山崩于前而面不改色"。结果被掏了个耳朵——他"啊——"了一嗓子，整条巷子都听见了。\n（大笑）英雄也有可爱的一面。客官要不要也去体验一下？',
        "type": "player_trace"
    },
    {
        "id": "bond_cd_02",
        "name": "茶馆军师",
        "text": '这附近…（放慢脚步）\n我记得有位军师，常在这种茶馆中运筹帷幄。不是排兵布阵，而是端着茶，和他的弟子们聊心境。他说："急不得。"后来他的弟子们捧杯的那天，终于懂了这两个字的分量。\n客官，来，饮一杯。',
        "type": "player_trace"
    },
    {
        "id": "bond_cd_03",
        "name": "无名少年们的街",
        "text": '这一带啊…（语气放缓）\n我听说过一个故事。几年前，有五个少年挤在这附近的一间小屋子里，每天训练十几个小时。没有粉丝，没有灯光，只有彼此。\n后来他们站上了最大的舞台。他们的队长说过一句话——"我们不是天才，我们只是没有退路。"\n……你尝尝那边巷子里的串串，据说他们以前常来。',
        "type": "player_trace"
    },
    {
        "id": "bond_cd_04",
        "name": "银色灯海",
        "text": '前方那个方向…（声音低沉下来）\n我记得那个夜晚。银色的灯海从看台蔓延到场外，像整座城市都在为峡谷中的战斗呐喊。决胜局，年轻的打野压上了一切——他赌赢了。\n他站起来的时候，手在发抖。不是害怕，是太想赢了。\n你今天走了这么远，也是因为有太想做到的事吧？',
        "type": "spirit_beacon"
    },
    {
        "id": "ag_egg_01",
        "name": "心怀荣耀·AG精神图腾",
        "text": '心怀荣耀，勇往直前！\n这是成都AG超玩会的誓言，也是我今天送给你的第一句话。\n2019年，他们曾跌入谷底，被嘲笑为千年老二。可2023年的那个秋天，他们在挑战者杯决赛的舞台上，用实力告诉所有人：AG，回来了！\n从被喷上热搜第一，到捧起冠军奖杯，Cat用了整整五年。他说：就这一刻，我感觉一切都是值得的。\n少年，你的路或许也难，但请记住AG的故事，只要心怀荣耀，便永远有勇往直前的力量！',
        "type": "team_spirit"
    },
    {
        "id": "ag_egg_02",
        "name": "一诺千金·少年成长记",
        "text": '成都最繁华的街头，走来一位意气风发的少年。\n这让我想起AG的一诺，徐必成，那个从激进射手成长为团队核心的少年。\n他说：你可以不成功，但不能不成长，谁也不能阻止你成长。\n从被质疑到被仰望，从个人秀到团队魂，他的每一次走位调整，都藏在数千次训练赛的汗水里。\n少年，成长从来不是一蹴而就，但只要不停下脚步，你终将成为自己想成为的人。',
        "type": "player_spirit"
    },
    {
        "id": "ag_egg_03",
        "name": "意生意世·最强中野羁绊",
        "text": '妙哉！妙哉！你二人竟在同一时辰路过此地！\n这让我想起AG的意生意世组合，长生与钟意。\n2023年，钟意从狼队转会而来，与长生立下誓言：要成为联盟最强中野，携手为AG捧起冠军奖杯。\n长生的沉稳，钟意的凶猛，完美互补，天衣无缝。2024年低谷，他们并肩熬过；2025年春决，他们共同捧起奖杯；EWC世界杯绝境，他们联手完成惊天逆转！\n这就是羁绊的力量，一个人可以走得快，但两个人才能走得远。',
        "type": "player_bond"
    }
]

def get_text_hash(text: str) -> str:
    """生成文本的MD5哈希作为缓存键"""
    return hashlib.md5(text.encode('utf-8')).hexdigest()

def synthesize_tts(text: str) -> bytes:
    """调用TTS服务生成语音"""
    if not text or len(text.strip()) == 0:
        return None
    
    # 限制长度
    text = text[:300]
    
    try:
        resp = requests.post(TTS_URL, json={"text": text}, timeout=120)
        if resp.status_code == 200:
            return resp.content
        else:
            print(f"  ❌ TTS失败: {resp.status_code} - {text[:30]}...")
            return None
    except Exception as e:
        print(f"  ❌ TTS异常: {e} - {text[:30]}...")
        return None

def check_cached(text: str) -> tuple[bool, str]:
    """检查是否已有缓存，返回(是否存在, 缓存路径)"""
    cache_key = get_text_hash(text)
    cache_path = CACHE_DIR / f"{cache_key}.wav"
    return cache_path.exists(), str(cache_path)

def save_to_cache(text: str, audio_data: bytes) -> str:
    """保存到缓存目录，返回缓存路径"""
    cache_key = get_text_hash(text)
    cache_path = CACHE_DIR / f"{cache_key}.wav"
    with open(cache_path, 'wb') as f:
        f.write(audio_data)
    return str(cache_path)

def build_index():
    """构建语音索引文件"""
    index = {
        "version": "1.0",
        "total_count": len(MEMORY_NARRATIONS),
        "items": []
    }
    
    for item in MEMORY_NARRATIONS:
        text = item["text"]
        exists, cache_path = check_cached(text)
        
        index["items"].append({
            "id": item["id"],
            "name": item["name"],
            "type": item["type"],
            "text_hash": get_text_hash(text),
            "text_preview": text[:50] + "...",
            "cache_path": cache_path if exists else None,
            "cached": exists
        })
    
    # 保存索引
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    return index

def main():
    print("=" * 70)
    print("🎙️ 回忆模式李白语音预生成工具")
    print("=" * 70)
    
    # 确保缓存目录存在
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\n📁 缓存目录: {CACHE_DIR.absolute()}")
    print(f"📁 索引文件: {INDEX_FILE.absolute()}")
    
    # 检查TTS服务
    print("\n🔍 检查TTS服务...")
    try:
        health = requests.get("http://127.0.0.1:9881/health", timeout=5)
        if health.status_code == 200:
            print("  ✅ TTS服务在线")
        else:
            print(f"  ❌ TTS服务异常: {health.status_code}")
            print("  尝试启动TTS服务...")
            return
    except Exception as e:
        print(f"  ❌ 无法连接TTS服务: {e}")
        print("  请确保TTS服务已启动: cd GPT-SoVITS && python api_v2.py")
        return
    
    print(f"\n📊 共 {len(MEMORY_NARRATIONS)} 条回忆模式语音需要预生成")
    print("-" * 70)
    
    # 显示所有项目
    for i, item in enumerate(MEMORY_NARRATIONS, 1):
        exists, _ = check_cached(item["text"])
        status = "✅ 已缓存" if exists else "⬜ 待生成"
        print(f"  {i}. {item['name']} [{item['type']}] - {status}")
    
    # 生成语音
    print("\n" + "=" * 70)
    print("🚀 开始生成语音...")
    print("=" * 70)
    
    success_count = 0
    fail_count = 0
    skip_count = 0
    
    for i, item in enumerate(MEMORY_NARRATIONS, 1):
        text = item["text"]
        name = item["name"]
        
        # 检查是否已有缓存
        exists, _ = check_cached(text)
        if exists:
            print(f"\n[{i}/{len(MEMORY_NARRATIONS)}] ⏩ 跳过(已缓存): {name}")
            skip_count += 1
            continue
        
        print(f"\n[{i}/{len(MEMORY_NARRATIONS)}] 🎙️ 生成: {name}")
        print(f"      文本长度: {len(text)} 字")
        print(f"      预览: {text[:60]}...")
        
        audio_data = synthesize_tts(text)
        if audio_data:
            cache_path = save_to_cache(text, audio_data)
            size_kb = len(audio_data) / 1024
            duration_estimate = len(audio_data) / 16000  # 粗略估计
            print(f"      ✅ 完成 ({size_kb:.1f}KB, 约{duration_estimate:.1f}秒)")
            print(f"      📁 缓存: {cache_path}")
            success_count += 1
        else:
            print(f"      ❌ 生成失败")
            fail_count += 1
    
    # 构建索引
    print("\n" + "=" * 70)
    print("📋 构建语音索引...")
    index = build_index()
    print(f"  ✅ 索引已保存: {INDEX_FILE}")
    
    # 总结
    print("\n" + "=" * 70)
    print("📈 生成完成!")
    print("=" * 70)
    print(f"   ✅ 成功: {success_count}")
    print(f"   ⏩ 跳过(已缓存): {skip_count}")
    print(f"   ❌ 失败: {fail_count}")
    
    # 显示缓存目录大小
    total_size = sum(f.stat().st_size for f in CACHE_DIR.glob("*.wav"))
    file_count = len(list(CACHE_DIR.glob("*.wav")))
    print(f"\n💾 缓存统计:")
    print(f"   文件数: {file_count} 个")
    print(f"   总大小: {total_size / 1024 / 1024:.2f} MB")
    
    print("\n" + "=" * 70)
    print("📝 使用说明:")
    print("   1. 语音文件保存在 tts_cache/ 目录")
    print("   2. 索引文件: memory_tts_index.json")
    print("   3. 触发彩蛋时会自动播放对应语音")
    print("=" * 70)

if __name__ == "__main__":
    main()

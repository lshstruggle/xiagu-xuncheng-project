#!/usr/bin/env python3
"""
TTS预生成脚本 - 为所有打卡地 narration 和彩蛋语音预生成缓存
"""

import hashlib
import json
import os
import requests
from pathlib import Path
from pymongo import MongoClient

# 配置
TTS_URL = "http://127.0.0.1:9881/tts"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "xiagu_xuncheng"
CACHE_DIR = Path("./tts_cache")
HERO_ID = "libai"  # 目前只预生成李白的语音

def get_text_hash(text: str) -> str:
    """生成文本的MD5哈希作为缓存键"""
    return hashlib.md5(text.encode('utf-8')).hexdigest()

def synthesize_tts(text: str) -> bytes:
    """调用TTS服务生成语音"""
    if not text or len(text.strip()) == 0:
        return None
    
    # 限制长度
    text = text[:200]
    
    try:
        resp = requests.post(TTS_URL, json={"text": text}, timeout=60)
        if resp.status_code == 200:
            return resp.content
        else:
            print(f"  ❌ TTS失败: {resp.status_code} - {text[:30]}...")
            return None
    except Exception as e:
        print(f"  ❌ TTS异常: {e} - {text[:30]}...")
        return None

def check_cached(text: str) -> bool:
    """检查是否已有缓存"""
    cache_key = get_text_hash(text)
    cache_path = CACHE_DIR / f"{cache_key}.wav"
    return cache_path.exists()

def save_to_cache(text: str, audio_data: bytes):
    """保存到缓存目录"""
    cache_key = get_text_hash(text)
    cache_path = CACHE_DIR / f"{cache_key}.wav"
    with open(cache_path, 'wb') as f:
        f.write(audio_data)

def collect_all_texts(db) -> list:
    """从数据库收集所有需要预生成的文本"""
    texts = []
    pois_collection = db["pois"]
    
    print("📚 正在从数据库收集文本...")
    
    for poi in pois_collection.find():
        poi_name = poi.get("name", "未知")
        
        # 1. HeroNarrations - 普通打卡 narration
        hero_narrations = poi.get("hero_narrations", {})
        if HERO_ID in hero_narrations:
            text = hero_narrations[HERO_ID]
            texts.append({
                "type": "hero_narration",
                "poi": poi_name,
                "text": text,
                "desc": f"{poi_name} - 普通打卡 narration"
            })
        
        # 2. SpiritEvent.HeroNarration - 赛事精神打卡
        spirit_event = poi.get("spirit_event")
        if spirit_event:
            spirit_narration = spirit_event.get("hero_narration", {})
            if HERO_ID in spirit_narration:
                text = spirit_narration[HERO_ID]
                texts.append({
                    "type": "spirit_narration",
                    "poi": poi_name,
                    "text": text,
                    "desc": f"{poi_name} - 赛事精神 narration"
                })
            
            # 3. SpiritEvent.EasterEgg.FollowUp - 彩蛋问答回复
            easter_egg = spirit_event.get("easter_egg")
            if easter_egg:
                follow_up = easter_egg.get("follow_up", {})
                for option, response in follow_up.items():
                    texts.append({
                        "type": "easter_egg",
                        "poi": poi_name,
                        "text": response,
                        "desc": f"{poi_name} - 彩蛋回复({option})"
                    })
        
        # 4. PlayerBond.HeroNarration - 选手羁绊打卡
        player_bond = poi.get("player_bond")
        if player_bond:
            bond_narration = player_bond.get("hero_narration", {})
            if HERO_ID in bond_narration:
                text = bond_narration[HERO_ID]
                texts.append({
                    "type": "player_bond",
                    "poi": poi_name,
                    "text": text,
                    "desc": f"{poi_name} - 选手羁绊 narration"
                })
    
    return texts

def main():
    print("=" * 60)
    print("🎙️ 峡谷寻城记 - TTS预生成工具")
    print("=" * 60)
    
    # 确保缓存目录存在
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\n📁 缓存目录: {CACHE_DIR.absolute()}")
    
    # 检查TTS服务
    print("\n🔍 检查TTS服务...")
    try:
        health = requests.get("http://127.0.0.1:9881/health", timeout=5)
        if health.status_code == 200:
            print("  ✅ TTS服务在线")
        else:
            print(f"  ❌ TTS服务异常: {health.status_code}")
            return
    except Exception as e:
        print(f"  ❌ 无法连接TTS服务: {e}")
        print("  请确保TTS服务已启动: python tts_server.py")
        return
    
    # 连接数据库
    print("\n🔍 连接MongoDB...")
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        db.command('ping')
        print("  ✅ MongoDB连接成功")
    except Exception as e:
        print(f"  ❌ MongoDB连接失败: {e}")
        return
    
    # 收集所有文本
    texts = collect_all_texts(db)
    client.close()
    
    print(f"\n📊 共发现 {len(texts)} 条需要预生成的语音")
    
    # 统计缓存情况
    cached_count = sum(1 for item in texts if check_cached(item["text"]))
    need_generate = len(texts) - cached_count
    
    print(f"   - 已缓存: {cached_count} 条")
    print(f"   - 待生成: {need_generate} 条")
    
    if need_generate == 0:
        print("\n✅ 所有语音已预生成完毕！")
        return
    
    # 生成语音
    print(f"\n🚀 开始生成语音...")
    success_count = 0
    fail_count = 0
    skip_count = 0
    
    for i, item in enumerate(texts, 1):
        text = item["text"]
        desc = item["desc"]
        
        # 检查是否已有缓存
        if check_cached(text):
            print(f"  [{i}/{len(texts)}] ⏩ 跳过(已缓存): {desc}")
            skip_count += 1
            continue
        
        print(f"  [{i}/{len(texts)}] 🎙️ 生成: {desc}")
        print(f"      文本: {text[:50]}...")
        
        audio_data = synthesize_tts(text)
        if audio_data:
            save_to_cache(text, audio_data)
            size_kb = len(audio_data) / 1024
            print(f"      ✅ 完成 ({size_kb:.1f}KB)")
            success_count += 1
        else:
            fail_count += 1
    
    # 总结
    print("\n" + "=" * 60)
    print("📈 生成完成!")
    print(f"   ✅ 成功: {success_count}")
    print(f"   ⏩ 跳过(已缓存): {skip_count}")
    print(f"   ❌ 失败: {fail_count}")
    print("=" * 60)
    
    # 显示缓存目录大小
    total_size = sum(f.stat().st_size for f in CACHE_DIR.glob("*.wav"))
    print(f"\n💾 缓存总大小: {total_size / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    main()

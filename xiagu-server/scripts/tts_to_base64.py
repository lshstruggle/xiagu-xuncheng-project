#!/usr/bin/env python3
"""
将TTS语音文件转为Base64，嵌入前端代码
"""

import json
import base64
from pathlib import Path

CACHE_DIR = Path("./tts_cache")
INDEX_FILE = Path("./tts_cache/memory_tts_index.json")
OUTPUT_FILE = Path("./tts_cache/memory_tts_base64.json")

def wav_to_base64(file_path: Path) -> str:
    """将WAV文件转为Base64字符串"""
    with open(file_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def main():
    print("=" * 60)
    print("🎙️ TTS语音文件 Base64 转换工具")
    print("=" * 60)
    
    # 读取索引
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    base64_data = {}
    
    for item in index['items']:
        egg_id = item['id']
        cache_path = item['cache_path']
        local_path = CACHE_DIR / Path(cache_path).name
        
        if not local_path.exists():
            print(f"❌ 文件不存在: {local_path}")
            continue
        
        # 转为Base64
        print(f"🔄 转换 {egg_id}...")
        b64 = wav_to_base64(local_path)
        base64_data[egg_id] = b64
        print(f"   大小: {len(b64) / 1024:.1f} KB")
    
    # 保存Base64数据
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(base64_data, f)
    
    total_size = sum(len(v) for v in base64_data.values())
    print(f"\n✅ 转换完成！")
    print(f"   文件数: {len(base64_data)}")
    print(f"   总大小: {total_size / 1024 / 1024:.2f} MB")
    print(f"   输出: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

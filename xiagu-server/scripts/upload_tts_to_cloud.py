#!/usr/bin/env python3
"""
将TTS语音文件上传到云存储（腾讯云COS示例）
"""

import json
import os
from pathlib import Path

# 配置
CACHE_DIR = Path("./tts_cache")
INDEX_FILE = Path("./tts_cache/memory_tts_index.json")

# 腾讯云COS配置（需要填写）
COS_SECRET_ID = "your-secret-id"
COS_SECRET_KEY = "your-secret-key"
COS_REGION = "ap-chengdu"  # 成都区域
COS_BUCKET = "your-bucket-name"
COS_URL_PREFIX = "https://your-bucket.cos.ap-chengdu.myqcloud.com"

def upload_to_cos(local_path: str, remote_key: str) -> str:
    """上传文件到COS，返回URL"""
    try:
        from qcloud_cos import CosConfig, CosS3Client
        
        config = CosConfig(
            Region=COS_REGION,
            SecretId=COS_SECRET_ID,
            SecretKey=COS_SECRET_KEY
        )
        client = CosS3Client(config)
        
        # 上传文件
        response = client.upload_file(
            Bucket=COS_BUCKET,
            Key=remote_key,
            LocalFilePath=local_path
        )
        
        # 返回URL
        return f"{COS_URL_PREFIX}/{remote_key}"
    except Exception as e:
        print(f"上传失败: {e}")
        return None

def main():
    print("=" * 60)
    print("🎙️ TTS语音文件上传工具")
    print("=" * 60)
    
    # 读取索引
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    print(f"\n共 {len(index['items'])} 个语音文件需要上传")
    
    # 更新索引中的URL
    for item in index['items']:
        egg_id = item['id']
        cache_path = item['cache_path']
        local_path = CACHE_DIR / Path(cache_path).name
        
        if not local_path.exists():
            print(f"❌ 文件不存在: {local_path}")
            continue
        
        # 上传到COS
        remote_key = f"tts/{egg_id}.wav"
        url = upload_to_cos(str(local_path), remote_key)
        
        if url:
            # 添加URL到索引
            item['audio_url'] = url
            print(f"✅ {egg_id}: {url}")
        else:
            print(f"❌ {egg_id}: 上传失败")
    
    # 保存更新后的索引
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 索引已更新，包含音频URL")

if __name__ == "__main__":
    main()

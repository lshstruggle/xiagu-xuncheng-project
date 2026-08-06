#!/usr/bin/env python3
"""
将预生成的语音文件上传到腾讯云COS
并在索引文件中记录云存储URL
"""

import json
import os
import sys
from pathlib import Path

# 腾讯云COS SDK
try:
    from qcloud_cos import CosConfig
    from qcloud_cos import CosS3Client
except ImportError:
    print("请先安装腾讯云COS SDK: pip install cos-python-sdk-v5")
    print("或者: pip3 install cos-python-sdk-v5")
    sys.exit(1)

# ============ 配置区域（请根据实际情况修改） ============

# 腾讯云COS配置
COS_SECRET_ID = os.getenv('COS_SECRET_ID', '')  # 从环境变量读取，或在此处填写
COS_SECRET_KEY = os.getenv('COS_SECRET_KEY', '')  # 从环境变量读取，或在此处填写
COS_REGION = os.getenv('COS_REGION', 'ap-chengdu')  # 地域，如 ap-chengdu(成都), ap-beijing(北京)
COS_BUCKET = os.getenv('COS_BUCKET', '')  # 存储桶名称，如 xiagu-voice-125xxxxxx
COS_FOLDER = 'memory-tts/'  # COS中的文件夹路径

# 本地路径配置
CACHE_DIR = Path('./tts_cache')
INDEX_FILE = Path('./tts_cache/memory_tts_index.json')

# CDN域名（如果有的话，否则使用COS默认域名）
# 例如: https://voice.xiagu.com 或 https://xiagu-voice-125xxxxxx.cos.ap-chengdu.myqcloud.com
CDN_DOMAIN = os.getenv('CDN_DOMAIN', '')

# =========================================================

def get_cdn_url(key: str) -> str:
    """获取文件的CDN访问URL"""
    if CDN_DOMAIN:
        return f"{CDN_DOMAIN.rstrip('/')}/{key}"
    else:
        # 使用COS默认域名
        return f"https://{COS_BUCKET}.cos.{COS_REGION}.myqcloud.com/{key}"

def upload_file(client, local_path: str, cos_key: str) -> bool:
    """上传单个文件到COS"""
    try:
        response = client.upload_file(
            Bucket=COS_BUCKET,
            LocalFilePath=local_path,
            Key=cos_key,
            PartSize=1,
            MAXThread=10,
            EnableMD5=False
        )
        return True
    except Exception as e:
        print(f"  ❌ 上传失败: {e}")
        return False

def main():
    print("=" * 70)
    print("☁️  腾讯云COS语音上传工具")
    print("=" * 70)
    
    # 检查配置
    if not COS_SECRET_ID or not COS_SECRET_KEY:
        print("\n❌ 错误: 未配置腾讯云COS密钥")
        print("请设置环境变量:")
        print("  export COS_SECRET_ID='your-secret-id'")
        print("  export COS_SECRET_KEY='your-secret-key'")
        print("  export COS_BUCKET='your-bucket-name'")
        print("  export COS_REGION='ap-chengdu'")
        print("\n或者修改本脚本中的配置")
        return
    
    if not COS_BUCKET:
        print("\n❌ 错误: 未配置COS存储桶名称")
        return
    
    # 检查本地文件
    if not INDEX_FILE.exists():
        print(f"\n❌ 错误: 索引文件不存在: {INDEX_FILE}")
        print("请先运行 pregenerate_memory_tts.py 生成语音文件")
        return
    
    # 加载索引
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    # 初始化COS客户端
    print(f"\n🔌 连接到腾讯云COS...")
    print(f"   地域: {COS_REGION}")
    print(f"   存储桶: {COS_BUCKET}")
    
    config = CosConfig(
        Region=COS_REGION,
        SecretId=COS_SECRET_ID,
        SecretKey=COS_SECRET_KEY,
        Token=None,
        Scheme='https'
    )
    client = CosS3Client(config)
    
    # 测试连接
    try:
        client.head_bucket(Bucket=COS_BUCKET)
        print("   ✅ 连接成功")
    except Exception as e:
        print(f"   ❌ 连接失败: {e}")
        return
    
    # 统计
    total_files = len([item for item in index['items'] if item.get('cached')])
    uploaded = 0
    skipped = 0
    failed = 0
    
    print(f"\n📊 共 {total_files} 个语音文件需要上传")
    print("-" * 70)
    
    # 上传每个文件
    for i, item in enumerate(index['items'], 1):
        if not item.get('cached'):
            continue
        
        local_path = CACHE_DIR / Path(item['cache_path']).name
        if not local_path.exists():
            print(f"\n[{i}] ⚠️ 本地文件不存在: {item['name']}")
            failed += 1
            continue
        
        # 检查是否已有云存储URL
        if item.get('cloud_url'):
            print(f"\n[{i}] ⏩ 跳过(已有云URL): {item['name']}")
            skipped += 1
            continue
        
        print(f"\n[{i}] ☁️ 上传: {item['name']}")
        print(f"      本地: {local_path}")
        
        # 构建COS key
        file_ext = local_path.suffix  # .wav
        cos_key = f"{COS_FOLDER}{item['id']}{file_ext}"
        
        # 上传
        if upload_file(client, str(local_path), cos_key):
            # 生成访问URL
            cloud_url = get_cdn_url(cos_key)
            item['cloud_url'] = cloud_url
            uploaded += 1
            print(f"      ✅ 完成")
            print(f"      URL: {cloud_url}")
        else:
            failed += 1
    
    # 保存更新后的索引
    print("\n" + "=" * 70)
    print("💾 保存索引文件...")
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"   ✅ 索引已更新: {INDEX_FILE}")
    
    # 汇总
    print("\n" + "=" * 70)
    print("📈 上传完成!")
    print("=" * 70)
    print(f"   ✅ 成功上传: {uploaded}")
    print(f"   ⏩ 跳过(已有): {skipped}")
    print(f"   ❌ 失败: {failed}")
    
    # 生成前端配置
    print("\n" + "=" * 70)
    print("📝 前端配置参考:")
    print("=" * 70)
    
    cloud_urls = {item['id']: item.get('cloud_url', '') 
                  for item in index['items'] if item.get('cloud_url')}
    
    if cloud_urls:
        print("\n// 在 api.ts 中添加:")
        print("const MEMORY_TTS_CLOUD_URLS = {")
        for egg_id, url in cloud_urls.items():
            print(f"  '{egg_id}': '{url}',")
        print("}")
        print("\n// 使用云存储URL播放:")
        print("export const getMemoryTTSCloudUrl = (id: string) => MEMORY_TTS_CLOUD_URLS[id]")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()

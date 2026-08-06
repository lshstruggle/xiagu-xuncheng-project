#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成李白故事TTS音频
"""

import json
import requests
import os
from pathlib import Path
import time

# 配置
API_URL = "http://127.0.0.1:9881"
OUTPUT_DIR = Path("/Users/lsh/服创代码/tts_output/libai-story")
LIST_FILE = Path("/Users/lsh/服创代码/tts_output/dialogue-list.json")

# 参考音频配置
REF_WAV_PATH = "/Users/lsh/服创代码/GPT-SoVITS/libai_output_1.wav"
REF_TEXT = "少侠，欢迎来到锦官城！"
REF_LANG = "zh"

def generate_tts(text, output_path):
    """调用GPT-SoVITS API生成TTS"""
    try:
        headers = {
            "Content-Type": "application/json"
        }
        data = {
            "text": text,
            "text_language": "zh",
            "speed": 1.2
        }
        
        response = requests.post(API_URL + "/tts", headers=headers, json=data, timeout=120)
        
        if response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(response.content)
            return True
        else:
            print(f"  ✗ API错误: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ✗ 请求失败: {e}")
        return False

def main():
    # 检查API是否运行
    try:
        requests.get(API_URL, timeout=5)
        print("✓ GPT-SoVITS API服务正常\n")
    except:
        print("✗ GPT-SoVITS API未启动")
        print(f"请先运行: cd /Users/lsh/服创代码/GPT-SoVITS && python api.py -dr {REF_WAV_PATH} -dt '{REF_TEXT}' -dl zh")
        return
    
    # 读取对话列表
    with open(LIST_FILE, "r", encoding="utf-8") as f:
        dialogues = json.load(f)
    
    print(f"共找到 {len(dialogues)} 条对话\n")
    
    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 生成TTS
    success_count = 0
    failed_count = 0
    
    for i, item in enumerate(dialogues, 1):
        chapter = item["chapter"]
        node_id = item["nodeId"]
        text = item["text"]
        emotion = item["emotion"]
        
        # 创建章节目录
        chapter_dir = OUTPUT_DIR / chapter
        chapter_dir.mkdir(exist_ok=True)
        
        # 生成文件名
        filename = f"{i:03d}-{node_id}-{emotion}.wav"
        output_path = chapter_dir / filename
        
        # 检查是否已存在
        if output_path.exists():
            print(f"[{i}/{len(dialogues)}] ✓ 已存在: {filename}")
            success_count += 1
            continue
        
        print(f"[{i}/{len(dialogues)}] 生成: {node_id}")
        print(f"  文本: {text[:40]}...")
        
        if generate_tts(text, str(output_path)):
            print(f"  ✓ 成功: {filename}")
            success_count += 1
        else:
            print(f"  ✗ 失败: {filename}")
            failed_count += 1
        
        # 避免请求过快
        time.sleep(0.5)
    
    print(f"\n{'='*50}")
    print(f"生成完成!")
    print(f"成功: {success_count}/{len(dialogues)}")
    print(f"失败: {failed_count}/{len(dialogues)}")
    print(f"输出目录: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()

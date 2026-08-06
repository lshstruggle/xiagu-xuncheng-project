#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成李白故事TTS音频
使用前需要启动GPT-SoVITS API服务
"""

import requests
import os
import json
import re
from pathlib import Path

# GPT-SoVITS API配置
API_URL = "http://localhost:9880"

# 李白声音模型配置（需要根据实际情况调整）
MODEL_CONFIG = {
    "refer_wav_path": "../GPT-SoVITS/libai_output_1.wav",  # 参考音频
    "prompt_text": "少侠，欢迎来到锦官城！",  # 参考音频文本
    "prompt_language": "zh",  # 参考音频语言
    "text_language": "zh",  # 生成文本语言
}

# 故事节点ID和对应章节的映射
CHAPTER_MAP = {
    # 序章
    "prologue-start": "01-序章-初入锦官城",
    "prologue-chunxi-choice": "01-序章-初入锦官城",
    "prologue-chunxi-scene": "01-序章-初入锦官城",
    "prologue-chunxi-fashion": "01-序章-初入锦官城",
    "prologue-chunxi-transition": "01-序章-初入锦官城",
    # 第一章
    "ch1-temple-start": "02-第一章-古刹繁华",
    "ch1-temple-dialog1": "02-第一章-古刹繁华",
    "ch1-temple-dialog2": "02-第一章-古刹繁华",
    "ch1-park-transition": "02-第一章-古刹繁华",
    "ch1-park-dialog1": "02-第一章-古刹繁华",
    "ch1-park-dialog2": "02-第一章-古刹繁华",
    "ch1-park-story": "02-第一章-古刹繁华",
    "ch1-end": "02-第一章-古刹繁华",
    # 第二章
    "ch2-wuhou-start": "03-第二章-武侯忠义",
    "ch2-wuhou-dialog1": "03-第二章-武侯忠义",
    "ch2-wuhou-dialog2": "03-第二章-武侯忠义",
    "ch2-wuhou-choice": "03-第二章-武侯忠义",
    "ch2-jinli-food": "03-第二章-武侯忠义",
    # 第三章
    "ch3-caotang-start": "04-第三章-诗圣故居",
    "ch3-caotang-dialog1": "04-第三章-诗圣故居",
    "ch3-caotang-dialog2": "04-第三章-诗圣故居",
    "ch3-wenshu-start": "04-第三章-诗圣故居",
    "ch3-wenshu-dialog1": "04-第三章-诗圣故居",
    "ch3-wenshu-dialog2": "04-第三章-诗圣故居",
    # 第四章
    "ch4-ag-start": "05-第四章-电竞热血",
    "ch4-ag-dialog1": "05-第四章-电竞热血",
    "ch4-ag-video": "05-第四章-电竞热血",
    "ch4-ag-dialog2": "05-第四章-电竞热血",
    "ch4-phoenix-start": "05-第四章-电竞热血",
    "ch4-phoenix-memory": "05-第四章-电竞热血",
    "ch4-phoenix-video": "05-第四章-电竞热血",
    "ch4-phoenix-story": "05-第四章-电竞热血",
    "ch4-ag-dialog3": "05-第四章-电竞热血",
    "ch4-ag-dialog4": "05-第四章-电竞热血",
    "ch4-ag-dialog5": "05-第四章-电竞热血",
    "ch4-ag-choice": "05-第四章-电竞热血",
    "ch4-ag-ending-talent": "05-第四章-电竞热血",
    "ch4-ag-ending-effort": "05-第四章-电竞热血",
    "ch4-ag-ending-team": "05-第四章-电竞热血",
    # 终章
    "ch5-final-start": "06-终章-灯火九眼桥",
    "ch5-final-dialog1": "06-终章-灯火九眼桥",
    "ch5-final-dialog2": "06-终章-灯火九眼桥",
    "ch5-final-dialog3": "06-终章-灯火九眼桥",
    "ch5-ending": "06-终章-灯火九眼桥",
}

def parse_story_file():
    """解析故事文件，提取李白的对话"""
    story_file = Path("../首页代码/src/data/stories/libai-chengdu.ts")
    
    with open(story_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 提取所有节点
    nodes = []
    
    # 匹配节点定义
    node_pattern = r"'([^']+)':\s*\{[^}]*type:\s*'([^']+)'[^}]*dialog:\s*\{[^}]*speaker:\s*'李白'[^}]*content:\s*'([^']+)'[^}]*emotion:\s*'([^']+)'"
    
    matches = re.finditer(node_pattern, content, re.DOTALL)
    
    for match in matches:
        node_id = match.group(1)
        node_type = match.group(2)
        text = match.group(3)
        emotion = match.group(4)
        
        chapter = CHAPTER_MAP.get(node_id, "其他")
        
        nodes.append({
            "node_id": node_id,
            "type": node_type,
            "text": text,
            "emotion": emotion,
            "chapter": chapter,
        })
    
    return nodes

def generate_tts(text: str, output_path: str):
    """调用GPT-SoVITS API生成TTS"""
    try:
        params = {
            **MODEL_CONFIG,
            "text": text,
        }
        
        response = requests.get(API_URL, params=params, timeout=60)
        
        if response.status_code == 200:
            # 保存音频文件
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"✓ 生成成功: {output_path}")
            return True
        else:
            print(f"✗ 生成失败: {text[:30]}... - 状态码: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ 生成失败: {text[:30]}... - 错误: {e}")
        return False

def main():
    # 创建输出目录
    output_dir = Path("../tts_output/libai-story")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 解析故事文件
    print("正在解析故事文件...")
    nodes = parse_story_file()
    print(f"找到 {len(nodes)} 条李白的对话")
    
    # 生成TTS
    success_count = 0
    failed_count = 0
    
    for i, node in enumerate(nodes, 1):
        chapter = node["chapter"]
        node_id = node["node_id"]
        text = node["text"]
        emotion = node["emotion"]
        
        # 创建章节目录
        chapter_dir = output_dir / chapter
        chapter_dir.mkdir(exist_ok=True)
        
        # 生成文件名
        safe_node_id = re.sub(r'[^\w\-]', '_', node_id)
        filename = f"{i:03d}-{safe_node_id}-{emotion}.wav"
        output_path = chapter_dir / filename
        
        print(f"\n[{i}/{len(nodes)}] 生成: {node_id}")
        print(f"文本: {text[:50]}...")
        
        if generate_tts(text, str(output_path)):
            success_count += 1
        else:
            failed_count += 1
    
    print(f"\n\n生成完成!")
    print(f"成功: {success_count}/{len(nodes)}")
    print(f"失败: {failed_count}/{len(nodes)}")
    print(f"输出目录: {output_dir.absolute()}")

if __name__ == "__main__":
    main()

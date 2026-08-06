#!/usr/bin/env python3
"""
生成李白自由模式欢迎语音
使用 GPT-SoVITS 模型 - 优化版本
"""

import os
import sys
import requests
import wave

# 欢迎语文本 - 优化断句，确保"自由漫步"开头完整
# 将长文本分成多个短句，每句单独生成确保质量
TEXT_SEGMENTS = [
    "自由漫步？正合我意！",  # 第一句：确保开头完整
    "这成都城中，宽窄巷子有着，蓝buff般的悠然，",  # 第二句
    "太古里藏着，红buff般的热烈，",  # 第三句
    "武侯祠如防御塔守护千年风骨，",  # 第四句
    "凤凰山似高地水晶，见证热血。",  # 第五句
    "羁绊碎片散落各处，选手故事等你发掘。",  # 第六句
    "来，陪我饮尽这杯诗酒，再打一局！"  # 第七句
]

# 输出配置
OUTPUT_DIR = "../tts_output/libai-welcome"
FINAL_FILE = "free-mode-welcome.wav"

# GPT-SoVITS API 配置
API_URL = "http://localhost:9881/tts"

# 参考音频配置 - 根据你的实际文件调整
REFER_WAV_PATH = "../GPT-SoVITS/libai_output_1.wav"
PROMPT_TEXT = "少侠，欢迎来到锦官城！"

def check_reference_audio():
    """检查参考音频是否存在"""
    # 尝试多种可能的路径
    possible_paths = [
        REFER_WAV_PATH,
        "../参考音频/李白/reference.wav",
        "./参考音频/李白/reference.wav",
        "../GPT-SoVITS/reference.wav",
        "./GPT-SoVITS/reference.wav",
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"✅ 找到参考音频: {path}")
            return os.path.abspath(path)
    
    print("⚠️ 警告: 未找到参考音频文件，将使用默认路径")
    return REFER_WAV_PATH

def generate_segment(text, index, total):
    """生成单段语音"""
    try:
        print(f"\n🎙️ [{index+1}/{total}] 生成: {text}")
        
        # 构建请求
        payload = {
            "refer_wav_path": check_reference_audio(),
            "prompt_text": PROMPT_TEXT,
            "prompt_language": "zh",
            "text": text,
            "text_language": "zh",
            "speed": 1.2,
        }
        
        response = requests.post(API_URL, json=payload, timeout=300)
        
        if response.status_code == 200:
            segment_file = os.path.join(OUTPUT_DIR, f"segment_{index:02d}.wav")
            with open(segment_file, "wb") as f:
                f.write(response.content)
            file_size = len(response.content) / 1024
            print(f"   ✅ 成功 ({file_size:.1f} KB)")
            return segment_file
        else:
            print(f"   ❌ 失败: {response.status_code}")
            print(f"   错误: {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"   ❌ 错误: {e}")
        return None

def merge_wav_files(files, output_path):
    """合并多个 wav 文件"""
    try:
        print(f"\n🔄 正在合并 {len(files)} 个音频片段...")
        
        # 读取第一个文件获取格式信息
        with wave.open(files[0], 'rb') as w1:
            nchannels = w1.getnchannels()
            sampwidth = w1.getsampwidth()
            framerate = w1.getframerate()
            
        # 合并所有数据
        combined_data = b''
        for i, f in enumerate(files):
            with wave.open(f, 'rb') as w:
                data = w.readframes(w.getnframes())
                combined_data += data
                print(f"   片段 {i+1}: {len(data)/1024:.1f} KB")
        
        # 写入合并后的文件
        with wave.open(output_path, 'wb') as wout:
            wout.setnchannels(nchannels)
            wout.setsampwidth(sampwidth)
            wout.setframerate(framerate)
            wout.writeframes(combined_data)
        
        final_size = os.path.getsize(output_path) / 1024
        print(f"\n✅ 合并完成: {output_path} ({final_size:.1f} KB)")
        return True
        
    except Exception as e:
        print(f"❌ 合并失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def generate_tts():
    """生成完整语音"""
    print("=" * 60)
    print("🎙️ 李白自由模式欢迎语音生成")
    print("=" * 60)
    
    # 检查参考音频
    ref_path = check_reference_audio()
    
    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 清空旧的分段文件
    for f in os.listdir(OUTPUT_DIR):
        if f.startswith("segment_"):
            os.remove(os.path.join(OUTPUT_DIR, f))
            print(f"🗑️  删除旧文件: {f}")
    
    # 生成每个片段
    segment_files = []
    failed_segments = []
    
    for i, text in enumerate(TEXT_SEGMENTS):
        segment_file = generate_segment(text, i, len(TEXT_SEGMENTS))
        if segment_file:
            segment_files.append(segment_file)
        else:
            failed_segments.append((i, text))
            print(f"⚠️ 第 {i+1} 段生成失败，将跳过")
    
    if not segment_files:
        print("\n❌ 所有片段都生成失败！")
        return None
    
    if failed_segments:
        print(f"\n⚠️ 警告: {len(failed_segments)} 个片段生成失败")
        for idx, text in failed_segments:
            print(f"   - 片段 {idx+1}: {text}")
    
    # 合并片段
    final_path = os.path.join(OUTPUT_DIR, FINAL_FILE)
    if merge_wav_files(segment_files, final_path):
        print("\n" + "=" * 60)
        print(f"✅ 全部完成！")
        print(f"📁 最终文件: {final_path}")
        print(f"📊 成功生成: {len(segment_files)}/{len(TEXT_SEGMENTS)} 个片段")
        print("=" * 60)
        return final_path
    else:
        print("\n⚠️ 合并不成功，返回第一个片段")
        return segment_files[0] if segment_files else None

if __name__ == "__main__":
    result = generate_tts()
    sys.exit(0 if result else 1)

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单条TTS生成脚本 - 用于测试和调试

使用方法:
    python generate-single-tts.py "要生成的文本" --emotion happy --output test.wav

示例:
    python generate-single-tts.py "少侠，欢迎来到锦官城！" --emotion happy
"""

import argparse
import requests
import os
from pathlib import Path

# 默认配置
DEFAULT_API_URL = "http://localhost:9880"
DEFAULT_REFERENCE_AUDIO = "reference/libai_sample.wav"
DEFAULT_REFERENCE_TEXT = "人生得意须尽欢，莫使金樽空对月。"

# 情感参数
EMOTION_PARAMS = {
    "normal": {"speed": 1.0, "temperature": 0.7},
    "happy": {"speed": 1.1, "temperature": 0.75},
    "excited": {"speed": 1.15, "temperature": 0.8},
    "thoughtful": {"speed": 0.9, "temperature": 0.65},
    "sad": {"speed": 0.85, "temperature": 0.6}
}


def generate_tts(text: str, emotion: str = "normal", output_file: str = None, api_url: str = DEFAULT_API_URL):
    """生成单条TTS音频"""
    
    # 确定输出文件名
    if not output_file:
        # 根据文本前10个字符生成文件名
        safe_text = "".join(c for c in text[:10] if c.isalnum() or c in "_-")
        output_file = f"test_{emotion}_{safe_text}.wav"
    
    output_path = Path(output_file)
    
    print(f"🎵 正在生成音频...")
    print(f"   文本: {text[:50]}{'...' if len(text) > 50 else ''}")
    print(f"   情感: {emotion}")
    print(f"   输出: {output_path}")
    
    # 获取情感参数
    params = EMOTION_PARAMS.get(emotion, EMOTION_PARAMS["normal"])
    
    # 构建请求
    payload = {
        "refer_wav_path": DEFAULT_REFERENCE_AUDIO,
        "prompt_text": DEFAULT_REFERENCE_TEXT,
        "prompt_language": "zh",
        "text": text,
        "text_language": "zh",
        "how_to_cut": "凑四句一切",
        "top_k": 20,
        "top_p": 0.6,
        "temperature": params["temperature"],
        "speed": params["speed"],
    }
    
    try:
        response = requests.post(
            f"{api_url}/tts",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            # 保存音频
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            file_size = output_path.stat().st_size / 1024  # KB
            print(f"✅ 生成成功！")
            print(f"   文件大小: {file_size:.1f} KB")
            print(f"   保存位置: {output_path.absolute()}")
            return True
        else:
            print(f"❌ API错误: {response.status_code}")
            print(f"   响应: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 生成失败: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="生成单条TTS音频",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python generate-single-tts.py "少侠，欢迎来到锦官城！"
  python generate-single-tts.py "人生得意须尽欢" --emotion excited --output output.wav
  python generate-single-tts.py "测试文本" --api-url http://192.168.1.100:9880
        """
    )
    
    parser.add_argument("text", help="要合成的文本")
    parser.add_argument("--emotion", "-e", 
                       choices=["normal", "happy", "excited", "thoughtful", "sad"],
                       default="normal",
                       help="情感类型 (默认: normal)")
    parser.add_argument("--output", "-o",
                       help="输出文件名 (默认: 自动生成)")
    parser.add_argument("--api-url", "-a",
                       default=DEFAULT_API_URL,
                       help=f"GPT-SoVITS API地址 (默认: {DEFAULT_API_URL})")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("🎙️  单条TTS生成工具")
    print("=" * 50)
    
    success = generate_tts(args.text, args.emotion, args.output, args.api_url)
    
    print("=" * 50)
    if success:
        print("✨ 完成！")
    else:
        print("💥 失败，请检查错误信息")


if __name__ == "__main__":
    main()

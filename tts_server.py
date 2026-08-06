#!/usr/bin/env python3
# /Users/lsh/xiagu-xuncheng-project/tts_server.py
# 峡谷寻城记 - 李白TTS语音服务
# 基于GPT-SoVITS训练好的李白模型

import os
import sys
import hashlib
import time
import logging
import io
import numpy as np
import soundfile as sf
import torch
from pathlib import Path
from flask import Flask, request, send_file, jsonify

# ===================================================================
#  路径配置（根据你的实际情况）
# ===================================================================

# GPT-SoVITS 项目根目录
GPT_SOVITS_ROOT = "/Users/lsh/xiagu-xuncheng-project/GPT-SoVITS"

# 李白模型文件目录
MODEL_DIR = "/Users/lsh/xiagu-xuncheng-project/models/libai"

# 模型文件路径（使用最新训练的v3/v4模型）
GPT_MODEL_PATH = os.path.join(MODEL_DIR, "gpt_v4.ckpt")
SOVITS_MODEL_PATH = os.path.join(MODEL_DIR, "sovits_v3.pth")
REF_AUDIO_PATH = os.path.join(MODEL_DIR, "reference.wav")
REF_TEXT_PATH = os.path.join(MODEL_DIR, "reference_text.txt")

# 音频缓存目录
CACHE_DIR = "/Users/lsh/xiagu-xuncheng-project/tts_cache"

# ===================================================================
#  初始化
# ===================================================================

# 添加GPT-SoVITS到Python路径
sys.path.insert(0, GPT_SOVITS_ROOT)
sys.path.insert(0, os.path.join(GPT_SOVITS_ROOT, "GPT_SoVITS"))

# 切换工作目录（GPT-SoVITS内部可能依赖相对路径）
os.chdir(GPT_SOVITS_ROOT)

# 创建缓存目录
os.makedirs(CACHE_DIR, exist_ok=True)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("TTS")

# ===================================================================
#  加载模型（启动时只加载一次）
# ===================================================================

TTS_PIPELINE = None

def load_model():
    """加载李白TTS模型"""
    global TTS_PIPELINE
    
    logger.info("=" * 50)
    logger.info("  正在加载李白TTS模型...")
    logger.info(f"  GPT:    {os.path.basename(GPT_MODEL_PATH)} ({os.path.getsize(GPT_MODEL_PATH)/1024/1024:.0f}MB)")
    logger.info(f"  SoVITS: {os.path.basename(SOVITS_MODEL_PATH)} ({os.path.getsize(SOVITS_MODEL_PATH)/1024/1024:.0f}MB)")
    logger.info("=" * 50)
    
    start_time = time.time()
    
    try:
        from GPT_SoVITS.TTS_infer_pack.TTS import TTS, TTS_Config
    except ImportError as e:
        logger.error(f"导入GPT-SoVITS模块失败: {e}")
        logger.error(f"请确认GPT_SOVITS_ROOT路径正确: {GPT_SOVITS_ROOT}")
        sys.exit(1)
    
    # 强制使用 CPU 推理（最稳定，兼容性最好）
    device = "cpu"
    logger.info("  使用 CPU 模式（已关闭 GPU 加速）")
    
    # 查找配置文件
    config_candidates = [
        os.path.join(GPT_SOVITS_ROOT, "GPT_SoVITS", "configs", "tts_infer.yaml"),
        os.path.join(GPT_SOVITS_ROOT, "gpt-sovits-configs", "tts_infer.yaml"),
        os.path.join(GPT_SOVITS_ROOT, "configs", "tts_infer.yaml"),
    ]
    
    config_path = None
    for cp in config_candidates:
        if os.path.exists(cp):
            config_path = cp
            break
    
    if config_path:
        logger.info(f"  配置文件: {config_path}")
        tts_config = TTS_Config(config_path)
    else:
        logger.warning("  未找到配置文件，使用默认配置")
        tts_config = TTS_Config("")
    
    # 覆盖配置
    tts_config.device = device
    tts_config.is_half = False  # CPU 不支持半精度
    tts_config.t2s_weights_path = GPT_MODEL_PATH
    tts_config.vits_weights_path = SOVITS_MODEL_PATH
    
    # 设置版本（v3 SoVITS + v4 GPT 模型）
    try:
        tts_config.version = "v3"
        logger.info("  模型版本: v3 (sovits_v3 + gpt_v4)")
    except Exception as e:
        logger.warning(f"  无法设置v3版本: {e}，尝试自动检测")
        pass
    
    # 加载模型
    TTS_PIPELINE = TTS(tts_config)
    
    elapsed = time.time() - start_time
    logger.info(f"  ✅ 模型加载完成！device=cpu 耗时 {elapsed:.1f}s")
    logger.info("=" * 50)

# ===================================================================
#  读取参考文本
# ===================================================================

def get_reference_text():
    """读取参考音频对应的文字"""
    if os.path.exists(REF_TEXT_PATH):
        with open(REF_TEXT_PATH, "r", encoding="utf-8") as f:
            text = f.read().strip()
            if text:
                return text
    return "仰天大笑出门去"  # 默认值

REF_TEXT = get_reference_text()
logger.info(f"参考文本: {REF_TEXT}")

# ===================================================================
#  语音合成核心函数
# ===================================================================

def synthesize(
    text: str,
    speed: float = 1.1,
    top_k: int = 30,
    top_p: float = 0.75,
    temperature: float = 0.7,
    batch_size: int = 12,
    sample_steps: int = 4,
    split_interval: float = 0.3,
    repetition_penalty: float = 1.35,
) -> bytes:
    """
    将文本转为李白语音（CPU 极速模式，参数已降至最低）
    
    Args:
        text: 要合成的文字（建议 30 字以内）
        speed: 语速倍率 (默认1.1，与训练一致)
        top_k: 默认30（最小采样范围，极速推理）
        top_p: 默认0.75（收紧核采样）
        temperature: 默认0.7（低随机性，确定性输出）
        batch_size: 默认12（CPU 小批次）
        sample_steps: 采样步数，默认4（最低音质保真，最快速度）
        split_interval: 分段间隔，默认0.3秒
        repetition_penalty: 重复惩罚，默认1.35
    
    Returns:
        WAV格式的音频字节数据
    """
    if TTS_PIPELINE is None:
        raise RuntimeError("模型未加载")
    
    req = {
        "text": text,
        "text_lang": "zh",
        "ref_audio_path": REF_AUDIO_PATH,
        "prompt_text": REF_TEXT,
        "prompt_lang": "zh",
        "top_k": top_k,
        "top_p": top_p,
        "temperature": temperature,
        "text_split_method": "cut0",
        "batch_size": batch_size,
        "speed_factor": speed,
        "fragment_interval": split_interval,
        "seed": -1,
        "media_type": "wav",
        "parallel_infer": True,   # 开启并行推理，声码器批处理可减少总耗时
        "repetition_penalty": repetition_penalty,
    }
    
    # v3/v4模型支持sample_steps参数
    if sample_steps > 0:
        req["sample_steps"] = sample_steps
    
    # 运行推理
    result_gen = TTS_PIPELINE.run(req)
    
    # 收集音频数据
    all_audio = []
    sample_rate = 32000
    
    for sr, audio_data in result_gen:
        sample_rate = sr
        all_audio.append(audio_data)
    
    if not all_audio:
        raise RuntimeError("合成失败：无音频数据返回")
    
    final_audio = np.concatenate(all_audio)
    
    # 转为WAV字节流
    buffer = io.BytesIO()
    sf.write(buffer, final_audio, sample_rate, format='WAV')
    buffer.seek(0)
    
    return buffer.read()

# ===================================================================
#  缓存机制
# ===================================================================

def cache_key(text: str, params: dict) -> str:
    """生成缓存Key（包含所有推理参数）"""
    key_data = f"{text}|" + "|".join(f"{k}={v}" for k, v in sorted(params.items()))
    return hashlib.md5(key_data.encode('utf-8')).hexdigest()

def get_cached(text: str, params: dict):
    """尝试读取缓存"""
    key = cache_key(text, params)
    path = os.path.join(CACHE_DIR, f"{key}.wav")
    if os.path.exists(path):
        with open(path, 'rb') as f:
            return f.read()
    return None

def save_cache(text: str, audio_data: bytes, params: dict):
    """保存到缓存"""
    key = cache_key(text, params)
    path = os.path.join(CACHE_DIR, f"{key}.wav")
    with open(path, 'wb') as f:
        f.write(audio_data)

# ===================================================================
#  Flask API 服务
# ===================================================================

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        "status": "ok",
        "model": "libai_trained",
        "device": "cpu",
        "cache_count": len(list(Path(CACHE_DIR).glob("*.wav")))
    })

@app.route('/tts', methods=['POST'])
def tts():
    """
    文本转语音接口（支持完整推理参数）
    
    Request:
        POST /tts
        Content-Type: application/json
        {
            "text": "要合成的文字",
            "speed": 1.1,
            "top_k": 90,
            "top_p": 1.0,
            "temperature": 1.0,
            "batch_size": 60,
            "sample_steps": 16,
            "split_interval": 0.3,
            "repetition_penalty": 1.7
        }
    
    Response:
        audio/wav 音频数据
    """
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "text参数必填"}), 400
    
    text = data['text'].strip()
    if not text:
        return jsonify({"error": "text不能为空"}), 400
    
    # 限制长度（太长会很慢）
    if len(text) > 200:
        text = text[:200]
    
    # 提取推理参数（CPU 极速默认值）
    params = {
        'speed': float(data.get('speed', 1.1)),
        'top_k': int(data.get('top_k', 30)),
        'top_p': float(data.get('top_p', 0.75)),
        'temperature': float(data.get('temperature', 0.7)),
        'batch_size': int(data.get('batch_size', 12)),
        'sample_steps': int(data.get('sample_steps', 4)),
        'split_interval': float(data.get('split_interval', 0.3)),
        'repetition_penalty': float(data.get('repetition_penalty', 1.35)),
    }
    
    # 检查缓存
    cached = get_cached(text, params)
    if cached:
        logger.info(f"[缓存命中] speed={params['speed']} {text[:30]}...")
        return send_file(
            io.BytesIO(cached),
            mimetype='audio/wav',
            as_attachment=False
        )
    
    # 合成语音
    try:
        start_time = time.time()
        audio_data = synthesize(text, **params)
        elapsed = time.time() - start_time
        
        logger.info(f"[合成完成] speed={params['speed']} {text[:30]}... ({elapsed:.1f}s, {len(audio_data)/1024:.0f}KB)")
        
        # 保存缓存
        save_cache(text, audio_data, params)
        
        return send_file(
            io.BytesIO(audio_data),
            mimetype='audio/wav',
            as_attachment=False
        )
        
    except Exception as e:
        logger.error(f"[合成失败] {text[:30]}... 错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/tts/batch', methods=['POST'])
def tts_batch():
    """
    批量预生成接口（支持完整推理参数）
    
    Request:
        POST /tts/batch
        {
            "texts": ["文本1", "文本2", ...],
            "speed": 1.1,
            "top_k": 90,
            "top_p": 1.0,
            "temperature": 1.0,
            "batch_size": 60,
            "sample_steps": 16,
            "split_interval": 0.3,
            "repetition_penalty": 1.7
        }
    """
    data = request.json
    texts = data.get('texts', [])
    
    # 提取推理参数（CPU 极速默认值）
    params = {
        'speed': float(data.get('speed', 1.1)),
        'top_k': int(data.get('top_k', 30)),
        'top_p': float(data.get('top_p', 0.75)),
        'temperature': float(data.get('temperature', 0.7)),
        'batch_size': int(data.get('batch_size', 12)),
        'sample_steps': int(data.get('sample_steps', 4)),
        'split_interval': float(data.get('split_interval', 0.3)),
        'repetition_penalty': float(data.get('repetition_penalty', 1.35)),
    }
    
    results = []
    for i, text in enumerate(texts):
        try:
            cached = get_cached(text, params)
            if cached:
                results.append({"index": i, "text": text[:20], "status": "cached"})
                continue
            
            audio_data = synthesize(text, **params)
            save_cache(text, audio_data, params)
            results.append({"index": i, "text": text[:20], "status": "generated"})
            logger.info(f"[批量 {i+1}/{len(texts)}] speed={params['speed']} {text[:20]}... ✅")
            
            time.sleep(0.5)  # 防止Mac过热
            
        except Exception as e:
            results.append({"index": i, "text": text[:20], "status": "failed", "error": str(e)})
            logger.error(f"[批量 {i+1}/{len(texts)}] speed={params['speed']} {text[:20]}... ❌ {e}")
    
    return jsonify({"results": results})

@app.route('/tts/cache/clear', methods=['POST'])
def clear_cache():
    """清除缓存"""
    import glob
    files = glob.glob(os.path.join(CACHE_DIR, "*.wav"))
    for f in files:
        os.remove(f)
    return jsonify({"cleared": len(files)})

@app.route('/tts/cache/status', methods=['GET'])
def cache_status():
    """缓存状态"""
    files = list(Path(CACHE_DIR).glob("*.wav"))
    total_size = sum(f.stat().st_size for f in files)
    return jsonify({
        "count": len(files),
        "total_size_mb": round(total_size / 1024 / 1024, 2)
    })

# ===================================================================
#  启动
# ===================================================================

if __name__ == '__main__':
    print()
    print("╔══════════════════════════════════════════════╗")
    print("║      峡谷寻城记 · 李白TTS语音服务            ║")
    print("║      GPT-SoVITS 训练模型                     ║")
    print("╚══════════════════════════════════════════════╝")
    print()
    
    # 加载模型（启动时一次性加载）
    load_model()
    
    print()
    print(f"  参考文本: {REF_TEXT}")
    print(f"  缓存目录: {CACHE_DIR}")
    print()
    print("  API接口:")
    print("    POST /tts          → 文本转语音")
    print("    POST /tts/batch    → 批量预生成")
    print("    GET  /health       → 健康检查")
    print("    GET  /tts/cache/status → 缓存状态")
    print()
    
    # 启动Flask（端口9881）
    app.run(host='127.0.0.1', port=9881, debug=False, threaded=False)
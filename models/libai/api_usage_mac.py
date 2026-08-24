import os
import sys
import soundfile as sf
import torch

# ================= 配置区域 =================
# 1. GPT-SoVITS 代码库的路径 (Mac上该项目的根目录)
# 使用相对于本脚本文件的路径，确保无论从哪运行都能找到
# 本脚本位置: /Users/lsh/服创代码/models/libai/api_usage_mac.py
# GPT-SoVITS 位置: /Users/lsh/服创代码/GPT-SoVITS/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GPT_SOVITS_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../GPT-SoVITS"))

# 2. 模型路径 (使用最新训练的 v3/v4 模型)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
GPT_MODEL_PATH = os.path.join(CURRENT_DIR, "gpt_v4.ckpt")
SOVITS_MODEL_PATH = os.path.join(CURRENT_DIR, "sovits_v3.pth")
REF_AUDIO_PATH = os.path.join(CURRENT_DIR, "reference.wav")
REF_TEXT_PATH = os.path.join(CURRENT_DIR, "reference_text.txt")

# ===========================================

# 添加路径到系统变量，以便导入 GPT_SoVITS 模块
if GPT_SOVITS_ROOT not in sys.path:
    sys.path.append(GPT_SOVITS_ROOT)
    sys.path.append(os.path.join(GPT_SOVITS_ROOT, "GPT_SoVITS"))

try:
    from GPT_SoVITS.TTS_infer_pack.TTS import TTS, TTS_Config
except ImportError:
    print("错误：无法导入 GPT_SoVITS 模块。")
    print(f"请检查 GPT_SOVITS_ROOT 路径是否正确：{GPT_SOVITS_ROOT}")
    exit(1)

def load_model():
    print(f"正在加载模型...\nGPT: {os.path.basename(GPT_MODEL_PATH)}\nSoVITS: {os.path.basename(SOVITS_MODEL_PATH)}")
    
    # 初始化配置
    # 注意：Mac M系列芯片使用 "mps" 或者是 "cpu"，不支持 "cuda"
    device = "cpu"
    if torch.backends.mps.is_available():
        device = "mps"
        print("检测到 Mac MPS 加速，已启用。")
    elif torch.cuda.is_available():
        device = "cuda" # 万一在 Windows 跑也能兼容易
    else:
        print("未检测到加速设备，使用 CPU。")

    # 使用 GPT-SoVITS 内置的默认配置文件
    config_path = os.path.join(GPT_SOVITS_ROOT, "GPT_SoVITS/configs/tts_infer.yaml")
    tts_config = TTS_Config(config_path)
    
    # 强制覆盖配置
    tts_config.device = device
    tts_config.is_half = False # Mac MPS 通常不支持半精度(float16)或者是支持不好，建议用 float32
    if device == "cuda":
        tts_config.is_half = True
        
    tts_config.t2s_weights_path = GPT_MODEL_PATH
    tts_config.vits_weights_path = SOVITS_MODEL_PATH
    tts_config.version = "v3" # v3 SoVITS + v4 GPT 模型
    
    tts_pipeline = TTS(tts_config)
    return tts_pipeline

def run_tts(tts_pipeline, text, output_filename="output.wav", speed=1.1):
    # 读取参考音频文本
    ref_text = "人生得意须尽欢，莫使金樽空对月。"
    if os.path.exists(REF_TEXT_PATH):
        with open(REF_TEXT_PATH, "r", encoding="utf-8") as f:
            ref_text = f.read().strip()

    # 推理参数（与训练时保持一致）
    req = {
        "text": text,
        "text_lang": "zh",
        "ref_audio_path": REF_AUDIO_PATH,
        "prompt_text": ref_text,
        "prompt_lang": "zh",
        "top_k": 90,
        "top_p": 1,
        "temperature": 1,
        "text_split_method": "cut0",
        "batch_size": 60,
        "speed_factor": speed,
        "fragment_interval": 0.3,
        "seed": -1,
        "media_type": "wav",
        "parallel_infer": True,
        "repetition_penalty": 1.7,
        "sample_steps": 32,  # 仅v3/v4生效
    }
    
    print(f"正在合成: {text} ...")
    try:
        # 运行推理
        result_gen = tts_pipeline.run(req)
        
        # 收集音频数据
        all_audio_data = []
        sample_rate = 32000
        
        for sr, audio_data in result_gen:
            sample_rate = sr
            all_audio_data.append(audio_data)
        
        import numpy as np
        if not all_audio_data:
            print("生成失败：无音频数据返回")
            return

        final_audio = np.concatenate(all_audio_data)
        
        # 保存文件
        sf.write(output_filename, final_audio, sample_rate)
        print(f"成功！音频已保存至: {output_filename}")
        
    except Exception as e:
        print(f"合成出错: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # 1. 加载模型
    pipeline = load_model()
    
    # 2. 定义要生成的文本
    texts = [
        "君不见黄河之水天上来，奔流到海不复回。",
        "人生得意须尽欢，莫使金樽空对月。"
    ]
    
    # 3. 批量生成（保存到脚本所在目录）
    for i, text in enumerate(texts):
        output_path = os.path.join(CURRENT_DIR, f"libai_output_{i+1}.wav")
        run_tts(pipeline, text, output_filename=output_path)

#!/bin/bash
# /Users/lsh/服创代码/start_tts.sh
# 一键启动李白TTS服务

echo "╔══════════════════════════════════════════════╗"
echo "║      峡谷寻城记 · 李白TTS语音服务            ║"
echo "╚══════════════════════════════════════════════╝"

# 激活conda环境
source ~/miniconda3/etc/profile.d/conda.sh
conda activate sovits

# Mac M4优化
# 强制禁用MPS，使用CPU（避免CUDA模型加载到MPS的兼容性问题）
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0
export TOKENIZERS_PARALLELISM=false

# 启动TTS服务
cd /Users/lsh/服创代码
python tts_server.py
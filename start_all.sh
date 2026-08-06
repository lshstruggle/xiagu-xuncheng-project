#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║         峡谷寻城记 · 全服务一键启动               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ===== 1. 启动MongoDB =====
echo "[1/4] 启动 MongoDB..."
if docker ps | grep -q mongo; then
    echo "  ✅ MongoDB 已在运行"
else
    docker start mongo 2>/dev/null || docker run -d -p 27017:27017 --name mongo mongo:7.0
    echo "  ✅ MongoDB 已启动"
fi

# ===== 2. 启动Redis =====
echo "[2/4] 启动 Redis..."
if docker ps | grep -q redis; then
    echo "  ✅ Redis 已在运行"
else
    docker start redis 2>/dev/null || docker run -d -p 6379:6379 --name redis redis:7-alpine
    echo "  ✅ Redis 已启动"
fi

# ===== 3. 启动TTS服务 =====
echo "[3/4] 启动李白TTS服务（约20秒加载模型）..."
source ~/miniconda3/etc/profile.d/conda.sh
conda activate sovits
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0

cd /Users/lsh/xiagu-xuncheng-project
python tts_server.py &
TTS_PID=$!
echo "  TTS PID: $TTS_PID"

# 等待TTS就绪
echo "  等待模型加载..."
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:9881/health > /dev/null 2>&1; then
        echo "  ✅ TTS服务就绪"
        break
    fi
    sleep 2
    echo "  等待中... ($((i*2))s)"
done

# ===== 4. 启动Go后端 =====
echo "[4/4] 启动Go后端..."
cd /Users/lsh/xiagu-xuncheng-project/xiagu-server
go run ./cmd/server &
GO_PID=$!
sleep 3

if curl -s http://127.0.0.1:8080/health > /dev/null 2>&1; then
    echo "  ✅ Go后端就绪"
else
    echo "  ⚠️ Go后端启动中..."
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ 所有服务已启动                                ║"
echo "║                                                  ║"
echo "║  MongoDB:  localhost:27017                       ║"
echo "║  Redis:    localhost:6379                        ║"
echo "║  TTS:      http://localhost:9881                 ║"
echo "║  Go后端:   http://localhost:8080                 ║"
echo "║                                                  ║"
echo "║  测试: curl http://localhost:8080/health         ║"
echo "║                                                  ║"
echo "║  给体验版用户用？另开终端运行:                      ║"
echo "║  ngrok http 8080                                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 清理函数
trap "echo '正在停止服务...'; kill $TTS_PID $GO_PID 2>/dev/null; echo '✅ 服务已停止'" EXIT

# 前台等待
wait

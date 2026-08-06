#!/bin/bash
# 数据初始化脚本
# 用于导入演示数据到MongoDB

set -e

echo "=========================================="
echo "🚀 峡谷寻城记 - 数据初始化"
echo "=========================================="

# 检查MongoDB是否可用
echo "⏳ 等待MongoDB启动..."
until mongosh --host mongodb --eval "print('MongoDB is ready')" 2>/dev/null; do
    sleep 2
done

echo "✅ MongoDB已就绪"

# 导入演示数据
echo ""
echo "📊 导入演示数据..."

# 使用Python脚本导入数据
cd /app/scripts
python3 import_frontend_data.py

echo ""
echo "=========================================="
echo "✅ 数据初始化完成！"
echo "=========================================="

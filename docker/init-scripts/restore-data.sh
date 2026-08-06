#!/bin/bash
# 数据库恢复脚本 - 用于评委Demo环境初始化

echo "=========================================="
echo "🗄️  峡谷寻城记 - 数据库数据恢复"
echo "=========================================="

# 等待MongoDB就绪
echo "⏳ 等待MongoDB启动..."
until mongosh --host localhost --eval "print('MongoDB is ready')" 2>/dev/null; do
    sleep 2
done
echo "✅ MongoDB已就绪"

# 恢复数据
echo ""
echo "📥 恢复数据..."

# 使用mongorestore恢复所有数据
mongorestore --db xiagu_xuncheng --drop /docker-entrypoint-initdb.d/mongodb-backup/xiagu_xuncheng/

echo ""
echo "=========================================="
echo "✅ 数据恢复完成！"
echo "=========================================="

# 显示统计
mongosh xiagu_xuncheng --eval "
print('\\n📊 数据恢复统计:');
print('  POI: ' + db.pois.countDocuments() + ' 个');
print('  路线: ' + db.routes.countDocuments() + ' 条');
print('  用户: ' + db.users.countDocuments() + ' 个');
print('  彩蛋: ' + db.easter_eggs.countDocuments() + ' 个');
print('  商户: ' + db.merchants.countDocuments() + ' 个');
print('  优惠券: ' + db.coupon_definitions.countDocuments() + ' 个');
"

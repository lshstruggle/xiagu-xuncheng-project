// MongoDB初始化脚本
// 创建数据库和集合索引

db = db.getSiblingDB('xiagu_xuncheng');

// ========== 创建集合和索引 ==========

// 创建POI集合
if (!db.getCollectionNames().includes('pois')) {
    db.createCollection('pois');
    db.pois.createIndex({ location: "2dsphere" });
    db.pois.createIndex({ city_code: 1, type: 1 });
    db.pois.createIndex({ status: 1 });
    print("✅ 创建 pois 集合和索引");
}

// 创建路线集合
if (!db.getCollectionNames().includes('routes')) {
    db.createCollection('routes');
    db.routes.createIndex({ city_code: 1 });
    db.routes.createIndex({ status: 1 });
    print("✅ 创建 routes 集合和索引");
}

// 创建用户集合
if (!db.getCollectionNames().includes('users')) {
    db.createCollection('users');
    db.users.createIndex({ openid: 1 }, { unique: true });
    print("✅ 创建 users 集合和索引");
}

// 创建打卡记录集合
if (!db.getCollectionNames().includes('checkins')) {
    db.createCollection('checkins');
    db.checkins.createIndex({ user_id: 1, poi_id: 1 });
    db.checkins.createIndex({ checkin_at: -1 });
    print("✅ 创建 checkins 集合和索引");
}

// 创建彩蛋集合
if (!db.getCollectionNames().includes('easter_eggs')) {
    db.createCollection('easter_eggs');
    db.easter_eggs.createIndex({ city_code: 1 });
    print("✅ 创建 easter_eggs 集合和索引");
}

// 创建商户集合
if (!db.getCollectionNames().includes('merchants')) {
    db.createCollection('merchants');
    db.merchants.createIndex({ status: 1 });
    print("✅ 创建 merchants 集合和索引");
}

// 创建优惠券定义集合
if (!db.getCollectionNames().includes('coupon_definitions')) {
    db.createCollection('coupon_definitions');
    db.coupon_definitions.createIndex({ status: 1 });
    print("✅ 创建 coupon_definitions 集合和索引");
}

// 创建AI会话集合
if (!db.getCollectionNames().includes('ai_sessions')) {
    db.createCollection('ai_sessions');
    db.ai_sessions.createIndex({ user_id: 1 });
    db.ai_sessions.createIndex({ updated_at: -1 });
    print("✅ 创建 ai_sessions 集合和索引");
}

print("✅ MongoDB初始化完成！");
print("📢 注意：完整数据请使用 mongorestore 恢复");

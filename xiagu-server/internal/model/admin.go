package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// AdminUser 管理员账户
type AdminUser struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username     string             `bson:"username" json:"username"`               // 登录账号
	PasswordHash string             `bson:"password_hash" json:"-"`                 // 密码哈希
	Nickname     string             `bson:"nickname" json:"nickname"`               // 显示名
	Avatar       string             `bson:"avatar" json:"avatar"`                   // 头像
	Role         string             `bson:"role" json:"role"`                       // super_admin
	WechatOpenID string             `bson:"wechat_openid,omitempty" json:"-"`       // 绑定的微信
	LastLoginAt  time.Time          `bson:"last_login_at" json:"last_login_at"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
}

// Merchant 商户模型
type Merchant struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`               // 商户名称
	Logo        string             `bson:"logo" json:"logo"`               // Logo图片URL
	Contact     string             `bson:"contact" json:"contact"`         // 联系人
	Phone       string             `bson:"phone" json:"phone"`             // 联系电话
	Address     string             `bson:"address" json:"address"`         // 详细地址
	Category    string             `bson:"category" json:"category"`       // 经营类目（餐饮/住宿/文创等）
	OpenTime    string             `bson:"open_time" json:"openTime"`      // 营业时间
	Description string             `bson:"description" json:"description"` // 商户简介
	Status      string             `bson:"status" json:"status"`           // active/inactive
	CreatedAt   time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updatedAt"`
}

// CouponDefinition 优惠券定义（模板）
type CouponDefinition struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name          string             `bson:"name" json:"name"`                     // 券名称
	Type          string             `bson:"type" json:"type"`                     // coupon/exchange/experience
	SubType       string             `bson:"sub_type" json:"subType"`              // red/blue/hotel/esports
	Image         string             `bson:"image" json:"image"`                   // 券面图片
	
	// 优惠内容
	DiscountType  string             `bson:"discount_type" json:"discountType"`    // discount/amount/exchange
	DiscountValue string             `bson:"discount_value" json:"discountValue"`  // 9折/满100减20/免费兑换
	
	// 使用限制
	MinAmount     float64            `bson:"min_amount,omitempty" json:"minAmount"` // 最低消费
	ValidDays     int                `bson:"valid_days" json:"validDays"`           // 有效期天数
	UsageLimit    int                `bson:"usage_limit" json:"usageLimit"`         // 每人限领
	TotalLimit    int                `bson:"total_limit" json:"totalLimit"`         // 总发放数量
	IssuedCount   int                `bson:"issued_count" json:"issuedCount"`       // 已发放数量
	UsedCount     int                `bson:"used_count" json:"usedCount"`           // 已使用数量
	
	// 关联
	MerchantID    string             `bson:"merchant_id,omitempty" json:"merchantId"` // 关联商户
	POIIDs        []string           `bson:"poi_ids,omitempty" json:"poiIds"`         // 适用POI
	
	Description   string             `bson:"description" json:"description"` // 使用说明
	Status        string             `bson:"status" json:"status"`           // active/inactive
	CreatedAt     time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updatedAt"`
}

// POITypeConfig POI类型配置（动态）
type POITypeConfig struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TypeCode    string             `bson:"type_code" json:"type_code"`      // blue_buff/red_buff/tower
	TypeName    string             `bson:"type_name" json:"type_name"`      // 蓝Buff/红Buff
	Icon        string             `bson:"icon" json:"icon"`                // 图标
	Color       string             `bson:"color" json:"color"`              // 主题色
	Description string             `bson:"description" json:"description"`  // 类型说明
	IsActive    bool               `bson:"is_active" json:"is_active"`      // 是否启用
	SortOrder   int                `bson:"sort_order" json:"sort_order"`    // 排序
}

// DashboardStats 数据看板统计
type DashboardStats struct {
	TodayActiveUsers int                `json:"today_active_users"`
	TodayCheckins    int                `json:"today_checkins"`
	TotalUsers       int64              `json:"total_users"`
	CouponUsageRate  float64            `json:"coupon_usage_rate"`
	Trends           []TrendData        `json:"trends"`
	HotPois          []HotPOIData       `json:"hot_pois"`
}

type TrendData struct {
	Date      string `json:"date"`
	Checkins  int    `json:"checkins"`
	NewUsers  int    `json:"new_users"`
}

type HotPOIData struct {
	POIID    string `json:"poi_id"`
	POIName  string `json:"poi_name"`
	Count    int    `json:"count"`
}

// AdminLoginLog 管理员登录日志
type AdminLoginLog struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	AdminID   string             `bson:"admin_id" json:"admin_id"`
	Username  string             `bson:"username" json:"username"`
	IP        string             `bson:"ip" json:"ip"`
	UserAgent string             `bson:"user_agent" json:"user_agent"`
	Success   bool               `bson:"success" json:"success"`
	FailReason string            `bson:"fail_reason,omitempty" json:"fail_reason,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

// AdminOperationLog 管理员操作日志
type AdminOperationLog struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	AdminID    string             `bson:"admin_id" json:"admin_id"`
	Username   string             `bson:"username" json:"username"`
	Action     string             `bson:"action" json:"action"`           // create/update/delete
	Resource   string             `bson:"resource" json:"resource"`       // poi/merchant/coupon
	ResourceID string             `bson:"resource_id" json:"resource_id"`
	Details    string             `bson:"details" json:"details"`
	IP         string             `bson:"ip" json:"ip"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
}

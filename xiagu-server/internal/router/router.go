package router

import (
	"github.com/gin-gonic/gin"

	"xiagu-server/internal/handler"
	"xiagu-server/internal/middleware"
)

func Setup(r *gin.Engine, h *handler.Handlers) {

	v1 := r.Group("/api/v1")

	// 公开接口
	v1.POST("/user/login", h.User.Login)

	// ===== 管理员接口（新增）=====
	adminHandler := handler.NewAdminHandler()
	poiAdminHandler := handler.NewPOIAdminHandler(h.DB)
	merchantAdminHandler := handler.NewMerchantAdminHandler(h.DB)
	couponAdminHandler := handler.NewCouponAdminHandler(h.DB)
	userAdminHandler := handler.NewUserAdminHandler(h.DB)
	routeAdminHandler := handler.NewRouteAdminHandler(h.DB)
	easterEggAdminHandler := handler.NewEasterEggAdminHandler(h.DB)

	// 管理员登录（公开）
	v1.POST("/admin/login", adminHandler.Login)

	// 管理员接口组（需要管理员认证）
	admin := v1.Group("/admin")
	admin.Use(middleware.AdminAuth())
	{
		// 认证
		admin.POST("/logout", adminHandler.Logout)
		admin.GET("/profile", adminHandler.GetProfile)

		// 数据统计
		admin.GET("/stats/dashboard", adminHandler.GetDashboardStats)
		admin.GET("/stats/trends", adminHandler.GetTrends)
		admin.GET("/stats/hot-pois", adminHandler.GetHotPois)

		// 文件上传
		admin.POST("/upload/image", adminHandler.UploadImage)

		// POI管理
		admin.GET("/pois", poiAdminHandler.GetPOIList)
		admin.POST("/pois", poiAdminHandler.CreatePOI)
		admin.GET("/pois/:id", poiAdminHandler.GetPOIDetail)
		admin.PUT("/pois/:id", poiAdminHandler.UpdatePOI)
		admin.DELETE("/pois/:id", poiAdminHandler.DeletePOI)

		// POI类型配置
		admin.GET("/poi-types", poiAdminHandler.GetPOITypes)

		// 商户管理
		admin.GET("/merchants", merchantAdminHandler.GetMerchantList)
		admin.GET("/merchants/all", merchantAdminHandler.GetAllMerchants)
		admin.POST("/merchants", merchantAdminHandler.CreateMerchant)
		admin.GET("/merchants/:id", merchantAdminHandler.GetMerchantDetail)
		admin.PUT("/merchants/:id", merchantAdminHandler.UpdateMerchant)
		admin.DELETE("/merchants/:id", merchantAdminHandler.DeleteMerchant)
		admin.GET("/merchants/:id/pois", merchantAdminHandler.GetMerchantRelatedPOIs)

		// 优惠券管理
		admin.GET("/coupons", couponAdminHandler.GetCouponList)
		admin.POST("/coupons", couponAdminHandler.CreateCoupon)
		admin.GET("/coupons/:id", couponAdminHandler.GetCouponDetail)
		admin.PUT("/coupons/:id", couponAdminHandler.UpdateCoupon)
		admin.DELETE("/coupons/:id", couponAdminHandler.DeleteCoupon)
		admin.GET("/coupons/stats", couponAdminHandler.GetCouponStats)
		admin.POST("/coupons/:id/issue", couponAdminHandler.IssueCouponToUser)

		// 用户管理
		admin.GET("/users", userAdminHandler.GetUserList)
		admin.GET("/users/:id", userAdminHandler.GetUserDetail)
		admin.POST("/users/:id/ban", userAdminHandler.BanUser)
		admin.POST("/users/:id/unban", userAdminHandler.UnbanUser)
		admin.GET("/users/:id/coupons", userAdminHandler.GetUserCoupons)
		admin.GET("/users/:id/checkins", userAdminHandler.GetUserCheckins)
		admin.GET("/users/stats", userAdminHandler.GetUserStats)

		// 路线管理
		admin.GET("/routes", routeAdminHandler.GetRouteList)
		admin.POST("/routes", routeAdminHandler.CreateRoute)
		admin.GET("/routes/:id", routeAdminHandler.GetRouteDetail)
		admin.PUT("/routes/:id", routeAdminHandler.UpdateRoute)
		admin.DELETE("/routes/:id", routeAdminHandler.DeleteRoute)
		admin.PUT("/routes/:id/poi-sequence", routeAdminHandler.UpdateRoutePOISequence)

		// 彩蛋管理
		admin.GET("/easter-eggs", easterEggAdminHandler.GetEasterEggList)
		admin.POST("/easter-eggs", easterEggAdminHandler.CreateEasterEgg)
		admin.GET("/easter-eggs/:id", easterEggAdminHandler.GetEasterEggDetail)
		admin.PUT("/easter-eggs/:id", easterEggAdminHandler.UpdateEasterEgg)
		admin.DELETE("/easter-eggs/:id", easterEggAdminHandler.DeleteEasterEgg)
		admin.GET("/easter-eggs/stats", easterEggAdminHandler.GetEasterEggStats)
	}

	// 需要登录
	auth := v1.Group("")
	auth.Use(middleware.Auth())
	{
		// 用户
		auth.GET("/user/profile", h.User.GetProfile)
		auth.PUT("/user/hero", h.User.SelectHero)

		// POI
		auth.GET("/poi/list", h.POI.GetList)
		auth.GET("/poi/nearby", h.POI.GetNearby)
		auth.GET("/poi/:id", h.POI.GetDetail)
		auth.GET("/route/list", h.POI.GetRoutes)

		// AI对话（核心：元器+TTS联动）
		auth.POST("/ai/chat", h.AI.Chat)

		// 打卡
		auth.POST("/checkin", h.Checkin.DoCheckin)

		// TTS
		auth.POST("/tts", h.TTS.Synthesize)
		auth.GET("/tts/health", h.TTS.HealthCheck)

		// 彩蛋系统
		auth.GET("/easter-eggs", h.EasterEgg.GetEasterEggs)
		auth.GET("/easter-eggs/nearby", h.EasterEgg.GetNearbyEasterEggs)
		auth.GET("/easter-eggs/:id", h.EasterEgg.GetEasterEggByID)
		auth.POST("/easter-eggs/collect", h.EasterEgg.CollectEasterEgg)
		auth.GET("/users/:user_id/easter-eggs", h.EasterEgg.GetUserEasterEggCollection)

		// 回忆模式语音
		auth.GET("/memory-tts", h.MemoryTTS.GetMemoryTTSList)
		auth.GET("/memory-tts/:id", h.MemoryTTS.GetMemoryTTSByID)
		auth.GET("/memory-tts/:id/audio", h.MemoryTTS.GetMemoryTTSAudio)
		auth.GET("/memory-tts/:id/play", h.MemoryTTS.PlayMemoryTTS)

		// 用户资产
		auth.GET("/user/assets", h.User.GetAssets)

		// 商城
		auth.GET("/shop/items", h.Shop.GetItems)
		auth.POST("/shop/exchange", h.Shop.ExchangeItem)

		// 羁绊系统
		auth.GET("/bond/heroes", h.Bond.GetHeroBonds)

		// 实体周边订单
		auth.POST("/merch/order", h.Merch.SubmitOrder)
	}
}

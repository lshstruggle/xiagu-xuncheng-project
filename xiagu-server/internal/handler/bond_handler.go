package handler

import (
	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
	"xiagu-server/pkg/util"
)

type BondHandler struct {
	svcs *service.Services
}

func NewBondHandler(svcs *service.Services) *BondHandler {
	return &BondHandler{svcs: svcs}
}

// GetHeroBonds 获取用户所有英雄的羁绊数据
func (h *BondHandler) GetHeroBonds(c *gin.Context) {
	userID := c.GetString("user_id")
	user, err := h.svcs.User.GetProfile(c.Request.Context(), userID)
	if err != nil {
		util.NotFound(c, "用户不存在")
		return
	}

	// 构建英雄羁绊列表（固定返回李白和诸葛亮）
	type heroBondResp struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		Avatar    string `json:"avatar"`
		BondValue int    `json:"bond_value"`
		Level     int    `json:"bond_level"`
	}

	heroMap := map[string]heroBondResp{
		"libai": {
			ID:     "libai",
			Name:   "李白",
			Avatar: "https://game.gtimg.cn/images/yxzj/img201606/heroimg/131/131.jpg",
		},
		"zhuge": {
			ID:     "zhuge",
			Name:   "诸葛亮",
			Avatar: "https://game.gtimg.cn/images/yxzj/img201606/heroimg/190/190.jpg",
		},
	}

	var result []heroBondResp
	for id, hero := range heroMap {
		if bond, ok := user.HeroBonds[id]; ok {
			hero.BondValue = bond.BondValue
			hero.Level = service.BondLevel(bond.BondValue)
		} else {
			hero.BondValue = 0
			hero.Level = 1
		}
		result = append(result, hero)
	}

	util.OK(c, result)
}

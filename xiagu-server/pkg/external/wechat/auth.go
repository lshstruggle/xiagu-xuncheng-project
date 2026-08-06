package wechat

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Auth struct {
	appID     string
	appSecret string
}

type SessionResp struct {
	OpenID     string `json:"openid"`
	SessionKey string `json:"session_key"`
	UnionID    string `json:"unionid"`
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
}

func NewAuth(appID, appSecret string) *Auth {
	return &Auth{appID: appID, appSecret: appSecret}
}

func (a *Auth) Code2Session(ctx context.Context, code string) (*SessionResp, error) {
	url := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
		a.appID, a.appSecret, code,
	)

	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result SessionResp
	json.Unmarshal(body, &result)

	if result.ErrCode != 0 {
		return nil, fmt.Errorf("微信登录失败: %d %s", result.ErrCode, result.ErrMsg)
	}
	return &result, nil
}

package wechat

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const code2SessionEndpoint = "https://api.weixin.qq.com/sns/jscode2session"

type Auth struct {
	appID     string
	appSecret string
	endpoint  string
	client    *http.Client
}

type SessionResp struct {
	OpenID     string `json:"openid"`
	SessionKey string `json:"session_key"`
	UnionID    string `json:"unionid"`
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
}

func NewAuth(appID, appSecret string) *Auth {
	return &Auth{
		appID:     appID,
		appSecret: appSecret,
		endpoint:  code2SessionEndpoint,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (a *Auth) Code2Session(
	ctx context.Context,
	code string,
) (*SessionResp, error) {
	endpoint, err := url.Parse(a.endpoint)
	if err != nil {
		return nil, fmt.Errorf("parse WeChat endpoint: %w", err)
	}

	query := endpoint.Query()
	query.Set("appid", a.appID)
	query.Set("secret", a.appSecret)
	query.Set("js_code", code)
	query.Set("grant_type", "authorization_code")
	endpoint.RawQuery = query.Encode()

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		endpoint.String(),
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("create WeChat request: %w", err)
	}

	response, err := a.client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("request WeChat code2session: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(
			"WeChat code2session returned HTTP %d",
			response.StatusCode,
		)
	}

	var result SessionResp
	if err := json.NewDecoder(
		io.LimitReader(response.Body, 1<<20),
	).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode WeChat response: %w", err)
	}

	if result.ErrCode != 0 {
		return nil, fmt.Errorf(
			"WeChat code2session rejected code: %d",
			result.ErrCode,
		)
	}

	if strings.TrimSpace(result.OpenID) == "" {
		return nil, fmt.Errorf(
			"WeChat code2session returned empty openid",
		)
	}

	return &result, nil
}

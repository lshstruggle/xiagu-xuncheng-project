package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	RequestIDHeader = "X-Request-ID"
	RequestIDKey    = "request_id"
)

// RequestID 为每次请求保留或生成唯一标识。
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := strings.TrimSpace(c.GetHeader(RequestIDHeader))
		if requestID == "" {
			requestID = generateRequestID()
		}

		c.Set(RequestIDKey, requestID)
		c.Header(RequestIDHeader, requestID)
		c.Next()
	}
}

// GetRequestID 从 Gin Context 中读取当前请求 ID。
func GetRequestID(c *gin.Context) string {
	requestID, _ := c.Get(RequestIDKey)
	value, _ := requestID.(string)
	return value
}

func generateRequestID() string {
	var randomBytes [16]byte
	if _, err := rand.Read(randomBytes[:]); err == nil {
		return hex.EncodeToString(randomBytes[:])
	}

	//系统随机源极少失败，时间戳作为降级方案。
	return fmt.Sprintf("fallback-%d", time.Now().UnixNano())
}

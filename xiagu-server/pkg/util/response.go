package util

import (
	"errors"

	"github.com/gin-gonic/gin"

	"xiagu-server/pkg/errcode"
)

type R struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(c *gin.Context, data interface{})     { c.JSON(200, R{0, "success", data}) }
func BadRequest(c *gin.Context, msg string)   { c.JSON(400, R{400, msg, nil}) }
func Unauthorized(c *gin.Context, msg string) { c.JSON(401, R{401, msg, nil}) }
func NotFound(c *gin.Context, msg string)     { c.JSON(404, R{404, msg, nil}) }
func Conflict(c *gin.Context, msg string)     { c.JSON(409, R{409, msg, nil}) }
func ServerError(c *gin.Context, msg string)  { c.JSON(500, R{500, msg, nil}) }

// ResponseSuccess 成功响应
func ResponseSuccess(c *gin.Context, data interface{}) {
	c.JSON(200, R{Code: 0, Message: "success", Data: data})
}

// ResponseError 错误响应
func ResponseError(c *gin.Context, code int, message string) {
	c.JSON(code, R{Code: code, Message: message})
}

func Forbidden(c *gin.Context, msg string) {
	c.JSON(403, R{403, msg, nil})
}

func AppError(c *gin.Context, err error) bool {
	var applicationError *errcode.AppError
	if !errors.As(err, &applicationError) {
		return false
	}
	c.JSON(applicationError.HTTPCode, R{
		Code:    applicationError.Code,
		Message: applicationError.Message,
	})
	return true
}

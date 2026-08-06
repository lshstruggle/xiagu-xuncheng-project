package handler

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"xiagu-server/internal/service"
)

// MemoryTTSHandler 回忆模式语音Handler
type MemoryTTSHandler struct {
	svc *service.MemoryTTSService
}

// NewMemoryTTSHandler 创建回忆模式语音Handler
func NewMemoryTTSHandler(svc *service.MemoryTTSService) *MemoryTTSHandler {
	return &MemoryTTSHandler{svc: svc}
}

// GetMemoryTTSList 获取所有回忆模式语音列表
// GET /api/v1/memory-tts
func (h *MemoryTTSHandler) GetMemoryTTSList(c *gin.Context) {
	items := h.svc.GetAllItems()
	
	// 简化返回，不包含文件路径
	var results []gin.H
	for _, item := range items {
		results = append(results, gin.H{
			"id":           item.ID,
			"name":         item.Name,
			"type":         item.Type,
			"text_preview": item.TextPreview,
			"cached":       item.Cached,
		})
	}
	
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"total": len(results),
			"items": results,
		},
	})
}

// GetMemoryTTSByID 根据ID获取回忆模式语音
// GET /api/v1/memory-tts/:id
func (h *MemoryTTSHandler) GetMemoryTTSByID(c *gin.Context) {
	id := c.Param("id")
	
	item, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"id":           item.ID,
			"name":         item.Name,
			"type":         item.Type,
			"text_preview": item.TextPreview,
			"cached":       item.Cached,
		},
	})
}

// GetMemoryTTSAudio 获取回忆模式语音文件
// GET /api/v1/memory-tts/:id/audio
func (h *MemoryTTSHandler) GetMemoryTTSAudio(c *gin.Context) {
	id := c.Param("id")
	
	item, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  err.Error(),
		})
		return
	}
	
	if !item.Cached {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "语音未缓存",
		})
		return
	}
	
	// 返回文件
	audioPath := filepath.Join(h.svc.CacheDir, filepath.Base(item.CachePath))
	
	// 检查文件是否存在
	if _, err := os.Stat(audioPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "语音文件不存在: " + audioPath,
		})
		return
	}
	
	c.File(audioPath)
}

// PlayMemoryTTS 播放回忆模式语音（通过URL重定向）
// GET /api/v1/memory-tts/:id/play
func (h *MemoryTTSHandler) PlayMemoryTTS(c *gin.Context) {
	id := c.Param("id")
	
	item, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"id":       item.ID,
			"name":     item.Name,
			"audio_url": "/api/v1/memory-tts/" + id + "/audio",
		},
	})
}

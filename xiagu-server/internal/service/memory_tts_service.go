package service

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// MemoryTTSItem 回忆模式语音项
type MemoryTTSItem struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Type         string `json:"type"`
	TextHash     string `json:"text_hash"`
	TextPreview  string `json:"text_preview"`
	CachePath    string `json:"cache_path"`
	Cached       bool   `json:"cached"`
	CloudURL     string `json:"cloud_url,omitempty"`  // 云存储URL
}

// MemoryTTSIndex 回忆模式语音索引
type MemoryTTSIndex struct {
	Version    string            `json:"version"`
	TotalCount int               `json:"total_count"`
	Items      []MemoryTTSItem   `json:"items"`
}

// MemoryTTSService 回忆模式语音服务
type MemoryTTSService struct {
	index    *MemoryTTSIndex
	idMap    map[string]*MemoryTTSItem
	CacheDir string
	mu       sync.RWMutex
}

// NewMemoryTTSService 创建回忆模式语音服务
func NewMemoryTTSService(cacheDir string) (*MemoryTTSService, error) {
	svc := &MemoryTTSService{
		idMap:    make(map[string]*MemoryTTSItem),
		CacheDir: cacheDir,
	}
	
	if err := svc.loadIndex(); err != nil {
		return nil, fmt.Errorf("加载语音索引失败: %w", err)
	}
	
	return svc, nil
}

// loadIndex 加载索引文件
func (s *MemoryTTSService) loadIndex() error {
	indexPath := filepath.Join(s.CacheDir, "memory_tts_index.json")
	
	data, err := os.ReadFile(indexPath)
	if err != nil {
		if os.IsNotExist(err) {
			// 索引不存在，创建空索引
			s.index = &MemoryTTSIndex{
				Version:    "1.0",
				TotalCount: 0,
				Items:      []MemoryTTSItem{},
			}
			return nil
		}
		return err
	}
	
	var index MemoryTTSIndex
	if err := json.Unmarshal(data, &index); err != nil {
		return err
	}
	
	s.index = &index
	
	// 构建ID映射
	for i := range s.index.Items {
		item := &s.index.Items[i]
		s.idMap[item.ID] = item
	}
	
	return nil
}

// GetByID 根据彩蛋ID获取语音项
func (s *MemoryTTSService) GetByID(id string) (*MemoryTTSItem, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	item, ok := s.idMap[id]
	if !ok {
		return nil, fmt.Errorf("未找到彩蛋语音: %s", id)
	}
	
	return item, nil
}

// GetAudioData 获取语音文件数据
func (s *MemoryTTSService) GetAudioData(id string) ([]byte, error) {
	item, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}
	
	if !item.Cached {
		return nil, fmt.Errorf("语音未缓存: %s", id)
	}
	
	// 构建完整路径
	audioPath := filepath.Join(s.CacheDir, filepath.Base(item.CachePath))
	
	data, err := os.ReadFile(audioPath)
	if err != nil {
		return nil, fmt.Errorf("读取语音文件失败: %w", err)
	}
	
	return data, nil
}

// GetAudioPath 获取语音文件路径
func (s *MemoryTTSService) GetAudioPath(id string) (string, error) {
	item, err := s.GetByID(id)
	if err != nil {
		return "", err
	}
	
	if !item.Cached {
		return "", fmt.Errorf("语音未缓存: %s", id)
	}
	
	return filepath.Join(s.CacheDir, filepath.Base(item.CachePath)), nil
}

// GetAllItems 获取所有语音项
func (s *MemoryTTSService) GetAllItems() []MemoryTTSItem {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	items := make([]MemoryTTSItem, len(s.index.Items))
	copy(items, s.index.Items)
	return items
}

// GetTextHash 计算文本的哈希值
func GetTextHash(text string) string {
	hash := md5.Sum([]byte(text))
	return hex.EncodeToString(hash[:])
}

// FindByText 根据文本内容查找语音项
func (s *MemoryTTSService) FindByText(text string) (*MemoryTTSItem, error) {
	hash := GetTextHash(text)
	
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	for i := range s.index.Items {
		if s.index.Items[i].TextHash == hash {
			return &s.index.Items[i], nil
		}
	}
	
	return nil, fmt.Errorf("未找到对应文本的语音")
}

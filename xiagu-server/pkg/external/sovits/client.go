package sovits

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"go.uber.org/zap"
)

// ModelConfig 模型配置
type ModelConfig struct {
	SovitsModel    string  `json:"sovits_model_path,omitempty"`
	GPTModel       string  `json:"gpt_model_path,omitempty"`
	ReferenceAudio string  `json:"refer_wav_path,omitempty"`
	ReferenceText  string  `json:"prompt_text,omitempty"`
	ReferenceLang  string  `json:"prompt_language,omitempty"`
	TextLang       string  `json:"text_language,omitempty"`
}

// InferenceParams 推理参数
type InferenceParams struct {
	BatchSize         int     `json:"batch_size,omitempty"`
	SampleSteps       int     `json:"sample_steps,omitempty"`
	SplitInterval     float64 `json:"split_interval,omitempty"`
	Speed             float64 `json:"speed,omitempty"`
	TopK              int     `json:"top_k,omitempty"`
	TopP              float64 `json:"top_p,omitempty"`
	Temperature       float64 `json:"temperature,omitempty"`
	RepetitionPenalty float64 `json:"repetition_penalty,omitempty"`
}

// Client GPT-SoVITS TTS客户端
type Client struct {
	baseURL    string
	httpClient *http.Client
	cacheDir   string
	mu         sync.Mutex
	logger     *zap.SugaredLogger
	model      ModelConfig
	inference  InferenceParams
}

// NewClient 创建TTS客户端
func NewClient(baseURL string, timeout time.Duration, cacheDir string, logger *zap.SugaredLogger) *Client {
	os.MkdirAll(cacheDir, 0755)
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: timeout},
		cacheDir:   cacheDir,
		logger:     logger,
	}
}

// SetModelConfig 设置模型配置
func (c *Client) SetModelConfig(cfg ModelConfig) {
	c.model = cfg
}

// SetInferenceParams 设置推理参数
func (c *Client) SetInferenceParams(params InferenceParams) {
	c.inference = params
}

// Synthesize 将文本转为李白语音，返回WAV音频字节
func (c *Client) Synthesize(ctx context.Context, text string) ([]byte, error) {
	if text == "" {
		return nil, fmt.Errorf("text is empty")
	}

	// 限制长度
	textRunes := []rune(text)
	if len(textRunes) > 200 {
		text = string(textRunes[:200])
	}

	// 1. 检查本地缓存
	cacheKey := c.hashText(text)
	cachePath := filepath.Join(c.cacheDir, cacheKey+".wav")

	if data, err := os.ReadFile(cachePath); err == nil {
		c.logger.Infof("[TTS缓存命中] %s...", string([]rune(text)[:minInt(20, len([]rune(text)))]))
		return data, nil
	}

	// 2. 调用TTS API
	c.logger.Infof("[TTS合成] %s...", string([]rune(text)[:minInt(30, len([]rune(text)))]))
	start := time.Now()

	// 构建请求体，包含模型配置和推理参数
	reqMap := map[string]interface{}{
		"text": text,
	}

	// 添加模型配置（如果已设置）
	if c.model.SovitsModel != "" {
		reqMap["sovits_model_path"] = c.model.SovitsModel
	}
	if c.model.GPTModel != "" {
		reqMap["gpt_model_path"] = c.model.GPTModel
	}
	if c.model.ReferenceAudio != "" {
		reqMap["refer_wav_path"] = c.model.ReferenceAudio
	}
	if c.model.ReferenceText != "" {
		reqMap["prompt_text"] = c.model.ReferenceText
	}
	if c.model.ReferenceLang != "" {
		reqMap["prompt_language"] = c.model.ReferenceLang
	}
	if c.model.TextLang != "" {
		reqMap["text_language"] = c.model.TextLang
	}

	// 添加推理参数（如果已设置）
	if c.inference.BatchSize > 0 {
		reqMap["batch_size"] = c.inference.BatchSize
	}
	if c.inference.SampleSteps > 0 {
		reqMap["sample_steps"] = c.inference.SampleSteps
	}
	if c.inference.SplitInterval > 0 {
		reqMap["split_interval"] = c.inference.SplitInterval
	}
	if c.inference.Speed > 0 {
		reqMap["speed"] = c.inference.Speed
	}
	if c.inference.TopK > 0 {
		reqMap["top_k"] = c.inference.TopK
	}
	if c.inference.TopP > 0 {
		reqMap["top_p"] = c.inference.TopP
	}
	if c.inference.Temperature > 0 {
		reqMap["temperature"] = c.inference.Temperature
	}
	if c.inference.RepetitionPenalty > 0 {
		reqMap["repetition_penalty"] = c.inference.RepetitionPenalty
	}

	reqBody, _ := json.Marshal(reqMap)

	req, err := http.NewRequestWithContext(ctx, "POST",
		c.baseURL+"/tts", bytes.NewReader(reqBody))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("TTS API error %d: %s", resp.StatusCode, string(body))
	}

	// 3. 读取音频数据
	audioData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	elapsed := time.Since(start)
	c.logger.Infof("[TTS完成] %.1fs, %dKB", elapsed.Seconds(), len(audioData)/1024)

	// 4. 存入缓存
	c.mu.Lock()
	os.WriteFile(cachePath, audioData, 0644)
	c.mu.Unlock()

	return audioData, nil
}

// HealthCheck 检查TTS服务是否在线
func (c *Client) HealthCheck(ctx context.Context) error {
	req, _ := http.NewRequestWithContext(ctx, "GET", c.baseURL+"/health", nil)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("TTS服务不可用: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("TTS服务异常: HTTP %d", resp.StatusCode)
	}
	return nil
}

func (c *Client) hashText(text string) string {
	h := md5.Sum([]byte(text))
	return hex.EncodeToString(h[:])
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Package sovits is a narrow client for the protected CloudStudio TTS gateway.
// It never sends model paths, reference audio paths, or inference parameters.
package sovits

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"go.uber.org/zap"
)

var (
	ErrDisabled       = errors.New("tts is disabled")
	ErrCircuitOpen    = errors.New("tts circuit is open")
	ErrUnavailable    = errors.New("tts unavailable")
	ErrInvalidAudio   = errors.New("tts returned invalid wav")
	ErrSegmentTooLong = errors.New("tts segment too long")
)

type Result struct {
	Audio []byte
	Cache string
}

type Client struct {
	enabled  bool
	baseURL  string
	secret   string
	maxRunes int
	http     *http.Client
	logger   *zap.SugaredLogger

	mu               sync.Mutex
	consecutiveFails int
	circuitUntil     time.Time
}

func NewClient(enabled bool, baseURL, secret string, timeout time.Duration, maxRunes int, log *zap.SugaredLogger) *Client {
	if maxRunes <= 0 {
		maxRunes = 35
	}
	if timeout <= 0 {
		timeout = 90 * time.Second
	}
	transport := &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		DialContext:           (&net.Dialer{Timeout: 3 * time.Second, KeepAlive: 30 * time.Second}).DialContext,
		TLSHandshakeTimeout:   3 * time.Second,
		ResponseHeaderTimeout: timeout,
		IdleConnTimeout:       30 * time.Second,
		MaxIdleConns:          2,
		MaxIdleConnsPerHost:   2,
		MaxConnsPerHost:       2,
	}
	return &Client{
		enabled:  enabled,
		baseURL:  strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		secret:   secret,
		maxRunes: maxRunes,
		http:     &http.Client{Transport: transport, Timeout: timeout},
		logger:   log,
	}
}

func (c *Client) Available(now time.Time) bool {
	if !c.enabled || c.baseURL == "" || c.secret == "" {
		return false
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	return !now.Before(c.circuitUntil)
}

func (c *Client) Synthesize(ctx context.Context, text string) (Result, error) {
	text = strings.TrimSpace(text)
	if !c.enabled || c.baseURL == "" || c.secret == "" {
		return Result{}, ErrDisabled
	}
	if utf8.RuneCountInString(text) == 0 {
		return Result{}, fmt.Errorf("empty tts text: %w", ErrUnavailable)
	}
	if utf8.RuneCountInString(text) > c.maxRunes {
		return Result{}, ErrSegmentTooLong
	}
	if !c.Available(time.Now()) {
		return Result{}, ErrCircuitOpen
	}

	body, err := json.Marshal(map[string]string{"text": text})
	if err != nil {
		return Result{}, fmt.Errorf("marshal tts request: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/tts", bytes.NewReader(body))
	if err != nil {
		return Result{}, fmt.Errorf("create tts request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.secret)

	resp, err := c.http.Do(req)
	if err != nil {
		c.failed(err)
		return Result{}, fmt.Errorf("tts request: %w: %w", err, ErrUnavailable)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 4096))
		err = fmt.Errorf("tts gateway status %d", resp.StatusCode)
		c.failed(err)
		return Result{}, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	audio, err := io.ReadAll(io.LimitReader(resp.Body, 16*1024*1024))
	if err != nil {
		c.failed(err)
		return Result{}, fmt.Errorf("read tts audio: %w: %w", err, ErrUnavailable)
	}
	if len(audio) < 12 || string(audio[:4]) != "RIFF" || string(audio[8:12]) != "WAVE" {
		c.failed(ErrInvalidAudio)
		return Result{}, ErrInvalidAudio
	}
	c.succeeded()
	return Result{Audio: audio, Cache: resp.Header.Get("X-TTS-Cache")}, nil
}

func (c *Client) failed(cause error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.consecutiveFails++
	if c.consecutiveFails >= 3 {
		c.circuitUntil = time.Now().Add(30 * time.Second)
		c.consecutiveFails = 0
		if c.logger != nil {
			c.logger.Warnf("[TTS] 熔断30秒: %v", cause)
		}
	}
}

func (c *Client) succeeded() {
	c.mu.Lock()
	c.consecutiveFails = 0
	c.mu.Unlock()
}

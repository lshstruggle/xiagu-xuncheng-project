package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"xiagu-server/internal/config"
	"xiagu-server/pkg/external/sovits"
)

var ErrInvalidTTSTicket = errors.New("invalid tts ticket")

type TTSSegment struct {
	Index  int    `json:"index"`
	Text   string `json:"text"`
	Ticket string `json:"ticket"`
}

type TTSResponse struct {
	Available bool         `json:"available"`
	Segments  []TTSSegment `json:"segments,omitempty"`
}

type TTSSegmentRequest struct {
	HeroID string `json:"hero_id"`
	Text   string `json:"text"`
	Ticket string `json:"ticket"`
}

type ttsTicketClaims struct {
	UserID   string `json:"u"`
	HeroID   string `json:"h"`
	TextHash string `json:"t"`
	Index    int    `json:"i"`
	Expires  int64  `json:"e"`
}

type TTSService struct {
	client   *sovits.Client
	secret   []byte
	maxRunes int
	enabled  bool
	now      func() time.Time
}

func NewTTSService(cfg *config.Config, client *sovits.Client) *TTSService {
	return &TTSService{
		client: client, secret: []byte(cfg.TTS.SharedSecret), maxRunes: cfg.TTS.MaxSegmentRunes,
		enabled: cfg.TTS.Enabled, now: time.Now,
	}
}

func (s *TTSService) Available() bool {
	return s != nil && s.enabled && s.client != nil && s.client.Available(s.now())
}

func (s *TTSService) BuildResponse(userID, heroID, reply string) TTSResponse {
	if !s.Available() {
		return TTSResponse{Available: false}
	}
	segments := splitTTSSegments(reply, s.maxRunes)
	response := TTSResponse{Available: len(segments) > 0, Segments: make([]TTSSegment, 0, len(segments))}
	for i, text := range segments {
		response.Segments = append(response.Segments, TTSSegment{
			Index: i, Text: text, Ticket: s.sign(ttsTicketClaims{
				UserID: userID, HeroID: heroID, TextHash: textHash(text), Index: i,
				Expires: s.now().Add(2 * time.Minute).Unix(),
			}),
		})
	}
	return response
}

func (s *TTSService) SynthesizeSegment(ctx context.Context, userID string, req TTSSegmentRequest) (sovits.Result, error) {
	if !s.Available() {
		return sovits.Result{}, sovits.ErrUnavailable
	}
	text := strings.TrimSpace(req.Text)
	claims, err := s.verify(req.Ticket)
	if err != nil || claims.UserID != userID || claims.HeroID != req.HeroID || claims.TextHash != textHash(text) || claims.Index < 0 {
		return sovits.Result{}, ErrInvalidTTSTicket
	}
	if utf8.RuneCountInString(text) == 0 || utf8.RuneCountInString(text) > s.maxRunes {
		return sovits.Result{}, ErrInvalidTTSTicket
	}
	return s.client.Synthesize(ctx, text)
}

func (s *TTSService) sign(claims ttsTicketClaims) string {
	payload, _ := json.Marshal(claims)
	mac := hmac.New(sha256.New, s.secret)
	_, _ = mac.Write(payload)
	return base64.RawURLEncoding.EncodeToString(payload) + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (s *TTSService) verify(ticket string) (ttsTicketClaims, error) {
	var claims ttsTicketClaims
	parts := strings.Split(ticket, ".")
	if len(parts) != 2 {
		return claims, ErrInvalidTTSTicket
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return claims, ErrInvalidTTSTicket
	}
	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return claims, ErrInvalidTTSTicket
	}
	mac := hmac.New(sha256.New, s.secret)
	_, _ = mac.Write(payload)
	if !hmac.Equal(signature, mac.Sum(nil)) || json.Unmarshal(payload, &claims) != nil || claims.Expires < s.now().Unix() {
		return claims, ErrInvalidTTSTicket
	}
	return claims, nil
}

func textHash(text string) string {
	sum := sha256.Sum256([]byte(text))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

// splitTTSSegments prioritizes Chinese sentence endings while guaranteeing no
// segment crosses the CloudStudio gateway's 35-rune boundary.
func splitTTSSegments(reply string, maxRunes int) []string {
	if maxRunes < 1 {
		return nil
	}
	runes := []rune(strings.TrimSpace(reply))
	segments := make([]string, 0, (len(runes)+maxRunes-1)/maxRunes)
	for len(runes) > 0 {
		end := minInt(len(runes), maxRunes)
		cut := end
		if end < len(runes) {
			for i := end - 1; i >= 0; i-- {
				if strings.ContainsRune("，。！？；、,.!?;", runes[i]) && i+1 >= 15 {
					cut = i + 1
					break
				}
			}
		}
		segment := strings.TrimSpace(string(runes[:cut]))
		if segment != "" {
			segments = append(segments, segment)
		}
		runes = runes[cut:]
	}
	return segments
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (s *TTSService) ValidateTicketForTest(ticket string) error {
	_, err := s.verify(ticket)
	return err
}

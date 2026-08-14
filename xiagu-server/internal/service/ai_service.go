package service

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"xiagu-server/internal/config"
	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
	"xiagu-server/pkg/external/yuanqi"
	"xiagu-server/pkg/logger"
)

const MaxReplyRunes = 150

type AIService struct {
	repos  *repository.Repos
	cfg    *config.Config
	yuanqi *yuanqi.Client
}

func NewAIService(repos *repository.Repos, cfg *config.Config, yq *yuanqi.Client) *AIService {
	return &AIService{repos: repos, cfg: cfg, yuanqi: yq}
}

// === 请求/响应 ===

type AIChatReq struct {
	HeroID   string `json:"hero_id"`
	Message  string `json:"message"`
	Mode     string `json:"mode"`
	CityCode string `json:"city_code"`
	POIID    string `json:"poi_id"`
	NeedTTS  bool   `json:"need_tts"`
}

type AIChatResp struct {
	Reply       string `json:"reply"`
	AudioBase64 string `json:"audio_base64,omitempty"`
	AudioReady  bool   `json:"audio_ready"`
	Mode        string `json:"mode"`
}

// === 对话主函数 ===

func (s *AIService) Chat(ctx context.Context, userID string, req *AIChatReq) (*AIChatResp, error) {
	if req.Mode == "" {
		req.Mode = "normal"
	}
	if err := s.repos.AIUsage.Consume(ctx, userID, time.Now(), 5, 50); err != nil {
		if errors.Is(err, repository.ErrAIRateLimited) {
			return nil, errcode.RateLimited("AI 对话次数已达上限，请稍后再试")
		}
		return nil, err
	}

	// 1. 获取/创建会话
	session, err := s.getOrCreateSession(ctx, userID, req.HeroID, req.CityCode, req.Mode)
	if err != nil {
		return nil, err
	}

	// 2. 构建消息列表
	// ⚠️ 不发送系统消息，因为元器Agent已经内置了人设
	// ⚠️ 只发送最近2轮对话（4条）+ 当前消息，避免超限
	msgs := make([]yuanqi.Message, 0, 6)

	// 最近2轮历史（元器限制严格，不能太多）
	recent := s.recentValidMessages(session.Messages, 4)
	for _, m := range recent {
		msgs = append(msgs, yuanqi.NewTextMessage(m.Role, m.Content))
	}

	// 当前用户输入
	// 如果有POI上下文，附加在用户消息后面
	userMessage := req.Message
	if req.POIID != "" {
		if poi, err := s.repos.POI.GetByID(ctx, req.POIID); err == nil {
			poiCtx := s.buildPOIContext(poi, req.HeroID)
			userMessage = req.Message + "\n\n（当前位置信息：" + poiCtx + "）"
		}
	}

	// 如果是特殊模式，在用户消息前加提示
	switch req.Mode {
	case "spirit":
		userMessage = "【请用赛事精神见证者的语气回答】" + userMessage
	case "bond":
		userMessage = "【请用回忆模式的语气回答】" + userMessage
	}

	msgs = append(msgs, yuanqi.NewTextMessage("user", userMessage))

	// 3. 调用腾讯元器
	upstreamContext, cancelUpstream := context.WithTimeout(
		ctx,
		s.cfg.Yuanqi.Timeout,
	)
	defer cancelUpstream()
	reply, err := s.yuanqi.Chat(upstreamContext, userID, msgs)
	if err != nil {
		logger.Log.Warnf("[AI] 元器调用失败，使用降级回复: %v", err)
		reply = s.fallbackReply()
	}

	// 4. 截断到150字
	reply = s.truncate(reply, MaxReplyRunes)

	// 5. 保存对话历史
	newMsgs := []model.ChatMessage{
		{Role: "user", Content: req.Message, Mode: req.Mode, Timestamp: time.Now()},
	}
	// 只有非降级回复才保存到历史
	if reply != s.fallbackReply() {
		newMsgs = append(newMsgs, model.ChatMessage{Role: "assistant", Content: reply, Mode: req.Mode, Timestamp: time.Now()})
	}
	if err := s.repos.Session.AppendMessages(ctx, session.ID, newMsgs); err != nil {
		logger.Log.Warnf("[AI] 保存会话历史失败: %v", err)
	}

	// 6. 构建响应
	resp := &AIChatResp{
		Reply:      reply,
		AudioReady: false,
		Mode:       req.Mode,
	}

	return resp, nil
}

// === 辅助函数 ===

func (s *AIService) getOrCreateSession(
	ctx context.Context,
	userID string,
	heroID string,
	cityCode string,
	mode string,
) (*model.AISession, error) {
	session, err := s.repos.Session.GetByUser(ctx, userID, mode)
	if err == nil && session != nil {
		return session, nil
	}

	newSession := &model.AISession{
		UserID:      userID,
		HeroID:      heroID,
		CityCode:    cityCode,
		Messages:    []model.ChatMessage{},
		CurrentMode: mode,
	}
	if err := s.repos.Session.Create(ctx, newSession); err != nil {
		// Concurrent page requests can create the same user+mode session. The
		// unique index elects one writer; the loser loads the winning document.
		if errors.Is(err, database.ErrDuplicateWrite) {
			return s.repos.Session.GetByUser(ctx, userID, mode)
		}
		return nil, err
	}
	return newSession, nil
}

func (s *AIService) buildPOIContext(poi *model.POI, heroID string) string {
	var sb strings.Builder
	sb.WriteString("地点: " + poi.Name + "\n")
	sb.WriteString("类型: " + poi.Category + "\n")
	sb.WriteString("简介: " + poi.Description + "\n")

	if narration, ok := poi.HeroNarrations[heroID]; ok {
		sb.WriteString("角色参考: " + narration + "\n")
	}
	if poi.SpiritEvent != nil {
		sb.WriteString("赛事故事: " + poi.SpiritEvent.EventName + "\n")
		sb.WriteString("精神关键词: " + poi.SpiritEvent.SpiritKeyword + "\n")
	}
	if poi.PlayerBond != nil {
		sb.WriteString("选手故事: " + poi.PlayerBond.TeamName + " " + poi.PlayerBond.Era + "\n")
		sb.WriteString("经典语录: " + poi.PlayerBond.Quote + "\n")
	}
	return sb.String()
}

// recentValidMessages 获取最近的有效消息（过滤降级回复，限制数量，截断长度）
func (s *AIService) recentValidMessages(msgs []model.ChatMessage, maxMsgs int) []model.ChatMessage {
	fallbackReply := s.fallbackReply()
	maxContentLen := 200 // 单条消息最大长度

	// 找到最后N对完整的user-assistant对话（过滤掉降级回复）
	pairs := []model.ChatMessage{}

	for i := len(msgs) - 1; i >= 1; i-- {
		if msgs[i].Role == "assistant" && msgs[i-1].Role == "user" {
			// 跳过降级回复
			if msgs[i].Content == fallbackReply {
				i-- // 跳过这对消息
				continue
			}

			// 截断过长的消息
			userContent := msgs[i-1].Content
			assistContent := msgs[i].Content
			if len(userContent) > maxContentLen {
				userContent = userContent[:maxContentLen] + "..."
			}
			if len(assistContent) > maxContentLen {
				assistContent = assistContent[:maxContentLen] + "..."
			}

			// 倒序添加，最后会反转
			pairs = append(pairs, model.ChatMessage{Role: "assistant", Content: assistContent})
			pairs = append(pairs, model.ChatMessage{Role: "user", Content: userContent})
			if len(pairs) >= maxMsgs {
				break
			}
			i-- // 跳过已处理的user
		}
	}

	// 反转回正序
	for i, j := 0, len(pairs)-1; i < j; i, j = i+1, j-1 {
		pairs[i], pairs[j] = pairs[j], pairs[i]
	}

	return pairs
}

func (s *AIService) truncate(text string, maxRunes int) string {
	if utf8.RuneCountInString(text) <= maxRunes {
		return text
	}
	r := []rune(text)
	return string(r[:maxRunes-3]) + "..."
}

func (s *AIService) fallbackReply() string {
	return "哈哈，峡谷信号不太好，容我饮一杯再与你细说！"
}

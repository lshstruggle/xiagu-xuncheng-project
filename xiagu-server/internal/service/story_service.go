package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"xiagu-server/internal/database"
	"xiagu-server/internal/model"
	"xiagu-server/internal/repository"
	"xiagu-server/pkg/errcode"
	"xiagu-server/pkg/logger"
)

type StoryService struct {
	repos *repository.Repos
}

func NewStoryService(repos *repository.Repos) *StoryService {
	return &StoryService{repos: repos}
}

func normalizeStoryMode(mode string) (string, error) {
	if mode == "" {
		return "explore", nil
	}
	if mode != "free" && mode != "explore" {
		return "", errcode.BadRequest("剧情模式无效")
	}
	return mode, nil
}

func (s *StoryService) GetDefinition(
	ctx context.Context,
	storyID string,
) (*model.StoryDefinition, error) {
	definition, err := s.repos.Story.GetDefinition(ctx, storyID)
	if errors.Is(err, database.ErrDocumentNotFound) {
		return nil, errcode.NotFound("剧情不存在")
	}
	return definition, err
}

func (s *StoryService) GetProgress(
	ctx context.Context,
	userID, storyID, mode string,
) (*model.StoryProgress, error) {
	normalizedMode, err := normalizeStoryMode(mode)
	if err != nil {
		return nil, err
	}
	progress, err := s.repos.Story.GetProgress(ctx, userID, storyID, normalizedMode)
	if errors.Is(err, database.ErrDocumentNotFound) {
		return nil, errcode.NotFound("剧情进度不存在")
	}
	return progress, err
}

func (s *StoryService) Start(
	ctx context.Context,
	userID, storyID, heroID, mode string,
) (*model.StoryProgress, error) {
	normalizedMode, err := normalizeStoryMode(mode)
	if err != nil {
		return nil, err
	}
	definition, err := s.GetDefinition(ctx, storyID)
	if err != nil {
		return nil, err
	}
	if definition.StartNodeID == "" || definition.Nodes[definition.StartNodeID].ID == "" {
		return nil, errcode.Internal("剧情起始节点配置错误")
	}
	if heroID == "" {
		heroID = definition.HeroID
	}
	if definition.HeroID != "" && heroID != definition.HeroID {
		return nil, errcode.BadRequest("剧情英雄不匹配")
	}

	existing, findErr := s.repos.Story.GetProgress(
		ctx,
		userID,
		storyID,
		normalizedMode,
	)
	if findErr == nil && validStoryProgress(existing, userID, storyID, normalizedMode) {
		return existing, nil
	}
	if findErr != nil && !errors.Is(findErr, database.ErrDocumentNotFound) {
		return nil, findErr
	}

	now := time.Now()
	progress := &model.StoryProgress{
		ID:                 repository.StoryProgressID(userID, storyID, normalizedMode),
		UserID:             userID,
		StoryID:            storyID,
		HeroID:             heroID,
		Mode:               normalizedMode,
		CurrentNodeID:      definition.StartNodeID,
		CompletedNodes:     []string{},
		ClaimedRewardNodes: []string{},
		Choices:            map[string]string{},
		Status:             "ongoing",
		Revision:           1,
		StoryVersion:       definition.Version,
		StartedAt:          now,
		UpdatedAt:          now,
	}
	err = s.repos.Story.InitializeProgress(ctx, progress)
	if errors.Is(err, database.ErrDuplicateWrite) ||
		errors.Is(err, database.ErrDatabaseConflict) {
		return s.repos.Story.GetProgress(ctx, userID, storyID, normalizedMode)
	}
	return progress, err
}

func validStoryProgress(
	progress *model.StoryProgress,
	userID, storyID, mode string,
) bool {
	return progress != nil &&
		progress.ID == repository.StoryProgressID(userID, storyID, mode) &&
		progress.UserID == userID &&
		progress.StoryID == storyID &&
		progress.Mode == mode &&
		progress.CurrentNodeID != "" &&
		(progress.Status == "ongoing" ||
			progress.Status == "paused" ||
			progress.Status == "completed") &&
		progress.Revision >= 1
}

type StoryAdvanceRequest struct {
	Mode     string `json:"mode"`
	ChoiceID string `json:"choice_id"`
	Revision int64  `json:"revision"`
}

func (s *StoryService) Advance(
	ctx context.Context,
	userID, storyID string,
	request StoryAdvanceRequest,
) (*model.StoryProgress, error) {
	mode, err := normalizeStoryMode(request.Mode)
	if err != nil {
		return nil, err
	}
	if request.Revision < 1 {
		return nil, errcode.BadRequest("revision 必须大于 0")
	}

	definition, err := s.repos.Story.GetDefinition(ctx, storyID)
	if errors.Is(err, database.ErrDocumentNotFound) {
		return nil, errcode.NotFound("剧情不存在")
	}
	if err != nil {
		return nil, err
	}
	progress, err := s.repos.Story.GetProgress(ctx, userID, storyID, mode)
	if errors.Is(err, database.ErrDocumentNotFound) {
		return nil, errcode.NotFound("剧情进度不存在")
	}
	if err != nil {
		return nil, err
	}
	if progress.Status != "ongoing" {
		return nil, errcode.Conflict("剧情当前不可推进")
	}
	if progress.Revision != request.Revision {
		return nil, errcode.Conflict("剧情进度版本冲突，请刷新后重试")
	}
	if progress.StoryVersion != definition.Version {
		return nil, errcode.Conflict("剧情内容已更新，请重置进度后重试")
	}

	node, nextNodeID, err := resolveStoryAdvance(
		definition,
		progress.CurrentNodeID,
		request.ChoiceID,
	)
	if err != nil {
		return nil, err
	}

	expectedRevision := progress.Revision
	progress.CompletedNodes = appendUnique(progress.CompletedNodes, node.ID)
	if request.ChoiceID != "" {
		if progress.Choices == nil {
			progress.Choices = map[string]string{}
		}
		progress.Choices[node.ID] = request.ChoiceID
	}
	shouldReward := node.Reward != nil &&
		!containsString(progress.ClaimedRewardNodes, node.ID)
	if shouldReward {
		progress.ClaimedRewardNodes = append(progress.ClaimedRewardNodes, node.ID)
	}

	now := time.Now()
	if node.Type == "ending" || nextNodeID == "" {
		progress.Status = "completed"
		progress.CompletedAt = &now
	} else {
		progress.CurrentNodeID = nextNodeID
	}
	progress.Revision++
	progress.UpdatedAt = now

	err = s.repos.Story.WithTransaction(ctx, func(transactionContext context.Context) error {
		if replaceErr := s.repos.Story.ReplaceProgress(
			transactionContext,
			progress,
			expectedRevision,
		); replaceErr != nil {
			if errors.Is(replaceErr, database.ErrDatabaseConflict) {
				return errcode.Conflict("剧情进度版本冲突，请刷新后重试")
			}
			return replaceErr
		}
		if shouldReward {
			if rewardErr := s.repos.User.ApplyStoryReward(
				transactionContext,
				userID,
				progress.HeroID,
				node.Reward,
			); rewardErr != nil {
				return fmt.Errorf("apply story reward: %w", rewardErr)
			}
		}
		return nil
	})
	return progress, err
}

func resolveStoryAdvance(
	definition *model.StoryDefinition,
	currentNodeID string,
	choiceID string,
) (model.StoryNode, string, error) {
	node, ok := definition.Nodes[currentNodeID]
	if !ok || node.ID == "" {
		return model.StoryNode{}, "", errcode.Internal("当前剧情节点配置错误")
	}

	nextNodeID := node.NextNodeID
	if len(node.Choices) > 0 {
		if choiceID == "" {
			return model.StoryNode{}, "", errcode.BadRequest("当前节点必须选择一个选项")
		}
		found := false
		for _, choice := range node.Choices {
			if choice.ID == choiceID {
				nextNodeID = choice.NextNodeID
				found = true
				break
			}
		}
		if !found {
			return model.StoryNode{}, "", errcode.BadRequest("剧情选项无效")
		}
	} else if choiceID != "" {
		return model.StoryNode{}, "", errcode.BadRequest("当前节点不接受选项")
	}

	if nextNodeID != "" {
		if next, exists := definition.Nodes[nextNodeID]; !exists || next.ID == "" {
			return model.StoryNode{}, "", errcode.Internal("下一剧情节点配置错误")
		}
	}
	return node, nextNodeID, nil
}

func (s *StoryService) SetStatus(
	ctx context.Context,
	userID, storyID, mode, targetStatus string,
	revision int64,
) (*model.StoryProgress, error) {
	normalizedMode, err := normalizeStoryMode(mode)
	if err != nil {
		return nil, err
	}
	if revision < 1 {
		return nil, errcode.BadRequest("revision 必须大于 0")
	}

	progress, err := s.repos.Story.GetProgress(ctx, userID, storyID, normalizedMode)
	if errors.Is(err, database.ErrDocumentNotFound) {
		return nil, errcode.NotFound("剧情进度不存在")
	}
	if err != nil {
		return nil, err
	}
	if progress.Revision != revision {
		logger.Warn(
			"story transition conflict stage=precheck story_id=%s mode=%s requested_revision=%d actual_revision=%d",
			storyID,
			normalizedMode,
			revision,
			progress.Revision,
		)
		return nil, errcode.Conflict("剧情进度版本冲突，请刷新后重试")
	}
	if targetStatus == "paused" && progress.Status != "ongoing" {
		return nil, errcode.Conflict("只有进行中的剧情可以暂停")
	}
	if targetStatus == "ongoing" && progress.Status != "paused" {
		return nil, errcode.Conflict("只有暂停的剧情可以恢复")
	}
	expectedRevision := progress.Revision
	progress.Status = targetStatus
	progress.Revision++
	progress.UpdatedAt = time.Now()
	if err := s.repos.Story.ReplaceProgress(ctx, progress, expectedRevision); err != nil {
		if errors.Is(err, database.ErrDatabaseConflict) {
			logger.Warn(
				"story transition conflict stage=write story_id=%s mode=%s revision=%d error=%v",
				storyID,
				normalizedMode,
				revision,
				err,
			)
			return nil, errcode.Conflict("剧情进度版本冲突，请刷新后重试")
		}
		return nil, err
	}
	return progress, nil
}

func (s *StoryService) Reset(
	ctx context.Context,
	userID, storyID, mode string,
) error {
	normalizedMode, err := normalizeStoryMode(mode)
	if err != nil {
		return err
	}
	return s.repos.Story.DeleteProgress(ctx, userID, storyID, normalizedMode)
}

func appendUnique(values []string, value string) []string {
	if containsString(values, value) {
		return values
	}
	return append(values, value)
}

func containsString(values []string, value string) bool {
	for _, current := range values {
		if current == value {
			return true
		}
	}
	return false
}

package service

import (
	"context"

	"xiagu-server/pkg/external/sovits"
)

type TTSService struct {
	client *sovits.Client
}

func NewTTSService(client *sovits.Client) *TTSService {
	return &TTSService{client: client}
}

func (s *TTSService) Synthesize(ctx context.Context, text string) ([]byte, error) {
	return s.client.Synthesize(ctx, text)
}

func (s *TTSService) HealthCheck(ctx context.Context) error {
	return s.client.HealthCheck(ctx)
}

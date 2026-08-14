package app

import (
	"context"
	"errors"
	"sync"
)

var errInitializationPending = errors.New("application initialization is pending")

// ReadinessGate keeps the HTTP server reachable while asynchronous startup
// work, such as database index creation, is still running.
type ReadinessGate struct {
	mu       sync.RWMutex
	complete bool
	err      error
}

func NewReadinessGate() *ReadinessGate {
	return &ReadinessGate{}
}

func (g *ReadinessGate) Complete(err error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.complete = true
	g.err = err
}

func (g *ReadinessGate) Check(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	g.mu.RLock()
	defer g.mu.RUnlock()

	if !g.complete {
		return errInitializationPending
	}
	return g.err
}

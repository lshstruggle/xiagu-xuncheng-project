package app

import (
	"context"
	"errors"
	"testing"
)

func TestReadinessGateStartsPending(t *testing.T) {
	gate := NewReadinessGate()

	if err := gate.Check(context.Background()); err == nil {
		t.Fatal("expected pending readiness gate to return an error")
	}
}

func TestReadinessGateCompletesSuccessfully(t *testing.T) {
	gate := NewReadinessGate()
	gate.Complete(nil)

	if err := gate.Check(context.Background()); err != nil {
		t.Fatalf("expected completed readiness gate to pass: %v", err)
	}
}

func TestReadinessGateKeepsInitializationError(t *testing.T) {
	gate := NewReadinessGate()
	expected := errors.New("database initialization failed")
	gate.Complete(expected)

	if err := gate.Check(context.Background()); !errors.Is(err, expected) {
		t.Fatalf("expected initialization error %v, got %v", expected, err)
	}
}

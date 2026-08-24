package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveRuntimeConfigPathUsesExplicitPath(t *testing.T) {
	explicitPath := "/custom/config.yaml"

	got, err := ResolveRuntimeConfigPath(
		explicitPath,
		"/missing/default.yaml",
	)
	if err != nil {
		t.Fatalf("resolve explicit config path: %v", err)
	}

	if got != explicitPath {
		t.Fatalf("expected explicit path %q, got %q", explicitPath, got)
	}
}

func TestResolveRuntimeConfigPathUsesExistingLocalDefault(t *testing.T) {
	defaultPath := filepath.Join(t.TempDir(), "config.yaml")

	if err := os.WriteFile(defaultPath, []byte("server:\n  mode: debug\n"), 0o600); err != nil {
		t.Fatalf("write local config: %v", err)
	}

	got, err := ResolveRuntimeConfigPath("", defaultPath)
	if err != nil {
		t.Fatalf("resolve local config path: %v", err)
	}

	if got != defaultPath {
		t.Fatalf("expected local config path %q, got %q", defaultPath, got)
	}
}

func TestResolveRuntimeConfigPathUsesEnvironmentOnlyWhenDefaultMissing(t *testing.T) {
	missingPath := filepath.Join(t.TempDir(), "missing.yaml")

	got, err := ResolveRuntimeConfigPath("", missingPath)
	if err != nil {
		t.Fatalf("resolve missing config path: %v", err)
	}

	if got != "" {
		t.Fatalf("expected environment-only empty path, got %q", got)
	}
}

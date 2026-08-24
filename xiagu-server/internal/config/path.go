package config

import (
	"errors"
	"fmt"
	"os"
)

// ResolveRuntimeConfigPath 决定使用显式配置、本地默认配置或纯环境变量。
func ResolveRuntimeConfigPath(
	explicitPath string,
	localDefaultPath string,
) (string, error) {
	if explicitPath != "" {
		return explicitPath, nil
	}

	_, err := os.Stat(localDefaultPath)
	if err == nil {
		return localDefaultPath, nil
	}

	if errors.Is(err, os.ErrNotExist) {
		return "", nil
	}

	return "", fmt.Errorf(
		"inspect local config %q: %w",
		localDefaultPath,
		err,
	)

}

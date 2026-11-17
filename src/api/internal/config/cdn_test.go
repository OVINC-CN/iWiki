package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestCDNCacheSettings(t *testing.T) {
	tests := []struct {
		name     string
		cacheTTL time.Duration
		invalid  bool
	}{
		{"default", 30 * time.Minute, false},
		{"custom", 10 * time.Minute, false},
		{"zero", 0, true},
		{"negative", -time.Minute, true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cfg := *Config
			cfg.COS.CDNCacheTTL = test.cacheTTL
			err := cfg.validate()
			if (err != nil) != test.invalid {
				t.Fatalf("Unexpected validation result: %v", err)
			}
		})
	}
}

func TestLoadWithoutCDNCacheSettings(t *testing.T) {
	data, err := os.ReadFile(FilePath)
	if err != nil {
		t.Fatal("Failed to read the test configuration")
	}
	lines := strings.Split(string(data), "\n")
	kept := make([]string, 0, len(lines))
	for _, line := range lines {
		if strings.HasPrefix(line, "  cdn_cache_ttl:") {
			continue
		}
		kept = append(kept, line)
	}
	filename := filepath.Join(t.TempDir(), "config.yaml")
	// #nosec G703 -- 路径仅由测试临时目录与固定文件名组成。
	if err := os.WriteFile(filename, []byte(strings.Join(kept, "\n")), 0o600); err != nil {
		t.Fatal("Failed to write the test configuration")
	}
	cfg, err := load(filename)
	if err != nil {
		t.Fatalf("Existing configurations must remain valid: %v", err)
	}
	if cfg.COS.CDNCacheTTL != 30*time.Minute {
		t.Fatal("Missing CDN cache settings must default to a half-hour cache")
	}
}

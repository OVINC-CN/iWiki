package config

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/goccy/go-yaml"
	"github.com/sirupsen/logrus"
)

// Config 是进程共享的已校验配置。
var Config *Settings

// FilePath 是实际使用的配置文件路径。
var FilePath string

func init() {
	// 加载并校验 YAML 配置。
	filename, err := configFilename(os.Args[1:])
	if err != nil {
		logrus.Fatal("Config path resolution failed")
	}
	FilePath = filename
	Config, err = load(filename)
	if err != nil {
		// 输出配置加载失败提示。
		logrus.Fatalf(
			"Config initialization failed; check YAML fields and file permissions: %s",
			err,
		)
	}
}

func configFilename(arguments []string) (string, error) {
	// --config 可以出现在 api 命令前后；未指定时向上查找 config.yaml。
	for index, argument := range arguments {
		if strings.HasPrefix(argument, "--config=") {
			if value := strings.TrimPrefix(argument, "--config="); value != "" {
				return value, nil
			}
			return "", errors.New("config path must not be empty")
		}
		if argument == "--config" {
			if index+1 == len(arguments) || strings.HasPrefix(arguments[index+1], "-") {
				return "", errors.New("--config requires a file path")
			}
			return arguments[index+1], nil
		}
	}
	directory, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		candidate := filepath.Join(directory, "config.yaml")
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}
		parent := filepath.Dir(directory)
		if parent == directory {
			return "", errors.New("config.yaml not found; specify a file with --config")
		}
		directory = parent
	}
}

func load(filename string) (*Settings, error) {
	// 路径仅来自本地启动参数，不接受 HTTP 输入。
	data, err := os.ReadFile(filename) // #nosec G304 G703 -- 路径仅来自本地启动参数，不接收网络输入。
	if err != nil {
		return nil, fmt.Errorf("config file read failed: %w", err)
	}
	cfg := new(Settings)
	decoder := yaml.NewDecoder(bytes.NewReader(data), yaml.Strict())
	if err := decoder.Decode(cfg); err != nil {
		return nil, errors.New("invalid YAML syntax or fields")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return nil, errors.New("config must contain one YAML document")
	}
	if err := cfg.validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

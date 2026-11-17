package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/OVINC-CN/iWiki/src/api/internal/apis/oidc"
	"github.com/OVINC-CN/iWiki/src/api/internal/apis/tencentsts"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/httpd"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
	"github.com/OVINC-CN/iWiki/src/api/internal/tracing"
)

// @title iWiki 接口
// @version 1.0
// @description 文档、标签和文件上传服务。
// @BasePath /
func main() {
	if err := run(); err != nil {
		logger.Logger.Error(err.Error())
		os.Exit(1)
	}
}

func run() error {
	// 解析启动命令。
	defer closeResources()
	arguments := os.Args[1:]
	commandSeen := false
	for index := 0; index < len(arguments); index++ {
		argument := arguments[index]
		if argument == "--config" {
			index++
			continue
		}
		if len(argument) >= 9 && argument[:9] == "--config=" {
			continue
		}
		if argument == "--help" || argument == "-h" {
			fmt.Println("用法: iwiki [api] [--config 配置文件]")
			return nil
		}
		if argument != "api" || commandSeen {
			return errors.New("unsupported command; usage: iwiki [api] [--config file]")
		}
		commandSeen = true
	}
	if db.DB() == nil || db.RDB() == nil || !oidc.Enabled() {
		return errors.New("mysql, redis and OIDC must be configured before starting the API")
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	return httpd.Serve(ctx)
}

func closeResources() {
	if err := db.Close(); err != nil {
		logger.Logger.Error("Database or cache shutdown failed")
	}
	oidc.Close()
	tencentsts.Close()
	ctx, cancel := context.WithTimeout(context.Background(), config.Config.App.ShutdownTimeout)
	defer cancel()
	if err := tracing.Shutdown(ctx); err != nil {
		logger.Logger.Error("Trace shutdown failed")
	}
}

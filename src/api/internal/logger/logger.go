package logger

import (
	"os"
	"time"

	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/otel/trace"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
)

// Logger 是全局日志实例。
var Logger = logrus.StandardLogger()

const (
	traceField = "trace"
	spanField  = "span_id"
)

type traceHook struct{}

func init() {
	// 设置日志级别和输出格式。
	level, err := logrus.ParseLevel(config.Config.App.LogLevel)
	if err != nil {
		Logger.Fatalf("Logger initialization failed: %v", err)
	}
	Logger.SetLevel(level)
	Logger.SetOutput(os.Stdout)
	Logger.SetFormatter(&logrus.JSONFormatter{TimestampFormat: time.RFC3339})

	// 所有带上下文的日志自动关联当前 OpenTelemetry Trace ID 和 Span ID。
	Logger.AddHook(credentialHook{})
	Logger.AddHook(traceHook{})
	Logger.Info("Logger initialized")
}

func (traceHook) Levels() []logrus.Level {
	// 追踪标识覆盖全部日志级别。
	return logrus.AllLevels
}

func (traceHook) Fire(entry *logrus.Entry) error {
	// 从请求上下文提取追踪标识。
	if entry.Context != nil {
		spanContext := trace.SpanContextFromContext(entry.Context)
		if spanContext.IsValid() {
			entry.Data[traceField] = spanContext.TraceID().String()
			entry.Data[spanField] = spanContext.SpanID().String()
		}
	}
	return nil
}

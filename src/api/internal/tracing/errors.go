package tracing

import (
	"context"
	"strings"

	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/otel/codes"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.30.0"
	"go.opentelemetry.io/otel/trace"

	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
)

type errorLogProcessor struct{}

const redisInstrumentationName = "github.com/redis/go-redis/extra/redisotel"

func (errorLogProcessor) OnStart(context.Context, sdktrace.ReadWriteSpan) {}

func (errorLogProcessor) OnEnd(span sdktrace.ReadOnlySpan) {
	// 所有组件的异常统一写入日志，不依赖是否开启 OTLP 上报。
	ctx := trace.ContextWithSpanContext(context.Background(), span.SpanContext())
	recorded := false
	for _, event := range span.Events() {
		if event.Name != semconv.ExceptionEventName {
			continue
		}
		var errorType, message string
		for _, field := range event.Attributes {
			switch field.Key {
			case semconv.ExceptionTypeKey:
				errorType = field.Value.AsString()
			case semconv.ExceptionMessageKey:
				message = field.Value.AsString()
			}
		}

		// 只复制异常类型和说明，不输出 SQL、命令参数或其他 Span 属性。
		logger.Logger.WithContext(ctx).Logf(
			spanErrorLogLevel(span, message),
			"Span exception; operation: %s; error type: %s; error: %s",
			span.Name(),
			errorType,
			message,
		)
		recorded = true
	}

	// 组件仅设置错误状态而没有异常事件时，也保留失败说明。
	if !recorded && span.Status().Code == codes.Error {
		logger.Logger.WithContext(ctx).Logf(
			spanErrorLogLevel(span, span.Status().Description),
			"Span failed; operation: %s; error: %s",
			span.Name(),
			span.Status().Description,
		)
	}
}

func spanErrorLogLevel(span sdktrace.ReadOnlySpan, message string) logrus.Level {
	// Script.Run 会在缓存未命中后回退 EVAL，跨度仍保留完整异常和错误状态。
	if span.InstrumentationScope().Name == redisInstrumentationName &&
		span.SpanKind() == trace.SpanKindClient &&
		(span.Name() == "evalsha" || span.Name() == "evalsha_ro") &&
		strings.HasPrefix(message, "NOSCRIPT ") {
		return logrus.DebugLevel
	}

	// 其他组件、流水线和后续 EVAL 的最终失败仍使用错误级别。
	return logrus.ErrorLevel
}

func (errorLogProcessor) Shutdown(context.Context) error { return nil }

func (errorLogProcessor) ForceFlush(context.Context) error { return nil }

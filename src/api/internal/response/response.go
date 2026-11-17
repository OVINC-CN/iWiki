package response

import (
	"context"
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/OVINC-CN/iWiki/src/api/internal/tracing"
)

// Envelope 是所有 JSON 接口的通用响应。
type Envelope[T any] struct {
	Trace    string `json:"trace"     example:"4bf92f3577b34da6a3ce929d0e0e4736"` // 请求追踪编号。
	ErrorMsg string `json:"error_msg" example:""`                                 // 错误提示。
	Data     T      `json:"data"`                                                 // 业务数据。
}

// EmptyEnvelope 用于无业务数据及错误响应。
type EmptyEnvelope struct{ Envelope[any] }

// BusinessError 只包含可以公开的错误说明。
type BusinessError struct {
	Status  int
	Message string
}

func (err *BusinessError) Error() string { return err.Message }

// Error 创建业务错误。
func Error(status int, message string) error {
	return &BusinessError{Status: status, Message: message}
}

// Success 返回 HTTP 200，错误说明为空。
func Success[T any](c echo.Context, data T) error {
	return c.JSON(http.StatusOK, Envelope[T]{
		Trace: tracing.TraceID(c.Request().Context()),
		Data:  data,
	})
}

// Failure 返回错误响应。
func Failure(c echo.Context, status int, message string) error {
	return c.JSON(status, Envelope[any]{
		Trace:    tracing.TraceID(c.Request().Context()),
		ErrorMsg: message,
		Data:     nil,
	})
}

// RecordInternal 记录内部异常的追踪状态。
func RecordInternal(ctx context.Context, err error) {
	var business *BusinessError
	if err == nil || errors.As(err, &business) {
		return
	}
	span := trace.SpanFromContext(ctx)
	span.RecordError(errors.New("request operation failed"))
	span.SetStatus(codes.Error, "request operation failed")
}

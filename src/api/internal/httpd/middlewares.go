package httpd

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userSvc"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
	"github.com/OVINC-CN/iWiki/src/api/internal/tracing"
)

func traceRequests(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx := otel.GetTextMapPropagator().Extract(
			c.Request().Context(), propagation.HeaderCarrier(c.Request().Header),
		)
		ctx, span := tracing.Tracer.Start(ctx, c.Request().Method+" "+c.Path(),
			trace.WithSpanKind(trace.SpanKindServer))
		defer span.End()
		c.SetRequest(c.Request().WithContext(ctx))
		c.Response().Header().Set("Cache-Control", "no-store")
		c.Response().Header().Set("X-Trace-ID", tracing.TraceID(ctx))
		err := next(c)
		if err != nil {
			c.Error(err)
		}
		span.SetAttributes(attribute.Int("http.response.status_code", c.Response().Status))
		return nil
	}
}

func requestLogger(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		start := time.Now()
		err := next(c)
		if err != nil {
			c.Error(err)
		}
		if c.Request().Method == http.MethodGet && (c.Path() == "/health" || c.Path() == "/ready") {
			return nil
		}
		path := c.Path()
		if path == "" {
			path = "/unmatched"
		}
		logger.Logger.WithContext(c.Request().Context()).Infof(
			"%s %s %d %s; ip: %q; bytes: %d\nua: %q\nreferer: %q",
			c.Request().Method,
			path,
			c.Response().Status,
			time.Since(start).Round(time.Microsecond),
			c.RealIP(),
			c.Response().Size,
			c.Request().UserAgent(),
			safeReferer(c.Request().Referer()),
		)
		return nil
	}
}

func identify(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// 检查登录入口和探针路由。
		if publicRoute(c) {
			return next(c)
		}
		cookie, err := c.Cookie(config.Config.Session.CookieName)
		if err != nil {
			return response.Error(http.StatusUnauthorized, "请先登录")
		}
		identity, err := userSvc.Authenticate(c.Request().Context(), cookie.Value)
		if err != nil {
			var business *response.BusinessError
			if errors.As(err, &business) && business.Status == http.StatusUnauthorized {
				c.SetCookie(userUtils.Cookie(config.Config.Session.CookieName, "", 0))
			}
			return err
		}
		ctx := userUtils.WithIdentity(c.Request().Context(), identity)
		c.SetRequest(c.Request().WithContext(ctx))
		return next(c)
	}
}

func csrfProtection(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		switch c.Request().Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			return next(c)
		}
		if c.Request().Header.Get("X-CSRF-Protection") != "1" {
			return response.Error(http.StatusForbidden, "请求来源校验失败")
		}
		origin := c.Request().Header.Get(echo.HeaderOrigin)
		if origin == "" {
			if referer, err := url.Parse(c.Request().Referer()); err == nil && referer.Host != "" {
				origin = referer.Scheme + "://" + referer.Host
			}
		}
		allowed := false
		for _, candidate := range config.Config.HTTP.CORSAllowOrigins {
			allowed = allowed || candidate == origin
		}
		callback, _ := url.Parse(config.Config.OIDC.RedirectURL)
		allowed = allowed || origin == callback.Scheme+"://"+callback.Host
		if !allowed {
			return response.Error(http.StatusForbidden, "请求来源校验失败")
		}
		return next(c)
	}
}

func publicRoute(c echo.Context) bool {
	if c.Request().Method != http.MethodGet {
		return false
	}
	switch c.Path() {
	case "/health", "/ready", "/v1/auth/oidc/login", "/v1/auth/oidc/callback":
		return true
	default:
		return false
	}
}

func safeReferer(value string) string {
	parsed, err := url.Parse(value)
	if err != nil || parsed.Host == "" ||
		(parsed.Scheme != "http" && parsed.Scheme != "https") {
		return "-"
	}
	return (&url.URL{Scheme: parsed.Scheme, Host: parsed.Host, Path: parsed.Path}).String()
}

func errorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}
	status, message := http.StatusInternalServerError, "服务暂不可用，请稍后重试"
	var business *response.BusinessError
	var httpError *echo.HTTPError
	if errors.As(err, &business) {
		status, message = business.Status, business.Message
	} else if errors.As(err, &httpError) {
		status = httpError.Code
		switch status {
		case http.StatusBadRequest:
			message = "请求参数无效"
		case http.StatusNotFound:
			message = "接口不存在"
		case http.StatusMethodNotAllowed:
			message = "请求方法不支持"
		case http.StatusRequestEntityTooLarge:
			message = "请求内容超过大小限制"
		case http.StatusForbidden:
			message = "请求来源校验失败"
		case http.StatusServiceUnavailable, http.StatusGatewayTimeout:
			message = "请求处理超时，请稍后重试"
		}
	}
	response.RecordInternal(c.Request().Context(), err)
	if sendErr := response.Failure(c, status, message); sendErr != nil {
		logger.Logger.WithContext(c.Request().Context()).Errorf(
			"Response write failed; status: %s", strconv.Itoa(status),
		)
	}
}

package httpd

import (
	"context"
	"errors"
	"net"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
)

// New 创建 HTTP 服务。
func New() *echo.Echo {
	engine := echo.New()
	engine.HideBanner = true
	engine.HidePort = true
	engine.HTTPErrorHandler = errorHandler
	cfg := config.Config.HTTP
	engine.Server.Addr = config.Config.App.Addr
	engine.Server.ReadHeaderTimeout = cfg.ReadHeaderTimeout
	engine.Server.ReadTimeout = cfg.ReadTimeout
	engine.Server.WriteTimeout = cfg.WriteTimeout
	engine.Server.IdleTimeout = cfg.IdleTimeout
	engine.Server.MaxHeaderBytes = cfg.MaxHeaderBytes
	trusted := make([]echo.TrustOption, 0, 3+len(cfg.TrustedProxyCIDRs))
	trusted = append(trusted,
		echo.TrustLoopback(false), echo.TrustPrivateNet(false), echo.TrustLinkLocal(false),
	)
	for _, cidr := range cfg.TrustedProxyCIDRs {
		_, network, _ := net.ParseCIDR(cidr)
		trusted = append(trusted, echo.TrustIPRange(network))
	}
	engine.IPExtractor = echo.ExtractIPFromXFFHeader(trusted...)
	engine.Use(traceRequests, requestLogger)
	engine.Use(middleware.RecoverWithConfig(middleware.RecoverConfig{
		LogErrorFunc: func(c echo.Context, err error, _ []byte) error {
			logger.Logger.WithContext(c.Request().Context()).Error("Request handler panicked")
			return err
		},
	}))
	engine.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XSSProtection: "0", ContentTypeNosniff: "nosniff", XFrameOptions: "DENY",
		ReferrerPolicy: "no-referrer",
	}))
	engine.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: cfg.CORSAllowOrigins, AllowCredentials: true,
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders: []string{
			echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept,
			"X-CSRF-Protection", "traceparent", "tracestate",
		},
		ExposeHeaders: []string{"X-Trace-ID"},
	}))
	engine.Use(middleware.ContextTimeoutWithConfig(middleware.ContextTimeoutConfig{
		Timeout: cfg.RequestTimeout,
	}))
	engine.Use(identify, csrfProtection, middleware.BodyLimit(cfg.BodyLimit))
	register(engine)
	return engine
}

// Serve 启动 HTTP 服务并处理退出信号。
func Serve(ctx context.Context) error {
	engine := New()
	results := make(chan error, 1)
	go func() { results <- engine.StartServer(engine.Server) }()
	logger.Logger.Info("API starting")
	select {
	case err := <-results:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return errors.New("API listener failed")
	case <-ctx.Done():
		shutdown, cancel := context.WithTimeout(
			context.Background(),
			config.Config.App.ShutdownTimeout,
		)
		defer cancel()
		if err := engine.Shutdown(shutdown); err != nil {
			return errors.Join(err, engine.Close())
		}
		return nil
	}
}

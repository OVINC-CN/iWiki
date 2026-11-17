package config

import (
	"errors"
	"net"
	"net/url"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

func (cfg *Settings) validate() error {
	// 校验基础地址和 HTTP 资源边界。
	if cfg.App.Name == "" || cfg.App.Environment == "" || cfg.App.Addr == "" {
		return errors.New("application name, environment and listen address are required")
	}
	if _, err := logrus.ParseLevel(cfg.App.LogLevel); err != nil {
		return errors.New("invalid log level")
	}
	if _, err := time.LoadLocation(cfg.App.Timezone); err != nil {
		return errors.New("invalid application timezone")
	}
	if !validURL(cfg.App.FrontendURL, false) {
		return errors.New("frontend URL must be a valid HTTP(S) origin")
	}
	if len(cfg.HTTP.CORSAllowOrigins) == 0 || cfg.HTTP.BodyLimit == "" ||
		cfg.HTTP.MaxHeaderBytes < 1024 || cfg.HTTP.DefaultPageSize < 1 ||
		cfg.HTTP.MaxPageSize < cfg.HTTP.DefaultPageSize {
		return errors.New("invalid HTTP limits")
	}
	frontendAllowed := false
	for _, origin := range cfg.HTTP.CORSAllowOrigins {
		if !validURL(origin, false) {
			return errors.New("CORS origins must be explicit HTTP(S) origins")
		}
		frontendAllowed = frontendAllowed || origin == cfg.App.FrontendURL
	}
	if !frontendAllowed {
		return errors.New("CORS origins must include the frontend origin")
	}
	for _, cidr := range cfg.HTTP.TrustedProxyCIDRs {
		if _, _, err := net.ParseCIDR(cidr); err != nil {
			return errors.New("invalid trusted proxy CIDR")
		}
	}

	// 校验超时和有效期。
	durations := []time.Duration{
		cfg.App.ShutdownTimeout,
		cfg.HTTP.RequestTimeout,
		cfg.HTTP.ReadHeaderTimeout,
		cfg.HTTP.ReadTimeout,
		cfg.HTTP.WriteTimeout,
		cfg.HTTP.IdleTimeout,
		cfg.HTTP.HealthCheckTimeout,
		cfg.MySQL.ConnMaxLifetime,
		cfg.MySQL.ConnectTimeout,
		cfg.MySQL.ReadTimeout,
		cfg.MySQL.WriteTimeout,
		cfg.Redis.DialTimeout,
		cfg.Redis.ReadTimeout,
		cfg.Redis.WriteTimeout,
		cfg.Redis.PoolTimeout,
		cfg.Redis.PingTimeout,
		cfg.OIDC.RequestTimeout,
		cfg.OIDC.StateTTL,
		cfg.OIDC.LoginWindow,
		cfg.Session.TTL,
		cfg.COS.RequestTimeout,
		cfg.COS.CredentialTTL,
		cfg.Trace.ExportTimeout,
		cfg.Trace.BatchTimeout,
	}
	for _, duration := range durations {
		if duration <= 0 {
			return errors.New("all durations must be positive")
		}
	}
	if cfg.HTTP.WriteTimeout <= cfg.HTTP.RequestTimeout ||
		cfg.MySQL.MaxOpenConns < 1 || cfg.MySQL.MaxIdleConns < 0 ||
		cfg.MySQL.TransactionRetries < 0 || cfg.MySQL.TransactionRetries > 10 ||
		cfg.MySQL.MaxIdleConns > cfg.MySQL.MaxOpenConns || cfg.Redis.PoolSize < 1 ||
		cfg.Redis.DB < 0 || cfg.Redis.MaxRetries < 0 || cfg.Redis.Prefix == "" {
		return errors.New("invalid timeout or connection pool settings")
	}

	// 校验身份提供方和回调地址。
	if cfg.OIDC.Issuer != "" && (!validURL(cfg.OIDC.Issuer, true) ||
		cfg.OIDC.ClientID == "") {
		return errors.New("invalid OIDC configuration")
	}
	callback, err := url.Parse(cfg.OIDC.RedirectURL)
	if err != nil || !validURL(cfg.OIDC.RedirectURL, true) ||
		callback.Path != "/v1/auth/oidc/callback" {
		return errors.New("invalid OIDC callback URL")
	}
	if cfg.OIDC.LoginRate < 1 || cfg.OIDC.StateTTL < time.Second ||
		cfg.OIDC.StateTTL > time.Hour || cfg.OIDC.LoginWindow < time.Second ||
		cfg.Session.TTL < time.Second || !validCookieName(cfg.Session.CookieName) {
		return errors.New("invalid login limits or session settings")
	}
	if cfg.App.Environment == "production" && (!cfg.Session.CookieSecure ||
		!strings.HasPrefix(cfg.App.FrontendURL, "https://") ||
		!strings.HasPrefix(cfg.OIDC.RedirectURL, "https://") ||
		(cfg.OIDC.Issuer != "" && !strings.HasPrefix(cfg.OIDC.Issuer, "https://"))) {
		return errors.New("production requires HTTPS and secure cookies")
	}

	// 校验搜索类型和上传参数。
	switch cfg.Document.SearchType {
	case "", "title", "content", "all":
	default:
		return errors.New("invalid document search type")
	}
	if cfg.Document.MaxContentBytes < 1 || cfg.Document.MaxTags < 1 ||
		cfg.Document.MaxSearchValues < 1 {
		return errors.New("invalid document limits")
	}
	if cfg.COS.Enabled && (cfg.COS.SecretID == "" || cfg.COS.SecretKey == "" ||
		cfg.COS.Region == "" || !strings.Contains(cfg.COS.Bucket, "-") ||
		!validURL(cfg.COS.URL, true) || cfg.COS.STSEndpoint == "") {
		return errors.New("incomplete COS configuration")
	}
	if cfg.COS.MaxFileBytes < 1 || cfg.COS.CredentialTTL < 120*time.Second ||
		cfg.COS.CredentialTTL > 2*time.Hour || cfg.COS.CDNParameter == "" {
		return errors.New("invalid COS expiration or limits")
	}
	if cfg.Trace.MaxExportBatchSize < 1 ||
		cfg.Trace.MaxQueueSize < cfg.Trace.MaxExportBatchSize ||
		(cfg.Trace.ReportEnabled && cfg.Trace.Endpoint == "") {
		return errors.New("invalid tracing configuration")
	}
	return nil
}

func validURL(value string, allowPath bool) bool {
	parsed, err := url.Parse(value)
	return err == nil && parsed.Host != "" && parsed.User == nil &&
		(parsed.Scheme == "http" || parsed.Scheme == "https") &&
		parsed.RawQuery == "" && parsed.Fragment == "" && !parsed.ForceQuery &&
		!strings.Contains(value, "#") &&
		(allowPath || parsed.Path == "") && !strings.ContainsAny(value, "\r\n\\")
}

func validCookieName(value string) bool {
	for _, char := range value {
		if char < 33 || char > 126 {
			return false
		}
	}
	return value != "" && !strings.ContainsAny(value, " ()<>@,;:\\\"/[]?={}\t\r\n") &&
		!strings.HasPrefix(value, "__Host-") && !strings.HasPrefix(value, "__Secure-")
}

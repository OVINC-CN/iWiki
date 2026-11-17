package config

import "time"

// Settings 保存仅从 YAML 加载的运行配置。
type Settings struct {
	App      AppConfig      `yaml:"app"`
	HTTP     HTTPConfig     `yaml:"http"`
	MySQL    MySQLConfig    `yaml:"mysql"`
	Redis    RedisConfig    `yaml:"redis"`
	OIDC     OIDCConfig     `yaml:"oidc"`
	Session  SessionConfig  `yaml:"session"`
	Document DocumentConfig `yaml:"document"`
	COS      COSConfig      `yaml:"cos"`
	Trace    TraceConfig    `yaml:"trace"`
}

type AppConfig struct {
	Name            string        `yaml:"name"`
	Environment     string        `yaml:"environment"`
	Timezone        string        `yaml:"timezone"`
	Debug           bool          `yaml:"debug"`
	Addr            string        `yaml:"addr"`
	LogLevel        string        `yaml:"log_level"`
	FrontendURL     string        `yaml:"frontend_url"`
	ShutdownTimeout time.Duration `yaml:"shutdown_timeout"`
}

type HTTPConfig struct {
	CORSAllowOrigins   []string      `yaml:"cors_allow_origins"`
	TrustedProxyCIDRs  []string      `yaml:"trusted_proxy_cidrs"`
	RequestTimeout     time.Duration `yaml:"request_timeout"`
	ReadHeaderTimeout  time.Duration `yaml:"read_header_timeout"`
	ReadTimeout        time.Duration `yaml:"read_timeout"`
	WriteTimeout       time.Duration `yaml:"write_timeout"`
	IdleTimeout        time.Duration `yaml:"idle_timeout"`
	HealthCheckTimeout time.Duration `yaml:"health_check_timeout"`
	BodyLimit          string        `yaml:"body_limit"`
	MaxHeaderBytes     int           `yaml:"max_header_bytes"`
	DefaultPageSize    int           `yaml:"default_page_size"`
	MaxPageSize        int           `yaml:"max_page_size"`
}

type MySQLConfig struct {
	TransactionRetries int           `yaml:"transaction_retries"`
	DSN                string        `yaml:"dsn"`
	MaxOpenConns       int           `yaml:"max_open_conns"`
	MaxIdleConns       int           `yaml:"max_idle_conns"`
	ConnMaxLifetime    time.Duration `yaml:"conn_max_lifetime"`
	ConnectTimeout     time.Duration `yaml:"connect_timeout"`
	ReadTimeout        time.Duration `yaml:"read_timeout"`
	WriteTimeout       time.Duration `yaml:"write_timeout"`
}

type RedisConfig struct {
	Addr         string        `yaml:"addr"`
	Password     string        `yaml:"password"`
	DB           int           `yaml:"db"`
	Prefix       string        `yaml:"prefix"`
	DialTimeout  time.Duration `yaml:"dial_timeout"`
	ReadTimeout  time.Duration `yaml:"read_timeout"`
	WriteTimeout time.Duration `yaml:"write_timeout"`
	PoolTimeout  time.Duration `yaml:"pool_timeout"`
	PingTimeout  time.Duration `yaml:"ping_timeout"`
	PoolSize     int           `yaml:"pool_size"`
	MaxRetries   int           `yaml:"max_retries"`
}

type OIDCConfig struct {
	Issuer         string        `yaml:"issuer"`
	ClientID       string        `yaml:"client_id"`
	ClientSecret   string        `yaml:"client_secret"`
	RedirectURL    string        `yaml:"redirect_url"`
	RequestTimeout time.Duration `yaml:"request_timeout"`
	StateTTL       time.Duration `yaml:"state_ttl"`
	LoginRate      int           `yaml:"login_rate"`
	LoginWindow    time.Duration `yaml:"login_window"`
}

type SessionConfig struct {
	TTL           time.Duration `yaml:"ttl"`
	CookieName    string        `yaml:"cookie_name"`
	CookieDomain  string        `yaml:"cookie_domain"`
	CookieSecure  bool          `yaml:"cookie_secure"`
	UserWhitelist []string      `yaml:"user_whitelist"`
}

type DocumentConfig struct {
	SearchType      string `yaml:"search_type"`
	MaxContentBytes int    `yaml:"max_content_bytes"`
	MaxTags         int    `yaml:"max_tags"`
	MaxSearchValues int    `yaml:"max_search_values"`
}

type COSConfig struct {
	Enabled        bool          `yaml:"enabled"`
	SecretID       string        `yaml:"secret_id"`
	SecretKey      string        `yaml:"secret_key"`
	Region         string        `yaml:"region"`
	Bucket         string        `yaml:"bucket"`
	URL            string        `yaml:"url"`
	STSEndpoint    string        `yaml:"sts_endpoint"`
	CredentialTTL  time.Duration `yaml:"credential_ttl"`
	RequestTimeout time.Duration `yaml:"request_timeout"`
	MaxFileBytes   int64         `yaml:"max_file_bytes"`
	CDNSigningKey  string        `yaml:"cdn_signing_key"`
	CDNParameter   string        `yaml:"cdn_parameter"`
}

type TraceConfig struct {
	ReportEnabled      bool              `yaml:"report_enabled"`
	Endpoint           string            `yaml:"endpoint"`
	Insecure           bool              `yaml:"insecure"`
	Headers            map[string]string `yaml:"headers"`
	ExportTimeout      time.Duration     `yaml:"export_timeout"`
	BatchTimeout       time.Duration     `yaml:"batch_timeout"`
	MaxQueueSize       int               `yaml:"max_queue_size"`
	MaxExportBatchSize int               `yaml:"max_export_batch_size"`
}

package db

import (
	"context"
	"errors"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
	"github.com/redis/go-redis/v9/maintnotifications"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	gormmysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
	gormtracing "gorm.io/plugin/opentelemetry/tracing"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
	"github.com/OVINC-CN/iWiki/src/api/internal/tracing"
)

var database *gorm.DB
var redisClient *redis.Client

func init() {
	// 初始化已配置的连接池。
	if config.Config.MySQL.DSN != "" {
		initializeMySQL()
	}
	if config.Config.Redis.Addr != "" {
		initializeRedis()
	}

	// 检查数据库和缓存连接。
	if err := Ping(context.Background()); err != nil {
		_ = Close()
		logger.Logger.Fatal("Database or cache connectivity check failed")
	}
}

func initializeMySQL() {
	cfg := config.Config.MySQL
	dsn, err := mysql.ParseDSN(cfg.DSN)
	if err != nil {
		logger.Logger.Fatal("Invalid MySQL connection settings")
	}
	dsn.ParseTime = true
	dsn.Loc = time.UTC
	dsn.Timeout = cfg.ConnectTimeout
	dsn.ReadTimeout = cfg.ReadTimeout
	dsn.WriteTimeout = cfg.WriteTimeout
	if dsn.Params == nil {
		dsn.Params = make(map[string]string)
	}
	dsn.Params["time_zone"] = "'+00:00'"
	dsn.Params["charset"] = "utf8mb4"

	// 创建 MySQL 连接池并注册查询追踪。
	database, err = gorm.Open(gormmysql.New(gormmysql.Config{
		DSNConfig:                 dsn,
		SkipInitializeWithVersion: true,
		DontSupportForShareClause: true,
	}), &gorm.Config{
		DisableAutomaticPing: true,
		Logger:               gormlogger.Discard,
	})
	if err != nil {
		logger.Logger.Fatal("MySQL client initialization failed")
	}
	serverAddress := dsn.Addr
	if err := database.Use(gormtracing.NewPlugin(
		gormtracing.WithTracerProvider(tracing.Provider),
		gormtracing.WithoutQueryVariables(),
		gormtracing.WithoutMetrics(),
		gormtracing.WithServerAddressProvider(func(gorm.Dialector) string { return serverAddress }),
	)); err != nil {
		logger.Logger.Fatal("MySQL trace initialization failed")
	}
	pool, err := database.DB()
	if err != nil {
		logger.Logger.Fatal("MySQL connection pool initialization failed")
	}
	pool.SetMaxOpenConns(cfg.MaxOpenConns)
	pool.SetMaxIdleConns(cfg.MaxIdleConns)
	pool.SetConnMaxLifetime(cfg.ConnMaxLifetime)
}

func initializeRedis() {
	cfg := config.Config.Redis
	retries := cfg.MaxRetries
	if retries == 0 {
		retries = -1
	}
	redisClient = redis.NewClient(&redis.Options{
		Addr:                  cfg.Addr,
		Password:              cfg.Password,
		DB:                    cfg.DB,
		ContextTimeoutEnabled: true,
		DialTimeout:           cfg.DialTimeout,
		ReadTimeout:           cfg.ReadTimeout,
		WriteTimeout:          cfg.WriteTimeout,
		PoolTimeout:           cfg.PoolTimeout,
		PoolSize:              cfg.PoolSize,
		MaxRetries:            retries,
		DisableIdentity:       true,
		MaintNotificationsConfig: &maintnotifications.Config{
			Mode: maintnotifications.ModeDisabled,
		},
	})
	if err := redisotel.InstrumentTracing(
		redisClient,
		redisotel.WithTracerProvider(tracing.Provider),
		redisotel.WithDBStatement(false),
	); err != nil {
		logger.Logger.Fatal("Redis trace initialization failed")
	}
}

// DB 返回数据库连接池。
func DB() *gorm.DB { return database }

// RDB 返回共享 Redis 客户端。
func RDB() *redis.Client { return redisClient }

// Ping 检查数据库和缓存连接。
func Ping(ctx context.Context) error {
	var mysqlErr, redisErr error
	if database != nil {
		checkContext, cancel := context.WithTimeout(ctx, config.Config.MySQL.ConnectTimeout)
		checkContext, span := tracing.Tracer.Start(
			checkContext, "mysql.ping", trace.WithSpanKind(trace.SpanKindClient),
		)
		pool, err := database.DB()
		if err == nil {
			err = pool.PingContext(checkContext)
		}
		if err != nil {
			span.RecordError(errors.New("database connectivity check failed"))
			span.SetStatus(codes.Error, "database connectivity check failed")
		}
		mysqlErr = err
		span.End()
		cancel()
	}
	if redisClient != nil {
		checkContext, cancel := context.WithTimeout(ctx, config.Config.Redis.PingTimeout)
		redisErr = redisClient.Ping(checkContext).Err()
		cancel()
	}
	return errors.Join(mysqlErr, redisErr)
}

// Close 在请求完成后统一关闭连接池。
func Close() error {
	var mysqlErr, redisErr error
	if database != nil {
		pool, err := database.DB()
		if err == nil {
			err = pool.Close()
		}
		mysqlErr = err
	}
	if redisClient != nil {
		redisErr = redisClient.Close()
	}
	return errors.Join(mysqlErr, redisErr)
}

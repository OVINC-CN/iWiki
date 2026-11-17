package tencentcdn

import (
	"context"
	"crypto/md5" // #nosec G501 -- CDN 方式 A 使用 MD5。
	"encoding/hex"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/secure"
)

// SignPath 生成 CDN 方式 A 签名，并在缓存有效期内复用同一路径的签名。
func SignPath(ctx context.Context, path string) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	cfg := config.Config.COS
	if cfg.CDNSigningKey == "" {
		return "", nil
	}

	// Redis 不可用时即时签名，不影响资源读取。
	client := db.RDB()
	key := signatureCacheKey(path)
	cacheAvailable := client != nil
	if cacheAvailable {
		cached, err := client.Get(ctx, key).Result()
		if err == nil && cached != "" {
			return cached, nil
		}
		cacheAvailable = err == nil || errors.Is(err, redis.Nil)
	}
	if err := ctx.Err(); err != nil {
		return "", err
	}
	value, err := generateSignature(path, cfg.CDNSigningKey, time.Now())
	if err != nil {
		return "", err
	}

	// 并发写入只保留首个签名且不续期。
	if cacheAvailable {
		stored, err := client.SetNX(ctx, key, value, cfg.CDNCacheTTL).Result()
		if err == nil && !stored {
			cached, err := client.Get(ctx, key).Result()
			if err == nil && cached != "" {
				return cached, nil
			}
		}
	}
	if err := ctx.Err(); err != nil {
		return "", err
	}
	return value, nil
}

func signatureCacheKey(path string) string {
	cfg := config.Config.COS
	// 域名、路径和签名配置共同隔离缓存，键名只保存摘要。
	identity := strings.Join([]string{
		cfg.URL, path, cfg.CDNSigningKey, cfg.CDNCacheTTL.String(),
	}, "\x00")
	return config.Config.Redis.Prefix + "cdn:sign:" + secure.Digest(identity)
}

func generateSignature(path, signingKey string, now time.Time) (string, error) {
	nonce, err := secure.ID()
	if err != nil {
		return "", err
	}
	stamp := strconv.FormatInt(now.Unix(), 10)
	input := path + "-" + stamp + "-" + nonce + "-0-" + signingKey
	sum := md5.Sum([]byte(input)) // #nosec G401 -- CDN 方式 A 使用 MD5。
	return stamp + "-" + nonce + "-0-" + hex.EncodeToString(sum[:]), nil
}

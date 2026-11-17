package tencentcdn

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/secure"
)

func configureSigning(t *testing.T) {
	t.Helper()
	previous, previousPrefix := config.Config.COS, config.Config.Redis.Prefix
	config.Config.COS = config.COSConfig{
		URL: "https://cdn.example.com", CDNSigningKey: strings.Repeat("x", 32),
		CDNParameter: "eo-sign", CDNCacheTTL: 30 * time.Minute,
	}
	id, err := secure.ID()
	if err != nil {
		t.Fatal("Failed to generate the test cache prefix")
	}
	prefix := "iwiki:test:cdn:" + id + ":"
	config.Config.Redis.Prefix = prefix
	t.Cleanup(func() {
		config.Config.COS, config.Config.Redis.Prefix = previous, previousPrefix
		if client := db.RDB(); client != nil {
			ctx := context.Background()
			iterator := client.Scan(ctx, 0, prefix+"*", 100).Iterator()
			for iterator.Next(ctx) {
				if err := client.Del(ctx, iterator.Val()).Err(); err != nil {
					t.Error("Failed to clean up a test cache entry")
				}
			}
			if err := iterator.Err(); err != nil {
				t.Error("Failed to scan the test cache entries")
			}
		}
	})
}

func requireSignatureCache(t *testing.T) {
	t.Helper()
	if db.RDB() == nil {
		t.Skip("An isolated Redis instance is required")
	}
	configureSigning(t)
}

func signatureForTest(t *testing.T, path string) string {
	t.Helper()
	value, err := SignPath(context.Background(), path)
	if err != nil || value == "" {
		t.Fatal("Failed to generate a signature")
	}
	return value
}

func TestSignaturesReuseAcrossReads(t *testing.T) {
	requireSignatureCache(t)
	path := "/upload/%E4%B8%AD%E6%96%87.png"
	first := signatureForTest(t, path)
	for _, query := range []string{"download=1", "imageMogr2/quality/80/format/webp"} {
		input := "https://cdn.example.com" + path + "?" + query + "&eo-sign=expired"
		for range 2 {
			signed, err := Sign(context.Background(), input)
			if err != nil {
				t.Fatal("Failed to sign an owned URL")
			}
			parsed, err := url.Parse(signed)
			if err != nil || parsed.Query().Get("eo-sign") != first ||
				parsed.EscapedPath() != path || !strings.HasPrefix(parsed.RawQuery, query+"&") {
				t.Fatal(
					"Repeated reads must reuse the path signature and preserve query parameters",
				)
			}
		}
	}
	if signatureForTest(t, "/upload/other.png") == first {
		t.Fatal("Different paths must not share signatures")
	}
	ttl, err := db.RDB().PTTL(context.Background(), signatureCacheKey(path)).Result()
	if err != nil || ttl <= 29*time.Minute || ttl > 30*time.Minute {
		t.Fatal("The default cache entry must expire after thirty minutes")
	}
	key := signatureCacheKey(path)
	if strings.Contains(key, path) || strings.Contains(key, config.Config.COS.CDNSigningKey) {
		t.Fatal("Redis cache keys must not expose paths or signing keys")
	}
}

func TestSignatureCacheExpires(t *testing.T) {
	requireSignatureCache(t)
	config.Config.COS.CDNCacheTTL = 300 * time.Millisecond
	path := "/upload/example.png"
	first := signatureForTest(t, path)
	if signatureForTest(t, path) != first {
		t.Fatal("The signature must be reused before cache expiry")
	}
	ttl, err := db.RDB().PTTL(context.Background(), signatureCacheKey(path)).Result()
	if err != nil || ttl <= 0 || ttl > config.Config.COS.CDNCacheTTL {
		t.Fatal("Redis must use the configured cache TTL")
	}
	time.Sleep(ttl + 50*time.Millisecond)
	if signatureForTest(t, path) == first {
		t.Fatal("The signature must be refreshed after cache expiry")
	}
}

func TestSignatureCacheSeparatesSettings(t *testing.T) {
	tests := []struct {
		name   string
		change func()
	}{
		{"key", func() { config.Config.COS.CDNSigningKey = strings.Repeat("y", 32) }},
		{"domain", func() { config.Config.COS.URL = "https://other.example.com" }},
		{"cache TTL", func() { config.Config.COS.CDNCacheTTL = time.Minute }},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			requireSignatureCache(t)
			first := signatureForTest(t, "/upload/example.png")
			test.change()
			if signatureForTest(t, "/upload/example.png") == first {
				t.Fatal("Changed signing settings must not reuse an earlier signature")
			}
		})
	}
}

func TestSigningHonorsCancellationAndDisabledSigning(t *testing.T) {
	configureSigning(t)
	path := "/upload/example.png"
	_ = signatureForTest(t, path)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	for _, value := range []string{path, "/upload/uncached.png"} {
		if signature, err := SignPath(ctx, value); !errors.Is(err, context.Canceled) ||
			signature != "" {
			t.Fatal("Canceled requests must not return cached or new signatures")
		}
	}
	config.Config.COS.CDNSigningKey = ""
	if value, err := SignPath(context.Background(), path); err != nil || value != "" {
		t.Fatal("Disabled signing must not return a cached signature")
	}
}

func TestSigningWithoutRedis(t *testing.T) {
	if db.RDB() != nil {
		t.Skip("This test requires Redis to be unconfigured")
	}
	configureSigning(t)
	first := signatureForTest(t, "/upload/example.png")
	if signatureForTest(t, "/upload/example.png") == first {
		t.Fatal("Signing without Redis must generate fresh signatures")
	}
}

func TestSignatureCacheSharesConcurrentRequests(t *testing.T) {
	requireSignatureCache(t)
	results := make(chan string, 32)
	var group sync.WaitGroup
	for range cap(results) {
		group.Go(func() {
			value, err := SignPath(context.Background(), "/upload/example.png")
			if err != nil {
				t.Error("Concurrent signing failed")
			}
			results <- value
		})
	}
	group.Wait()
	close(results)
	first := signatureForTest(t, "/upload/example.png")
	for value := range results {
		if value != first {
			t.Fatal("Concurrent requests must share the first cached signature")
		}
	}
}

type cacheFailureHook struct {
	prefix  string
	command string
}

func (hook cacheFailureHook) DialHook(next redis.DialHook) redis.DialHook { return next }

func (hook cacheFailureHook) ProcessHook(next redis.ProcessHook) redis.ProcessHook {
	return func(ctx context.Context, command redis.Cmder) error {
		var key string
		if args := command.Args(); len(args) > 1 {
			key, _ = args[1].(string)
		}
		if command.Name() == hook.command && strings.HasPrefix(key, hook.prefix) {
			return errors.New("test cache operation failed")
		}
		return next(ctx, command)
	}
}

func (hook cacheFailureHook) ProcessPipelineHook(
	next redis.ProcessPipelineHook,
) redis.ProcessPipelineHook {
	return next
}

func TestSignatureCacheFailureFallsBack(t *testing.T) {
	for _, command := range []string{"get", "set"} {
		t.Run(command, func(t *testing.T) {
			requireSignatureCache(t)
			db.RDB().AddHook(cacheFailureHook{prefix: config.Config.Redis.Prefix, command: command})
			first := signatureForTest(t, "/upload/example.png")
			if signatureForTest(t, "/upload/example.png") == first {
				t.Fatal("Cache failures must fall back to fresh signatures")
			}
		})
	}
}

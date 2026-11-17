package tencentcdn

import (
	"context"
	"net/url"
	"regexp"
	"strings"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
)

var markdownURL = regexp.MustCompile(`(\[[^\]]*\]\()(https?://[^\s)]+)(\))`)
var htmlURL = regexp.MustCompile(`(?i)((?:src|href)=["'])(https?://[^"']+)(["'])`)

// Sign 为配置域名的资源地址签名。
func Sign(ctx context.Context, value string) (string, error) {
	parsed, ok := owned(value)
	if !ok {
		return value, nil
	}
	cfg := config.Config.COS
	removeSignature(parsed)
	if cfg.CDNSigningKey != "" {
		signature, err := SignPath(ctx, parsed.EscapedPath())
		if err != nil {
			return "", err
		}
		query := url.Values{cfg.CDNParameter: []string{signature}}.Encode()
		if parsed.RawQuery == "" {
			parsed.RawQuery = query
		} else {
			parsed.RawQuery += "&" + query
		}
	}
	return parsed.String(), nil
}

// Normalize 移除资源地址中的签名参数。
func Normalize(value string) string {
	parsed, ok := owned(value)
	if !ok {
		return value
	}
	removeSignature(parsed)
	return parsed.String()
}

// Content 批量处理 Markdown 和 HTML 资源引用，同次读取复用重复链接。
func Content(ctx context.Context, value string, sign bool) (string, error) {
	cache := make(map[string]string)
	var conversionErr error
	for _, expression := range []*regexp.Regexp{markdownURL, htmlURL} {
		value = expression.ReplaceAllStringFunc(value, func(match string) string {
			if conversionErr != nil {
				return match
			}
			parts := expression.FindStringSubmatch(match)
			converted, exists := cache[parts[2]]
			if !exists {
				converted = Normalize(parts[2])
				if sign {
					converted, conversionErr = Sign(ctx, converted)
				}
				cache[parts[2]] = converted
			}
			return parts[1] + converted + parts[3]
		})
	}
	return value, conversionErr
}

func removeSignature(parsed *url.URL) {
	// 移除签名参数并保留其他查询参数。
	parts := make([]string, 0)
	for _, part := range strings.Split(parsed.RawQuery, "&") {
		key, _, _ := strings.Cut(part, "=")
		decoded, err := url.QueryUnescape(key)
		if part != "" && (err != nil || decoded != config.Config.COS.CDNParameter) {
			parts = append(parts, part)
		}
	}
	parsed.RawQuery = strings.Join(parts, "&")
}

func owned(value string) (*url.URL, bool) {
	base, err := url.Parse(config.Config.COS.URL)
	if err != nil || base.Host == "" || value == "" {
		return nil, false
	}
	parsed, err := url.Parse(value)
	return parsed, err == nil && parsed.User == nil &&
		(parsed.Scheme == "http" || parsed.Scheme == "https") &&
		strings.EqualFold(parsed.Host, base.Host)
}

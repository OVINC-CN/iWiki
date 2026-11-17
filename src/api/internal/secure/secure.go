package secure

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"net/url"
	"strings"
	"unicode"
)

// Random 生成不含分隔符的密码学随机字符串。
func Random(bytes int) (string, error) {
	data := make([]byte, bytes)
	if _, err := rand.Read(data); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(data), nil
}

// ID 生成 32 位随机十六进制编号。
func ID() (string, error) {
	var data [16]byte
	if _, err := rand.Read(data[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(data[:]), nil
}

// Digest 计算 SHA-256 摘要。
func Digest(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

// ReturnPath 仅允许站内业务路径，保留查询和锚点。
func ReturnPath(value string) string {
	if value == "" || !strings.HasPrefix(value, "/") || strings.HasPrefix(value, "//") ||
		strings.Contains(value, "\\") || strings.IndexFunc(value, unicode.IsControl) >= 0 {
		return "/"
	}
	parsed, err := url.Parse(value)
	if err != nil || parsed.IsAbs() || parsed.Host != "" ||
		strings.HasPrefix(parsed.Path, "//") || strings.Contains(parsed.Path, "\\") ||
		strings.IndexFunc(parsed.Path, unicode.IsControl) >= 0 ||
		strings.HasPrefix(parsed.Path, "/login/") ||
		strings.HasPrefix(parsed.Path, "/v1/auth/") {
		return "/"
	}
	return parsed.String()
}

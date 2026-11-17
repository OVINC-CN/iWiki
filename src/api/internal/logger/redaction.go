package logger

import (
	"regexp"

	"github.com/sirupsen/logrus"
)

var credentialPatterns = []struct {
	pattern     *regexp.Regexp
	replacement string
}{
	{
		pattern: regexp.MustCompile(
			`(?im)(\b(?:authorization|cookie|set-cookie)["']?\s*[:=]\s*)[^\r\n]*`,
		),
		replacement: "${1}[redacted]",
	},
	{
		pattern: regexp.MustCompile(
			`(?i)(\b[\w.-]*(?:password|passwd|token|secret|credential|signature|session|api[_-]?key)` +
				`[\w.-]*["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)`,
		),
		replacement: "${1}[redacted]",
	},
	{
		pattern:     regexp.MustCompile(`\b[^:/\s@]+:[^@\s]+@`),
		replacement: "[redacted]@",
	},
	{
		pattern:     regexp.MustCompile(`\b[[:xdigit:]]{64}\b`),
		replacement: "[redacted]",
	},
	{
		pattern:     regexp.MustCompile(`\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}`),
		replacement: "[redacted]",
	},
	{
		pattern:     regexp.MustCompile(`\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b`),
		replacement: "[redacted]",
	},
}

type credentialHook struct{}

func (credentialHook) Levels() []logrus.Level { return logrus.AllLevels }

func (credentialHook) Fire(entry *logrus.Entry) error {
	// 底层异常可能回显连接凭据、会话摘要或签名参数，输出前统一脱敏。
	entry.Message = redactCredentials(entry.Message)
	return nil
}

func redactCredentials(message string) string {
	for _, rule := range credentialPatterns {
		message = rule.pattern.ReplaceAllString(message, rule.replacement)
	}
	return message
}

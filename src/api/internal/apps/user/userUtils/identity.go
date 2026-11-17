package userUtils

import (
	"context"
	"net/http"
	"time"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
)

type identityKey struct{}

// Identity 保存已认证账号及会话摘要。
type Identity struct {
	User          userModels.User
	SessionDigest string
}

// WithIdentity 将中间件确认的身份写入请求上下文。
func WithIdentity(ctx context.Context, identity Identity) context.Context {
	return context.WithValue(ctx, identityKey{}, identity)
}

// Current 读取请求身份。
func Current(ctx context.Context) Identity {
	identity, _ := ctx.Value(identityKey{}).(Identity)
	return identity
}

// Info 返回请求账号的基本资料。
func Info(ctx context.Context) userModels.Info {
	user := Current(ctx).User
	return userModels.Info{
		Username:  user.Username,
		NickName:  user.NickName,
		UserType:  user.UserType,
		LastLogin: user.LastLogin,
	}
}

// Cookie 统一设置登录 Cookie 的安全属性。
func Cookie(name, value string, ttl time.Duration) *http.Cookie {
	cfg := config.Config.Session
	expires := time.Now().Add(ttl)
	maxAge := max(1, int(ttl.Seconds()))
	if ttl <= 0 {
		expires = time.Unix(1, 0)
		maxAge = -1
	}
	// #nosec G124 -- 本地 HTTP 由 YAML 关闭 Secure；生产配置强制开启，其他安全属性固定。
	return &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		Domain:   cfg.CookieDomain,
		Secure:   cfg.CookieSecure,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   maxAge,
		Expires:  expires,
	}
}

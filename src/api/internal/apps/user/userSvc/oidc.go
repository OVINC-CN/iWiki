package userSvc

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/redis/go-redis/v9"

	"github.com/OVINC-CN/iWiki/src/api/internal/apis/oidc"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
	"github.com/OVINC-CN/iWiki/src/api/internal/secure"
)

var loginRate = redis.NewScript(`
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return count
`)

var consumeState = redis.NewScript(`
local value = redis.call('GET', KEYS[1])
if value ~= ARGV[1] then return false end
redis.call('DEL', KEYS[1])
return value
`)

// BeginLogin 限制发起频率并保存绑定浏览器的一次性状态。
func BeginLogin(ctx context.Context, returnTo, clientIP string) (string, string, error) {
	key := config.Config.Redis.Prefix + "login-rate:" + secure.Digest(clientIP)
	count, err := loginRate.Run(ctx, db.RDB(), []string{key},
		config.Config.OIDC.LoginWindow.Milliseconds()).Int()
	if err != nil {
		return "", "", err
	}
	if count > config.Config.OIDC.LoginRate {
		return "", "", response.Error(http.StatusTooManyRequests, "登录请求过于频繁，请稍后重试")
	}

	// 状态、随机数、浏览器凭据及 PKCE 均独立生成。
	values := make([]string, 4)
	for index := range values {
		value, err := secure.Random(32)
		if err != nil {
			return "", "", err
		}
		values[index] = value
	}
	state, nonce, browser, verifier := values[0], values[1], values[2], values[3]
	pending := userModels.LoginState{
		Nonce:       nonce,
		Verifier:    verifier,
		BrowserHash: secure.Digest(browser),
		ReturnTo:    secure.ReturnPath(returnTo),
	}
	data, err := json.Marshal(pending)
	if err != nil {
		return "", "", err
	}
	if err := db.RDB().
		Set(ctx, stateKey(state), data, config.Config.OIDC.StateTTL).
		Err(); err != nil {
		return "", "", err
	}
	return oidc.AuthorizationURL(state, nonce, verifier), browser, nil
}

// ConsumeLogin 校验浏览器绑定并消费登录状态。
func ConsumeLogin(ctx context.Context, state, browser string) (userModels.LoginState, error) {
	invalid := response.Error(http.StatusUnauthorized, "登录请求已失效，请重新登录")
	if len(state) != 43 || len(browser) != 43 {
		return userModels.LoginState{}, invalid
	}
	value, err := db.RDB().Get(ctx, stateKey(state)).Result()
	if errors.Is(err, redis.Nil) {
		return userModels.LoginState{}, invalid
	}
	if err != nil {
		return userModels.LoginState{}, err
	}
	var pending userModels.LoginState
	if json.Unmarshal([]byte(value), &pending) != nil ||
		subtle.ConstantTimeCompare(
			[]byte(pending.BrowserHash),
			[]byte(secure.Digest(browser)),
		) != 1 {
		return userModels.LoginState{}, invalid
	}
	consumed, err := consumeState.Run(ctx, db.RDB(), []string{stateKey(state)}, value).Text()
	if errors.Is(err, redis.Nil) || (err == nil && consumed != value) {
		return userModels.LoginState{}, invalid
	}
	if err != nil {
		return userModels.LoginState{}, err
	}
	return pending, nil
}

func stateKey(state string) string {
	return config.Config.Redis.Prefix + "oidc-state:" + secure.Digest(state)
}

// FinishLogin 验证登录结果并创建会话。
func FinishLogin(
	ctx context.Context,
	state, browser, code, providerError string,
) (string, string, error) {
	pending, err := ConsumeLogin(ctx, state, browser)
	if err != nil {
		return "", "", err
	}
	if providerError != "" || code == "" {
		return "", "", response.Error(http.StatusUnauthorized, "身份提供方未完成授权，请重新登录")
	}
	profile, err := oidc.Exchange(ctx, code, pending.Nonce, pending.Verifier)
	if err != nil {
		return "", "", response.Error(http.StatusUnauthorized, "登录认证失败，请重新登录")
	}
	raw, err := SignIn(ctx, profile)
	if err != nil {
		return "", "", err
	}
	return raw, config.Config.App.FrontendURL + secure.ReturnPath(pending.ReturnTo), nil
}

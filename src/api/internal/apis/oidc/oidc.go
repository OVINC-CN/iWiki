package oidc

import (
	"context"
	"crypto/subtle"
	"errors"
	"net/http"

	coreoidc "github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
)

var provider *coreoidc.Provider
var oauth *oauth2.Config
var client *http.Client
var transport *http.Transport

// Profile 是经过 ID Token 验证的最小身份资料。
type Profile struct {
	Subject  string
	Nickname string
}

func init() {
	cfg := config.Config.OIDC
	if cfg.Issuer == "" {
		return
	}

	// 创建身份提供方客户端。
	transport = http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	client = &http.Client{Timeout: cfg.RequestTimeout, Transport: transport}
	ctx, cancel := context.WithTimeout(context.Background(), cfg.RequestTimeout)
	defer cancel()
	var err error
	provider, err = coreoidc.NewProvider(coreoidc.ClientContext(ctx, client), cfg.Issuer)
	if err != nil {
		logger.Logger.Fatal("OIDC discovery failed; check the identity provider configuration")
	}
	oauth = &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{coreoidc.ScopeOpenID, "profile"},
	}
}

// Enabled 表示身份提供方已经完成发现。
func Enabled() bool { return provider != nil }

// AuthorizationURL 使用标准授权码及 S256 PKCE 发起登录。
func AuthorizationURL(state, nonce, verifier string) string {
	return oauth.AuthCodeURL(
		state,
		coreoidc.Nonce(nonce),
		oauth2.S256ChallengeOption(verifier),
	)
}

// Exchange 交换授权码并验证身份令牌。
func Exchange(ctx context.Context, code, nonce, verifier string) (Profile, error) {
	ctx = coreoidc.ClientContext(ctx, client)
	token, err := oauth.Exchange(ctx, code, oauth2.VerifierOption(verifier))
	if err != nil {
		return Profile{}, errors.New("OIDC authorization code exchange failed")
	}
	raw, ok := token.Extra("id_token").(string)
	if !ok || raw == "" {
		return Profile{}, errors.New("OIDC ID token missing")
	}
	idToken, err := provider.Verifier(&coreoidc.Config{ClientID: oauth.ClientID}).Verify(ctx, raw)
	if err != nil || subtle.ConstantTimeCompare([]byte(idToken.Nonce), []byte(nonce)) != 1 {
		return Profile{}, errors.New("OIDC ID token verification failed")
	}
	var claims struct {
		Nickname string `json:"nickname"`
		Name     string `json:"name"`
		AZP      string `json:"azp"`
	}
	if err := idToken.Claims(&claims); err != nil ||
		(len(idToken.Audience) > 1 && claims.AZP != oauth.ClientID) ||
		(claims.AZP != "" && claims.AZP != oauth.ClientID) {
		return Profile{}, errors.New("OIDC claim verification failed")
	}
	if idToken.AccessTokenHash != "" {
		if err := idToken.VerifyAccessToken(token.AccessToken); err != nil {
			return Profile{}, errors.New("OIDC access token verification failed")
		}
	}
	if claims.Nickname == "" {
		claims.Nickname = claims.Name
	}
	return Profile{Subject: idToken.Subject, Nickname: claims.Nickname}, nil
}

// Close 在服务退出后释放空闲连接。
func Close() {
	if transport != nil {
		transport.CloseIdleConnections()
	}
}

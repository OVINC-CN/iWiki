package oidc

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	coreoidc "github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

func TestAuthorizationCodeVerification(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal("Failed to generate the test signing key")
	}
	verifier := "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG"
	tokens := make(map[string]string)
	var tokenMutex sync.RWMutex
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		issuer := "http://" + r.Host
		w.Header().Set("Content-Type", "application/json")
		var value any
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			value = map[string]any{
				"issuer": issuer, "authorization_endpoint": issuer + "/authorize",
				"token_endpoint": issuer + "/token", "jwks_uri": issuer + "/keys",
				"id_token_signing_alg_values_supported": []string{"RS256"},
			}
		case "/keys":
			value = map[string]any{"keys": []any{map[string]any{
				"kty": "RSA", "kid": "test", "alg": "RS256", "use": "sig",
				"n": base64.RawURLEncoding.EncodeToString(key.N.Bytes()),
				"e": base64.RawURLEncoding.EncodeToString(big.NewInt(int64(key.E)).Bytes()),
			}}}
		case "/token":
			if err := r.ParseForm(); err != nil {
				t.Error("Invalid test token request")
				return
			}
			if r.FormValue("code_verifier") != verifier {
				w.WriteHeader(http.StatusBadRequest)
				value = map[string]string{"error": "invalid_grant"}
			} else {
				tokenMutex.RLock()
				idToken := tokens[r.FormValue("code")]
				tokenMutex.RUnlock()
				value = map[string]any{
					"access_token": "test-access", "token_type": "Bearer", "expires_in": 60,
					"id_token": idToken,
				}
			}
		default:
			w.WriteHeader(http.StatusNotFound)
			value = map[string]string{"error": "not_found"}
		}
		if err := json.NewEncoder(w).Encode(value); err != nil {
			t.Error("Failed to write the test provider response")
		}
	}))
	t.Cleanup(server.Close)
	issuer := server.URL
	previousProvider, previousOAuth, previousClient := provider, oauth, client
	t.Cleanup(func() { provider, oauth, client = previousProvider, previousOAuth, previousClient })
	client = server.Client()
	client.Timeout = time.Second
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	provider, err = coreoidc.NewProvider(coreoidc.ClientContext(ctx, client), issuer)
	if err != nil {
		t.Fatal("Test provider discovery failed")
	}
	oauth = &oauth2.Config{
		ClientID: "test-client", RedirectURL: issuer + "/callback", Endpoint: provider.Endpoint(),
	}
	for _, test := range []struct {
		name    string
		changes map[string]any
		valid   bool
	}{
		{"valid token", nil, true},
		{"invalid issuer", map[string]any{"iss": "https://other.example"}, false},
		{"invalid audience", map[string]any{"aud": "other-client"}, false},
		{"invalid nonce", map[string]any{"nonce": "other-nonce"}, false},
		{"expired token", map[string]any{"exp": time.Now().Add(-time.Minute).Unix()}, false},
		{"invalid authorized party", map[string]any{"azp": "other-client"}, false},
		{"multiple audiences without authorized party", map[string]any{"aud": []string{"test-client", "other"}}, false},
		{"invalid access token hash", map[string]any{"at_hash": "invalid"}, false},
		{"invalid signature", nil, false},
		{"invalid PKCE", nil, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			claims := map[string]any{
				"iss": issuer, "sub": "existing-user", "aud": "test-client",
				"nonce": "browser-nonce", "iat": time.Now().Unix(),
				"exp": time.Now().Add(time.Minute).Unix(), "nickname": "原账号",
			}
			for field, value := range test.changes {
				claims[field] = value
			}
			tokenMutex.Lock()
			tokens[test.name] = signedToken(t, key, claims, test.name == "invalid signature")
			tokenMutex.Unlock()
			proof := verifier
			if test.name == "invalid PKCE" {
				proof = "invalid"
			}
			profile, err := Exchange(ctx, test.name, "browser-nonce", proof)
			if (err == nil) != test.valid {
				t.Fatal("Unexpected authorization code verification result")
			}
			if test.valid && (profile.Subject != "existing-user" || profile.Nickname != "原账号") {
				t.Fatal("Only verified subjects and nicknames may be returned")
			}
		})
	}
}

func signedToken(t *testing.T, key *rsa.PrivateKey, claims map[string]any, corrupt bool) string {
	t.Helper()
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256","kid":"test"}`))
	payload, err := json.Marshal(claims)
	if err != nil {
		t.Fatal("Failed to encode test claims")
	}
	value := header + "." + base64.RawURLEncoding.EncodeToString(payload)
	digest := sha256.Sum256([]byte(value))
	signature, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, digest[:])
	if err != nil {
		t.Fatal("Failed to sign the test token")
	}
	if corrupt {
		signature[0] ^= 1
	}
	return value + "." + base64.RawURLEncoding.EncodeToString(signature)
}

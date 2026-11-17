package httpd

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

func TestAllBusinessRoutesRequireLogin(t *testing.T) {
	previous := config.Config.App.Debug
	config.Config.App.Debug = true
	t.Cleanup(func() { config.Config.App.Debug = previous })
	engine := New()
	for _, route := range engine.Routes() {
		if route.Path == "/health" || route.Path == "/ready" ||
			route.Path == "/v1/auth/oidc/login" || route.Path == "/v1/auth/oidc/callback" ||
			route.Method == http.MethodOptions {
			continue
		}
		path := strings.ReplaceAll(
			strings.ReplaceAll(route.Path, ":id", "existing"),
			"*",
			"index.html",
		)
		t.Run(route.Method+" "+path, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			engine.ServeHTTP(
				recorder,
				httptest.NewRequestWithContext(context.Background(), route.Method, path, nil),
			)
			if recorder.Code != http.StatusUnauthorized {
				t.Fatalf("Unauthenticated route returned %d; expected 401", recorder.Code)
			}
			var payload map[string]any
			if json.Unmarshal(recorder.Body.Bytes(), &payload) != nil || len(payload) != 3 ||
				payload["data"] != nil || len(payload["trace"].(string)) != 32 {
				t.Fatal("Unauthenticated responses must contain a trace and null data")
			}
		})
	}
}

func TestHealthAndPreflightArePublic(t *testing.T) {
	engine := New()
	for _, path := range []string{"/health", "/ready"} {
		recorder := httptest.NewRecorder()
		engine.ServeHTTP(
			recorder,
			httptest.NewRequestWithContext(context.Background(), http.MethodGet, path, nil),
		)
		if recorder.Code == http.StatusUnauthorized ||
			!strings.Contains(recorder.Body.String(), `"data":null`) {
			t.Fatal("Probes must not require login or expose dependency details")
		}
	}
	request := httptest.NewRequestWithContext(
		context.Background(),
		http.MethodOptions,
		"/v1/docs",
		nil,
	)
	request.Header.Set(echo.HeaderOrigin, config.Config.App.FrontendURL)
	request.Header.Set(echo.HeaderAccessControlRequestMethod, http.MethodPost)
	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusNoContent {
		t.Fatal("CORS preflight must complete before business authentication")
	}
}

func TestWriteOriginAndCSRF(t *testing.T) {
	for _, test := range []struct {
		name, origin, header string
		status               int
	}{
		{"trusted origin", config.Config.App.FrontendURL, "1", http.StatusOK},
		{"missing CSRF header", config.Config.App.FrontendURL, "", http.StatusForbidden},
		{"missing origin", "", "1", http.StatusForbidden},
		{"external origin", "https://attacker.example", "1", http.StatusForbidden},
	} {
		t.Run(test.name, func(t *testing.T) {
			engine := echo.New()
			engine.HTTPErrorHandler = errorHandler
			engine.Use(traceRequests, csrfProtection)
			engine.POST(
				"/write",
				func(c echo.Context) error { return response.Success[any](c, nil) },
			)
			request := httptest.NewRequestWithContext(
				context.Background(),
				http.MethodPost,
				"/write",
				nil,
			)
			request.Header.Set(echo.HeaderOrigin, test.origin)
			request.Header.Set("X-CSRF-Protection", test.header)
			recorder := httptest.NewRecorder()
			engine.ServeHTTP(recorder, request)
			if recorder.Code != test.status {
				t.Fatalf("Unexpected origin validation status: %d", recorder.Code)
			}
		})
	}
}

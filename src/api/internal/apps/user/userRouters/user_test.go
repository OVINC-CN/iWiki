package userRouters

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

func TestInvalidCallbackParameters(t *testing.T) {
	for _, query := range []string{
		"", "?state=value", "?state=value&state=other&code=value",
		"?state=value&code=first&code=second", "?state=value&code=value&error=access_denied",
		"?state=value&error=first&error=second",
	} {
		t.Run(query, func(t *testing.T) {
			request := httptest.NewRequestWithContext(context.Background(), http.MethodGet,
				"/v1/auth/oidc/callback"+query, nil)
			context := echo.New().NewContext(request, httptest.NewRecorder())
			var business *response.BusinessError
			if err := Callback(context); !errors.As(err, &business) ||
				business.Status != http.StatusUnauthorized {
				t.Fatal("Invalid callback parameters must be rejected before authentication")
			}
		})
	}
}

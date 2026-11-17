package userSvc

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"testing"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

func TestSubjectAndWhitelist(t *testing.T) {
	for _, value := range []string{"", " user", "user ", "user\n", strings.Repeat("中", 33)} {
		if validSubject(value) {
			t.Errorf("Invalid or oversized sub accepted: %q", value)
		}
	}
	if !validSubject(strings.Repeat("中", 32)) || !validSubject("User.ID-1") {
		t.Fatal("Valid usernames within the character limit must be accepted")
	}
	previous := config.Config.Session.UserWhitelist
	config.Config.Session.UserWhitelist = []string{"User"}
	t.Cleanup(func() { config.Config.Session.UserWhitelist = previous })
	if !allowed("User") || allowed("user") {
		t.Fatal("Whitelist matching must preserve case")
	}
}

func TestInvalidCookieDoesNotAccessDependencies(t *testing.T) {
	for _, value := range []string{"", "short", strings.Repeat("x", 1000)} {
		_, err := Authenticate(context.Background(), value)
		var business *response.BusinessError
		if !errors.As(err, &business) || business.Status != http.StatusUnauthorized {
			t.Fatal("Invalid cookies must return 401 before accessing Redis")
		}
	}
}

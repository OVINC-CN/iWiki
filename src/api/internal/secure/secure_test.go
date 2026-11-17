package secure

import (
	"strings"
	"testing"
)

func TestReturnPath(t *testing.T) {
	valid := "/docs/detail?id=%E6%96%87%E7%AB%A0%201&tab=preview#%E7%AC%AC%E4%BA%8C%E8%8A%82"
	if ReturnPath(valid) != valid {
		t.Fatal("Local return paths must preserve queries and fragments")
	}
	for _, value := range []string{
		"https://example.com/", "//example.com/", "/\\example.com/", "/%2fexample.com/",
		"/%5cexample.com/", "/%0aevil", "/login/callback?code=secret", "/v1/auth/oidc/login",
		"/login", "/docs/../login", "/login/./callback", "/v1/auth",
	} {
		if ReturnPath(value) != "/" {
			t.Errorf("Unsafe return path accepted: %q", value)
		}
	}
}

func TestCredentialAndLegacyIDLengths(t *testing.T) {
	first, err := Random(32)
	if err != nil {
		t.Fatal("Failed to generate random credentials")
	}
	second, err := Random(32)
	if err != nil || len(first) != 43 || first == second {
		t.Fatal("Invalid session credential length or randomness")
	}
	id, err := ID()
	if err != nil || len(id) != 32 || strings.ContainsAny(id, "/+_") {
		t.Fatal("IDs must contain 32 characters")
	}
	if len(Digest(first)) != 64 || strings.Contains(Digest(first), first) {
		t.Fatal("Server-side indexes must use digests only")
	}
}

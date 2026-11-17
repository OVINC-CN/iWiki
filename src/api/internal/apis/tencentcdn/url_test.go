package tencentcdn

import (
	"context"
	"strings"
	"testing"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
)

func TestOwnedLinksPreserveQueries(t *testing.T) {
	previous := config.Config.COS
	config.Config.COS.URL = "https://cdn.example.com"
	config.Config.COS.CDNSigningKey = ""
	config.Config.COS.CDNParameter = "eo-sign"
	t.Cleanup(func() { config.Config.COS = previous })
	input := "https://cdn.example.com/upload/中文.png?eo-sign=expired&download=1"
	normalized := Normalize(input)
	if strings.Contains(normalized, "eo-sign") || !strings.Contains(normalized, "download=1") {
		t.Fatal("Stored links must remove signatures and preserve other parameters")
	}
	signed, err := Sign(context.Background(), normalized)
	if err != nil || signed != normalized || !strings.Contains(signed, "%E4%B8%AD%E6%96%87.png") {
		t.Fatal("CJK paths must be escaped without adding processing parameters")
	}
	legacy := normalized + "&imageMogr2/quality/80/format/webp"
	preserved, err := Sign(context.Background(), legacy)
	if err != nil || preserved != legacy {
		t.Fatal("Existing non-signature query parameters must remain unchanged")
	}
	if Normalize(signed) != normalized {
		t.Fatal("Repeated edits must not accumulate signature parameters")
	}
	external := "https://other.example.com/中文.png?eo-sign=keep"
	converted, err := Sign(context.Background(), external)
	if err != nil || converted != external || Normalize(external) != external {
		t.Fatal("External links must remain unchanged")
	}
	content := "![图片](" + input + ")<img src=\"" + input + "\">"
	converted, err = Content(context.Background(), content, false)
	if err != nil || strings.Contains(converted, "eo-sign") ||
		!strings.Contains(converted, "![图片](") || !strings.Contains(converted, "<img src=") {
		t.Fatal("Markdown and HTML references must remove temporary signatures")
	}
}

func TestSignaturesAreGeneratedWithoutCrossRequestCache(t *testing.T) {
	previous := config.Config.COS
	config.Config.COS.CDNSigningKey = strings.Repeat("x", 32)
	t.Cleanup(func() { config.Config.COS = previous })
	first, err := SignPath(context.Background(), "/upload/example.png")
	if err != nil {
		t.Fatal("Failed to generate the first signature")
	}
	second, err := SignPath(context.Background(), "/upload/example.png")
	if err != nil || first == "" || second == "" || first == second {
		t.Fatal("Each signing operation must use a fresh nonce without Redis")
	}
}

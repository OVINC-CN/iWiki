CDN_WEB_DIST ?= dist
export CDN_ORIGIN CDN_WEB_DIST

.PHONY: cdn-urls

cdn-urls:
	@node scripts/cdn-urls.ts "$$CDN_ORIGIN" "$$CDN_WEB_DIST"

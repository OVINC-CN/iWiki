CDN_WEB_DIST ?= src/web/dist
export CDN_ORIGIN CDN_WEB_DIST

.PHONY: setup api web check build cdn-urls

setup:
	pnpm --dir src/web install --frozen-lockfile
	$(MAKE) -C src/api tidy

api:
	$(MAKE) -C src/api dev

web:
	pnpm --dir src/web dev

check:
	$(MAKE) -C src/api check
	pnpm --dir src/web check

build:
	$(MAKE) -C src/api build
	pnpm --dir src/web build

cdn-urls:
	@node src/web/scripts/cdn-urls.ts "$$CDN_ORIGIN" "$$CDN_WEB_DIST"

<p align="center">
  <img src="src/web/public/logo.png" alt="iWiki Logo" width="120">
</p>

<p align="center">
  <strong>A document management system that combines blogs and knowledge bases.</strong>
</p>

<p align="center">
  <a href="./README_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

---

## Introduction

iWiki includes a Django API in `src/api` and a React frontend in `src/web`. Each component maintains its own dependencies and configuration and can be deployed independently.

## Features

- **Documents and knowledge bases**: Document editing, tags, comments, and access permissions.
- **Markdown editing**: Integrated [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor), syntax highlighting, [Mermaid](https://mermaid.js.org/) diagrams, and [KaTeX](https://katex.org/) formulas.
- **Authentication**: Integration with OVINC SSO and application credentials.
- **Media storage**: Tencent Cloud COS uploads and media URLs.
- **Background tasks**: Celery workers and scheduled jobs backed by Redis.

## Tech Stack

| Component | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui |
| API | Python, Django, Django REST framework |
| Application server | Gunicorn with Uvicorn workers (ASGI) |
| Database and cache | MySQL, Redis |
| Background jobs | Celery |

## Project Structure

```text
.
├── src/
│   ├── api/
│   │   ├── apps/                 # Django applications
│   │   ├── entry/                # Settings, URLs, and ASGI entry point
│   │   ├── bin/run.sh            # Container startup script
│   │   ├── Dockerfile
│   │   ├── env.example
│   │   └── requirements.txt
│   └── web/
│       ├── src/                  # React application
│       ├── public/               # Static assets and generated configuration
│       ├── scripts/              # CDN URL generation and tests
│       ├── .env.example
│       ├── package.json
│       └── pnpm-lock.yaml
├── .github/workflows/            # Frontend, API, and container workflows
├── README.md
└── README_CN.md
```

## Getting Started

### Prerequisites

| Tool or service | Requirement |
| --- | --- |
| Node.js | `24.22.1`, configured in [mise.toml](mise.toml) |
| pnpm | `11.7.0`, declared in [src/web/package.json](src/web/package.json) |
| Python | `3.14.9`, configured in [src/api/mise.toml](src/api/mise.toml) |
| MySQL and Redis | Available to the API and background workers |
| OVINC authentication | An application code, secret, and the SSO service addresses |
| Docker | Required for container deployment |

The commands below use a POSIX shell and assume the required runtimes are on `PATH`. If you use mise, run `mise install` at the repository root for Node.js and in `src/api` for Python.

### 1. Clone the repository

```bash
git clone https://github.com/OVINC-CN/iWiki.git
cd iWiki
```

### 2. Set up the API

From the repository root, prepare the Python environment:

```bash
cd src/api
python -m venv venv
. venv/bin/activate
python -m pip install -r requirements.txt
cp env.example .env
```

Edit `src/api/.env` with your application credentials, MySQL and Redis connections, and the addresses described under [Configuration](#configuration). Create the configured MySQL database, then run the following commands from `src/api` with the virtual environment active:

```bash
python manage.py check
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

For background processing, run each command below in a separate terminal from `src/api`, with the same virtual environment active:

```bash
python manage.py celery worker -c 1 -l INFO
```

```bash
python manage.py celery beat -l INFO
```

### 3. Start the frontend

In another terminal, run these commands from the repository root:

```bash
cp src/web/.env.example src/web/.env
pnpm --dir src/web install --frozen-lockfile
```

Edit `src/web/.env` to match your API and SSO addresses, then start the development server:

```bash
pnpm --dir src/web dev
```

Open `http://localhost:5173`. Frontend commands can also be run directly from `src/web` without `--dir src/web`.

## Configuration

### API

The API reads `src/api/.env`. Required settings are listed in [env.example](src/api/env.example); optional settings are defined in [entry/settings.py](src/api/entry/settings.py).

| Variables | Purpose |
| --- | --- |
| `APP_CODE`, `APP_SECRET` | Application credentials registered with OVINC |
| `BACKEND_URL` | Public API origin; use `http://localhost:8000` for the development server above |
| `ALLOWED_HOSTS` | Comma-separated API hostnames; for local development, `localhost,127.0.0.1` |
| `FRONTEND_URL`, `CORS_ORIGIN_WHITELIST` | Frontend origin and allowed CORS origins; use `http://localhost:5173` locally |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | MySQL connection; the example uses port `3306` |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` | Redis connection for caching, sessions, and background jobs |
| `OVINC_API_DOMAIN`, `OVINC_WEB_URL` | OVINC API and web addresses |
| `SESSION_COOKIE_DOMAIN` | Optional session cookie domain for your deployment |
| `QCLOUD_SECRET_ID`, `QCLOUD_SECRET_KEY`, `QCLOUD_COS_REGION`, `QCLOUD_COS_BUCKET`, `QCLOUD_COS_URL` | Tencent Cloud COS configuration for media uploads |

### Frontend

Vite loads `src/web/.env`. Deployment environments can also supply these variables directly:

| Variable | Purpose |
| --- | --- |
| `VITE_FRONTEND_URL` | Frontend origin, such as `http://localhost:5173` |
| `VITE_BACKEND_URL` | API origin, such as `http://localhost:8000` |
| `VITE_SSO_URL` | SSO login service origin |
| `VITE_SSO_API_URL` | SSO API base URL |
| `VITE_ALLOWED_HOSTS` | Reserved value in the example configuration; currently does not enforce host restrictions |

The development and build commands run `generate-config.js`, which writes exported environment values to `src/web/public/config.js`. The frontend reads `window.ENV` first and falls back to Vite environment values. Production builds hash `config.js` as `config.<hash>.js` and update its reference in `index.html`. Configuration changes require a rebuild and redeployment.

## Deployment

### API container

Configure `src/api/.env` for the deployment environment, including database and Redis hosts reachable from the container. From the repository root:

```bash
docker build -f src/api/Dockerfile -t iwiki-api:latest src/api
docker run -d --name iwiki-api \
  --env-file src/api/.env \
  -p 8020:8020 \
  iwiki-api:latest sh bin/run.sh
```

The startup script collects static files, applies migrations, starts the Celery worker and scheduler, and serves the API on port `8020` through Gunicorn with Uvicorn workers. Set `WEB_PROCESSES`, `WEB_THREADS`, and `WORKER_COUNT` to configure the process settings passed by the script.

### Static frontend

Set the frontend environment values before building. From the repository root:

```bash
pnpm --dir src/web install --frozen-lockfile
pnpm --dir src/web build
```

Deploy the entire `src/web/dist/` directory to a static host, including the hashed configuration and other assets. Serve `index.html` for frontend page routes. Upload assets before HTML and retain old hashed files for cached pages.

For Vercel, use the following frontend project settings and configure the `VITE_*` environment variables above. Deploy the API separately.

| Setting | Value |
| --- | --- |
| Root Directory | `src/web` |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

### Build-time head fragment

Production builds can insert an external HTML fragment immediately after the opening `<head>` tag. Create `src/web/tracking.fragment.html` and run this command from the repository root:

```bash
BUILD_HEAD_FRAGMENT_FILE=tracking.fragment.html pnpm --dir src/web build
```

Relative fragment paths are resolved from `src/web`, where `vite.config.ts` lives; absolute paths are also supported. The fragment is trusted build input and can contain scripts such as:

```html
<script defer src="https://example.com/script.js" data-website-id="website-id"></script>
<script defer src="https://example.com/recorder.js" data-website-id="website-id"></script>
```

The fragment should be supplied by the build environment and kept outside Git tracking. The recommended `tracking.fragment.html` filename is ignored by default. When the variable is unset, no fragment is injected. Changing the fragment requires rebuilding and redeploying the frontend.

### CDN refresh URLs

Document pages use fixed paths: `/docs/detail?id=<id>` and `/docs/edit?id=<id>`. `/docs/new` creates a document. Detail and edit URLs without an ID return to `/docs`.

With Node.js 24 or later, generate the CDN refresh list from the repository root:

```bash
pnpm --dir src/web build
make -C src/web cdn-urls CDN_ORIGIN=https://wiki.example.com > /tmp/iwiki-cdn-urls.txt
```

`CDN_ORIGIN` must contain only the HTTP(S) scheme, hostname, and optional port. `CDN_WEB_DIST` defaults to `dist`, relative to `src/web` for the command above, and can point to another artifact directory.

The command writes one sorted, unique URL per line, covering all registered page paths and every build file, including `index.html`, `config.<hash>.js`, and nested assets. It fails if the origin is invalid or the artifact directory has no `index.html`.

Configure the CDN to serve `index.html` for page paths and ignore query parameters in the HTML cache key so a refresh covers every document ID and list filter.

## Development and CI

Run frontend checks from the repository root:

```bash
pnpm --dir src/web lint
pnpm --dir src/web test
pnpm --dir src/web build
```

For API checks, activate the Python virtual environment and run the following commands from `src/api`:

```bash
python -m pip install pylint
python manage.py check
make pylint
```

| Workflow | Purpose |
| --- | --- |
| [Lint](.github/workflows/lint.yml) | Frontend ESLint, tests, and production build |
| [Pylint](.github/workflows/pylint.yml) | Django system checks and API Pylint |
| [Docker](.github/workflows/docker-publish.yml) | Builds, publishes, and signs the `linux/amd64` API image in GHCR on tag pushes |

## License

[MIT](./LICENSE) © [OVINC-CN](https://github.com/OVINC-CN)

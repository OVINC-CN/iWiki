<p align="center">
  <img src="src/web/public/logo.png" alt="iWiki Logo" width="120">
</p>

<p align="center">
  <strong>一个集博客与知识库于一体的文档管理系统。</strong>
</p>

<p align="center">
  <a href="./README_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

---

## 简介

iWiki 的 Django 后端位于 `src/api`，React 前端位于 `src/web`。两者分别维护依赖与配置，支持独立部署。

## 核心特性

- **文档与知识库**：支持文档编辑、标签、评论和访问权限。
- **Markdown 编辑**：集成 [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor)，支持代码高亮、[Mermaid](https://mermaid.js.org/) 图表和 [KaTeX](https://katex.org/) 数学公式。
- **身份认证**：对接 OVINC SSO 与应用凭证。
- **媒体存储**：支持腾讯云 COS 上传和媒体资源地址处理。
- **异步任务**：通过 Celery 和 Redis 运行后台任务与定时任务。

## 技术栈

| 组件 | 技术 |
| --- | --- |
| 前端 | React 19、TypeScript、Vite 7、Tailwind CSS 4、shadcn/ui |
| 后端 | Python、Django、Django REST framework |
| 应用服务器 | Gunicorn + Uvicorn Worker（ASGI） |
| 数据库与缓存 | MySQL、Redis |
| 后台任务 | Celery |

## 项目结构

```text
.
├── src/
│   ├── api/
│   │   ├── apps/                 # Django 应用
│   │   ├── entry/                # 配置、路由与 ASGI 入口
│   │   ├── bin/run.sh            # 容器启动脚本
│   │   ├── Dockerfile
│   │   ├── env.example
│   │   └── requirements.txt
│   └── web/
│       ├── src/                  # React 应用
│       ├── public/               # 静态资源与生成的配置
│       ├── scripts/              # CDN 地址生成与测试
│       ├── .env.example
│       ├── package.json
│       └── pnpm-lock.yaml
├── .github/workflows/            # 前端、后端与镜像工作流
├── README.md
└── README_CN.md
```

## 快速开始

### 环境要求

| 工具或服务 | 要求 |
| --- | --- |
| Node.js | `24.22.1`，由 [mise.toml](mise.toml) 管理 |
| pnpm | `11.7.0`，由 [src/web/package.json](src/web/package.json) 声明 |
| Python | `3.14.9`，由 [src/api/mise.toml](src/api/mise.toml) 管理 |
| MySQL 与 Redis | 后端和后台任务可以访问的服务 |
| OVINC 认证 | 应用代码、应用密钥及 SSO 服务地址 |
| Docker | 容器部署时需要 |

以下命令使用 POSIX Shell，假定对应版本的运行时已加入 `PATH`。使用 mise 时，在仓库根目录执行 `mise install` 安装 Node.js，在 `src/api` 中执行 `mise install` 安装 Python。

### 1. 获取代码

```bash
git clone https://github.com/OVINC-CN/iWiki.git
cd iWiki
```

### 2. 配置后端

从仓库根目录进入后端，准备 Python 环境：

```bash
cd src/api
python -m venv venv
. venv/bin/activate
python -m pip install -r requirements.txt
cp env.example .env
```

编辑 `src/api/.env`，填写应用凭证、MySQL 与 Redis 连接信息，并按[配置说明](#配置说明)设置各服务地址。创建配置中指定的 MySQL 数据库后，在已激活虚拟环境的 `src/api` 目录中执行：

```bash
python manage.py check
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

需要处理后台任务时，在 `src/api` 目录中分别打开终端，激活同一虚拟环境后运行：

```bash
python manage.py celery worker -c 1 -l INFO
```

```bash
python manage.py celery beat -l INFO
```

### 3. 启动前端

在另一个终端中，从仓库根目录执行：

```bash
cp src/web/.env.example src/web/.env
pnpm --dir src/web install --frozen-lockfile
```

编辑 `src/web/.env`，将后端与 SSO 地址改为实际使用的服务地址，然后启动开发服务器：

```bash
pnpm --dir src/web dev
```

访问 `http://localhost:5173`。也可以进入 `src/web`，省略 `--dir src/web` 直接运行前端命令。

## 配置说明

### 后端

后端从 `src/api/.env` 读取配置。基础配置见 [env.example](src/api/env.example)，可选配置见 [entry/settings.py](src/api/entry/settings.py)。

| 环境变量 | 用途 |
| --- | --- |
| `APP_CODE`、`APP_SECRET` | 在 OVINC 中注册的应用代码与密钥 |
| `BACKEND_URL` | 后端公开地址；上述开发服务使用 `http://localhost:8000` |
| `ALLOWED_HOSTS` | 逗号分隔的后端域名；本地开发可使用 `localhost,127.0.0.1` |
| `FRONTEND_URL`、`CORS_ORIGIN_WHITELIST` | 前端地址与允许的 CORS 来源；本地使用 `http://localhost:5173` |
| `DB_NAME`、`DB_USER`、`DB_PASSWORD`、`DB_HOST`、`DB_PORT` | MySQL 连接信息，示例端口为 `3306` |
| `REDIS_HOST`、`REDIS_PORT`、`REDIS_PASSWORD`、`REDIS_DB` | 缓存、会话与后台任务使用的 Redis 连接信息 |
| `OVINC_API_DOMAIN`、`OVINC_WEB_URL` | OVINC API 与网页地址 |
| `SESSION_COOKIE_DOMAIN` | 可选的部署环境会话 Cookie 域名 |
| `QCLOUD_SECRET_ID`、`QCLOUD_SECRET_KEY`、`QCLOUD_COS_REGION`、`QCLOUD_COS_BUCKET`、`QCLOUD_COS_URL` | 媒体上传使用的腾讯云 COS 配置 |

### 前端

Vite 会加载 `src/web/.env`，部署环境也可以直接提供以下变量：

| 环境变量 | 用途 |
| --- | --- |
| `VITE_FRONTEND_URL` | 前端地址，例如 `http://localhost:5173` |
| `VITE_BACKEND_URL` | 后端 API 地址，例如 `http://localhost:8000` |
| `VITE_SSO_URL` | SSO 登录服务地址 |
| `VITE_SSO_API_URL` | SSO API 基础地址 |
| `VITE_ALLOWED_HOSTS` | 示例配置中的预留值，目前不用于限制访问域名 |

开发和构建命令会先运行 `generate-config.js`，将已导出的环境变量写入 `src/web/public/config.js`。前端优先读取 `window.ENV`，再回退到 Vite 环境变量。生产构建将 `config.js` 生成为 `config.<hash>.js`，并更新 `index.html` 中的引用。修改配置后需要重新构建并部署。

## 部署

### 后端容器

先为部署环境配置 `src/api/.env`，其中 MySQL 与 Redis 地址需要能从容器内访问。在仓库根目录执行：

```bash
docker build -f src/api/Dockerfile -t iwiki-api:latest src/api
docker run -d --name iwiki-api \
  --env-file src/api/.env \
  -p 8020:8020 \
  iwiki-api:latest sh bin/run.sh
```

启动脚本会收集静态文件、执行数据库迁移、启动 Celery Worker 与调度器，并通过 Gunicorn + Uvicorn Worker 在 `8020` 端口提供 API。可通过 `WEB_PROCESSES`、`WEB_THREADS` 和 `WORKER_COUNT` 配置脚本传入的进程参数。

### 前端静态部署

构建前设置前端环境变量，在仓库根目录执行：

```bash
pnpm --dir src/web install --frozen-lockfile
pnpm --dir src/web build
```

将完整的 `src/web/dist/` 目录部署到静态托管服务，包括带哈希的配置文件与其他资源。前端页面路由需回退到 `index.html`。部署时先上传资源文件，再更新 HTML，并保留旧哈希文件供缓存页面使用。

使用 Vercel 时，为前端项目设置以下选项，并配置上方的 `VITE_*` 环境变量。后端需要单独部署。

| 设置项 | 值 |
| --- | --- |
| Root Directory | `src/web` |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

### 构建时 Head 片段

生产构建可以将外部 HTML 片段插入 `<head>` 开始标签之后。创建 `src/web/tracking.fragment.html` 后，从仓库根目录执行：

```bash
BUILD_HEAD_FRAGMENT_FILE=tracking.fragment.html pnpm --dir src/web build
```

片段的相对路径以 `vite.config.ts` 所在的 `src/web` 为基准，也可以使用绝对路径。该文件被视为可信的构建输入，可以包含如下脚本：

```html
<script defer src="https://example.com/script.js" data-website-id="website-id"></script>
<script defer src="https://example.com/recorder.js" data-website-id="website-id"></script>
```

片段文件应由构建环境提供并保持在 Git 追踪之外，推荐的 `tracking.fragment.html` 文件名默认已被忽略。未设置该变量时不注入内容，修改片段后需要重新构建并部署前端。

### CDN 刷新清单

文档页面使用固定路径：详情为 `/docs/detail?id=<id>`，编辑为 `/docs/edit?id=<id>`。`/docs/new` 用于新建文档，详情和编辑地址缺少 ID 时返回 `/docs`。

使用 Node.js 24 或更新版本，在仓库根目录生成 CDN 刷新清单：

```bash
pnpm --dir src/web build
make -C src/web cdn-urls CDN_ORIGIN=https://wiki.example.com > /tmp/iwiki-cdn-urls.txt
```

`CDN_ORIGIN` 仅包含 HTTP(S) 协议、域名及可选端口。`CDN_WEB_DIST` 默认为 `dist`，在上述命令中相对于 `src/web`，也可以指定其他产物目录。

命令逐行输出排序、去重后的完整 URL，覆盖所有注册页面路径及构建目录中的全部文件，包括 `index.html`、`config.<hash>.js` 和嵌套静态资源。源地址无效或产物目录缺少 `index.html` 时命令失败。

CDN 需将页面路径回源到 `index.html`，并在 HTML 缓存键中忽略查询参数，使一次刷新覆盖全部文档 ID 和列表筛选条件。

## 开发与持续集成

从仓库根目录运行前端检查：

```bash
pnpm --dir src/web lint
pnpm --dir src/web test
pnpm --dir src/web build
```

运行后端检查时，先激活 Python 虚拟环境，再在 `src/api` 目录中执行：

```bash
python -m pip install pylint
python manage.py check
make pylint
```

| 工作流 | 用途 |
| --- | --- |
| [Lint](.github/workflows/lint.yml) | 前端 ESLint、测试与生产构建 |
| [Pylint](.github/workflows/pylint.yml) | Django 配置检查与后端 Pylint |
| [Docker](.github/workflows/docker-publish.yml) | 推送标签时构建、发布并签名 GHCR 中的 `linux/amd64` 后端镜像 |

## 开源协议

[MIT](./LICENSE) © [OVINC-CN](https://github.com/OVINC-CN)

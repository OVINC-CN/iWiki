<div align="center">
  <img src="src/web/public/logo.png" width="100" alt="iWiki 标识">
  <p>可自行部署的 Markdown 博客与知识库，用于记录个人笔记、整理技术文档和分享站内文章。</p>
  <p>
    <a href="#主要功能">主要功能</a> ·
    <a href="#快速开始">快速开始</a> ·
    <a href="#部署">部署</a> ·
    <a href="CONTRIBUTING.md">开发指引</a>
  </p>
</div>

## 主要功能

- **Markdown 写作**　编辑时可预览排版，支持代码高亮、Mermaid 图表和 KaTeX 数学公式。
- **图片与附件**　为文章设置封面，在正文中插入配图或附上文件。上传使用腾讯云对象存储（COS）。
- **标签与检索**　按主题为文章添加多个标签，查找时可组合标签和关键词，搜索标题或正文。
- **站内分享**　通过 OpenID Connect（OIDC）登录后即可阅读公开文章。私有笔记仅作者可见，文章的编辑和删除也由作者本人操作。

## 技术栈

前端使用 React、TypeScript 和 Vite，后端使用 Go 和 Echo。MySQL 保存文章、标签和账号数据，Redis 管理登录会话和缓存。

## 快速开始

### 环境要求

准备 Go、Node.js 和 pnpm，版本分别见 [mise.toml](mise.toml) 和 [package.json](src/web/package.json)。运行 iWiki 需要 MySQL、Redis 和支持授权码流程及 PKCE 的 OIDC 身份提供方。启用上传时还需准备 COS 存储桶。

### 初始化配置

首次安装时，创建字符集为 `utf8mb4` 的 MySQL 空库，并在该空库执行[初始化脚本](src/api/support-files/sql/0001_init.sql)。已有 iWiki 数据库可直接连接。

在仓库根目录复制配置示例。

```bash
cp -n src/api/config.yaml src/api/config.local.yaml
cp -n src/web/.env.example src/web/.env
```

编辑 `src/api/config.local.yaml`，填写下列连接信息。

| 服务 | 配置项 |
| --- | --- |
| MySQL | 在 `mysql.dsn` 中填写数据库连接串。 |
| Redis | 在 `redis.addr` 中填写服务地址，需要认证时填写 `redis.password`。 |
| OIDC | 填写 `oidc.issuer`、`oidc.client_id`，以及身份提供方要求的 `oidc.client_secret`。 |

在身份提供方登记本地回调地址 `http://localhost:5173/login/callback`。iWiki 使用 OIDC 的 `sub` 作为用户名。

### 本地运行

在仓库根目录启动后端，默认监听 8020 端口。

```bash
make -C src/api dev CONFIG=config.local.yaml
```

另开一个终端，在仓库根目录安装依赖并启动前端。

```bash
pnpm --dir src/web install --frozen-lockfile
pnpm --dir src/web dev
```

打开 [本地 iWiki](http://localhost:5173) 并登录。新账号可以阅读公开文章，创建文章和上传文件需分别获得授权。

## 部署

- **后端**　运行 `make -C src/api build` 生成 `src/api/bin/iwiki`，使用 `iwiki api --config <配置文件路径>` 启动。也可以使用 [Dockerfile](src/api/Dockerfile) 构建镜像，将配置文件挂载到容器内的 `/app/config.yaml`。
- **前端**　在 `src/web/.env` 中设置 `VITE_FRONTEND_URL` 和 `VITE_BACKEND_URL` 后，运行 `pnpm --dir src/web build`。将 `src/web/dist` 发布到静态站点，并将页面路由回退到 `index.html`。
- **登录**　生产环境使用同站点的 HTTPS 地址。将后端的 `app.environment` 设为 `production`、`session.cookie_secure` 设为 `true`，并按实际域名更新 `app.frontend_url` 和 `http.cors_allow_origins`。将前端的 `/login/callback` 完整地址同时填入 `oidc.redirect_url` 和身份提供方的回调配置。

## 参与贡献

代码目录、开发流程和检查命令见[开发指引](CONTRIBUTING.md)。

## 许可证

iWiki 采用 [MIT 许可证](LICENSE)。

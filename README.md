<p align="center"><img src="src/web/public/logo.png" alt="iWiki 标识" width="120"></p>

# iWiki

集博客与知识库于一体的文档系统。Go 后端位于 `src/api`，React 前端位于 `src/web`，可独立部署。

## 功能与访问

- 文档编辑、封面、标签、关键词筛选、阅读量和评论计数。
- Markdown、代码高亮、Mermaid 图表、KaTeX 公式和媒体上传。
- 仅支持标准 OIDC 登录；公开文档对所有已登录用户可见，私有文档仅作者可见，编辑和删除仅限作者。
- 创建文档和上传文件分别检查 `create_doc`、`upload_file` 授权及失效时间。
- 腾讯 COS 临时凭据直传及 CDN 方式 A 签名。
- 保存和删除文档时，自动清理解绑后无引用的标签。

## 环境要求

| 工具或服务 | 要求 |
| --- | --- |
| Go | `1.26.10` |
| Node.js | `24.22.1` |
| pnpm | `11.7.0`，版本见前端 package.json |
| MySQL | 可访问的既有数据库，或已手动初始化的独立空库 |
| Redis | 支持 Lua 脚本的 Redis，用于新会话、登录状态和登录限流 |
| 身份提供方 | 标准 OIDC 发现、授权码、S256 PKCE、签名 ID Token；sub 必须等于本地用户名 |

运行时版本由根目录 `mise.toml` 管理。

## 启动后端

在仓库根目录执行：

```bash
cp src/api/config.yaml src/api/config.local.yaml
```

编辑本地 YAML，至少填写 `mysql.dsn`、`redis.addr`、`oidc.issuer`、`oidc.client_id`，以及身份提供方要求的 `oidc.client_secret`。
后端配置从 YAML 加载；`OTEL_SERVICE_NAME` 可覆盖追踪服务名。

```yaml
mysql:
  dsn: 'iwiki:数据库密码@tcp(127.0.0.1:3306)/iwiki'
redis:
  addr: '127.0.0.1:6379'
oidc:
  issuer: 'https://id.example.com'
  client_id: 'iwiki'
  client_secret: '身份提供方分配的密钥'
  redirect_url: 'http://localhost:5173/login/callback'
```

上面的片段只说明需要修改的字段，请保留示例文件中的其他配置。回调地址必须在身份提供方登记并逐字一致。
前后端须部署在同一站点，开发时统一使用 `localhost`，不要混用 `127.0.0.1`。

```bash
make -C src/api tidy
make -C src/api dev CONFIG=config.local.yaml
```

默认监听 `:8020`。也可先构建，再指定配置启动：

```bash
make -C src/api build
src/api/bin/iwiki api --config src/api/config.local.yaml
```

### 数据库

服务使用 `account_user`、`doc_doc`、`doc_docbin`、`doc_tag`、`doc_doctag`、`doc_comment`、
`doc_commentbin`、`permission_userpermission` 和 `cos_coslog`。
数据库连接及写入时间使用 UTC。

应用运行账号只需上述表的 DML 权限。
`src/api/support-files/sql/0001_init.sql` 仅供全新空库安装，禁止在已有数据库执行。
安装空库前先创建使用 `utf8mb4` 的数据库，再由具备权限的运维账号手动执行 SQL。

用户名最长 32 字符，OIDC sub 与 `account_user.username` 对应。
首次登录自动创建账号；已停用的账号无法登录。
昵称优先使用 OIDC `nickname`，其次 `name`，不提供时保留原昵称。登录不授予业务权限。

### 配置分组

| 分组 | 内容 |
| --- | --- |
| `app` | 名称、环境、业务时区、监听地址、日志级别、前端地址、调试开关及退出超时 |
| `http` | 明确的跨域来源、可信代理网段、请求及服务端超时、请求体和分页限制 |
| `mysql`、`redis` | 连接、连接池、事务锁冲突重试和超时；Redis 前缀必须与旧会话及其他部署隔离 |
| `oidc` | 唯一可信 issuer、客户端、回调、登录状态有效期和发起频率限制 |
| `session` | 会话有效期、Cookie 名称和属性、精确用户名白名单 |
| `document` | title/content/all 搜索范围，正文、标签和筛选数量限制 |
| `cos` | COS 与 STS、临时凭据有效期、上传大小和 CDN 签名 |
| `trace` | OTLP gRPC 上报、TLS、上报头及批量参数；关闭上报仍生成真实 Trace ID |

生产环境使用 `app.environment: production`、HTTPS 和 `session.cookie_secure: true`。
只有 YAML 中明确列出的代理网段可信，未配置时不信任转发 IP。
真实凭据只放本地或部署配置，不进入 Git、镜像和构建输出。

### 登录与会话

未登录访问进入前端 `/login` 页面。点击登录后，页面调用 `/v1/auth/oidc/login` 获取登录地址，
再跳转至身份提供方。身份提供方回调前端 `/login/callback`，落地页清除地址栏中的授权参数，
调用 `/v1/auth/oidc/callback` 完成登录；确认会话有效后返回原访问页面，保留查询参数和锚点。
登录失败时在落地页显示中文提示，并提供重新登录入口。退出后返回登录页，等待用户再次发起登录。

`oidc.redirect_url` 必须等于 `app.frontend_url` 加 `/login/callback`，并在身份提供方登记。
前端托管须将 `/login` 和 `/login/callback` 回退到 `index.html`。
服务验证 state、nonce、PKCE、签名、issuer、audience、有效期及适用的授权方与访问令牌摘要。
登录状态绑定浏览器并一次性消费，回跳仅接受站内路径。客户端密钥、PKCE 校验值、ID Token 和
Access Token 仅在后端处理，不返回前端；授权码不写入浏览器存储。

Cookie 使用 HttpOnly、SameSite=Lax 和显式 `Path=/`。会话按凭据摘要存入 Redis。写请求要求 `X-CSRF-Protection: 1`，同时验证 Origin，缺少 Origin 时验证 Referer。
前端统一发送该请求头。退出只撤销当前本地会话，不注销身份提供方的其他应用会话。

只有登录入口、回调及 `GET /health`、`GET /ready` 免登录；其余接口全部需要会话 Cookie。
探针的 `data` 始终为 null，就绪检查失败返回 503，不披露依赖明细。

### COS 与 CDN

启用 `cos.enabled` 后填写长期密钥、存储桶、地域和资源域名，长期密钥仅由后端使用。
后端签发只允许指定对象 `PutObject` 且限制内容长度的临时凭据，前端继续使用 COS SDK 直传。
每次上传使用独立随机路径，日期目录按 `app.timezone` 生成；数据库时间保持 UTC。
上传记录的响应字段只保存脱敏状态，不保存临时密钥。
直传记录代表凭据签发结果，不代表浏览器已成功完成对象上传。

CDN 方式 A 签名在每次读取时即时生成，不使用跨请求缓存；有效期由 CDN 侧鉴权规则控制。
应用不自动添加图片处理参数，已有链接中的其他查询参数保持原样。
仅重签配置域名的链接，外部链接保持原样。保存文档前清理自有链接的临时签名，读取时重新签发。

## 启动前端

```bash
cp src/web/.env.example src/web/.env
pnpm --dir src/web install --frozen-lockfile
pnpm --dir src/web dev
```

开发地址为 `http://localhost:5173`。前端只需 `VITE_BACKEND_URL` 和 `VITE_FRONTEND_URL`，后端地址不含 `/v1`。
浏览器不配置 SSO 地址、客户端密钥或认证令牌。

```bash
pnpm --dir src/web check
```

该命令包含静态检查、现有脚本测试和生产构建。
生产配置经 `generate-config.js` 写入配置文件，构建时生成 `config.<hash>.js` 并更新页面引用。
修改构建配置后需重新构建，完整部署 `src/web/dist`，页面路由回退到 `index.html`。

## 容器部署

```bash
docker build -f src/api/Dockerfile -t iwiki-api:latest src/api
docker run -d --name iwiki-api -p 8020:8020 \
  --mount type=bind,source="$PWD/src/api/config.local.yaml",target=/app/config.yaml,readonly \
  iwiki-api:latest
```

镜像以非 root 用户运行，挂载配置需允许容器用户读取；不要将密钥配置复制进镜像。
容器仅运行 API，启动时检查配置、MySQL、Redis 和 OIDC 发现，不执行数据库初始化。

前后端应同时切换到新版本，用户重新登录。切换前备份数据库和配置；需要回滚时恢复旧前后端，
保留数据库原状并要求重新登录。不要在新旧后端之间共享会话命名空间。

## 开发与检查

```bash
make -C src/api check
pnpm --dir src/web check
```

后端默认只执行格式、静态检查、配置校验、Swagger 路由一致性检查和构建，不启动应用或测试服务。
运行后端单元测试使用 `make -C src/api test`，测试和联调使用独立配置及测试环境。
更多实现入口和验证场景见 [CONTRIBUTING.md](CONTRIBUTING.md)，约束见 [AGENTS.md](AGENTS.md)。

前端页面使用固定路径 `/docs/detail?id=...`、`/docs/edit?id=...`。
生成 CDN 刷新清单：

```bash
make cdn-urls CDN_ORIGIN=https://wiki.example.com
```

清单覆盖全部页面及构建资源。CDN 页面缓存键应忽略查询参数，先发布资源文件，再发布 HTML，并保留旧哈希资源。
构建时如需注入可信的 `<head>` 片段，设置 `BUILD_HEAD_FRAGMENT_FILE=tracking.fragment.html`，路径相对 `src/web`。
片段不提交到 Git。

## 开源协议

[MIT](LICENSE) © [OVINC-CN](https://github.com/OVINC-CN)

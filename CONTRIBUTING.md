# 开发指引

开发规范见 [AGENTS.md](AGENTS.md)，安装和部署见 [README.md](README.md)。

## 代码入口

| 内容 | 入口 |
| --- | --- |
| API 启动与退出 | `src/api/main.go` |
| 路由、鉴权、来源校验、错误及日志 | `src/api/internal/httpd` |
| OIDC 与会话 | `src/api/internal/apps/user`、`src/api/internal/apis/oidc` |
| 文档、标签、阅读量、回收快照 | `src/api/internal/apps/doc` |
| 授权查询和事务内检查 | `src/api/internal/apps/permission` |
| COS 业务与协议 | `src/api/internal/apps/cos`、`src/api/internal/apis/tencentsts`、`src/api/internal/apis/tencentcdn` |
| 共享资源 | `src/api/internal/config`、`db`、`logger`、`tracing` |
| 空库初始化 SQL | `src/api/support-files/sql/0001_init.sql` |
| 前端 API、模型和身份状态 | `src/web/src/api`、`types`、`contexts` |

每个 app 使用带 app 前缀的 Models、Routers、Svc、Utils 子包。Models 定义固定字段和响应模型，
Routers 提取参数，Svc 管理业务及事务。路由在 httpd 注册。

## 修改接口

1. 先核对数据字段、可见范围及业务授权，再修改请求与响应模型。
2. 在 Svc 中使用 `db.DB().WithContext(ctx)` 或事务回调提供的 `tx`，不通过参数传递共享配置或连接池。
3. 受保护接口只依赖认证中间件写入的可信身份，事务中复核账号、作者和所需授权，不重新读取 Cookie。
4. 同步调整路由、Swagger 注释、前端 Zod 模型、调用参数和配置说明。
5. 执行对应静态检查；动态验收使用独立测试配置，不迁移或修改真实数据。

JSON 响应只包含 `trace`、`error_msg`、`data`，成功时错误说明为空。
外部错误使用固定中文提示，不直接返回数据库、Redis、身份提供方或 STS 的内部错误。
所有业务接口必须登录，仅两个 GET 探针及 OIDC 登录与回调例外。Swagger 需要调试开关和登录。

## 文档事务

GORM 模型定义表名和列名，时间按 UTC 写入。账号状态通过 `is_deleted` 检查。

保存事务先复核账号及创建授权，编辑先锁定文档并复核作者。标签按固定顺序创建、锁定和绑定；
解绑后清理已无引用的标签，名称唯一性由数据库保证。
删除文档同事务保存 `doc_docbin`，显式删除评论、评论回收关联和标签关系，再清理无引用标签。
不存在物理外键时不能依赖数据库级联完成业务。

关键词使用区分大小写的子串匹配，通配符按普通字符处理。每个字段必须包含全部关键词，字段之间取并集。
标签条件取并集，再与可见范围、关键词取交集。列表与计数使用同一个筛选入口，关联读取按当前页批量查询。

## 身份与上传

OIDC 的唯一身份字段是已验证 ID Token 的 sub，对应用户名。首次建号写入不可用密码标记，
不授予业务权限，不按 OIDC 声明覆盖管理员标记或账号类型。身份提供方变更前需重新核对 sub 对应关系并失效已有会话。

Redis 使用独立前缀；登录 state 一次性消费并校验浏览器绑定。会话原值只通过 Cookie 返回，索引使用摘要。
写接口验证来源和 CSRF 头，CORS 预检不调用业务。日志不记录 URL 查询、授权码、Cookie、令牌、签名或 STS 原始响应。

STS 外部调用不放在数据库事务内，调用后再次检查账号和上传授权；未完成校验不向前端返回凭据。
COS 记录只保存脱敏的申请、成功签发或失败状态。CDN 签名只处理自有域名，每次即时生成；其他查询参数保持原样，不自动添加图片处理指令。

## 静态检查与文档生成

```bash
make -C src/api format
make -C src/api swagger
make -C src/api check
pnpm --dir src/web check
```

后端 check 包含格式、golangci-lint、配置静态校验、Swagger 路由一致性和构建，不自动运行后端动态测试。
Swagger 生成器只生成 JSON/YAML，不生成新的运行时初始化逻辑。

运行单元测试：

```bash
make -C src/api test
```

已有单元测试覆盖默认鉴权、探针与 CORS 预检、CSRF、回跳校验、用户名边界和实际 GORM 搜索条件。
默认配置不填写外部连接，单元测试可使用内存请求及 DryRun；不要为单元测试启动真实服务。
完整集成验收使用独立测试库、Redis 前缀、OIDC 客户端及 COS 测试桶。

## 集成验收场景

- 未登录访问所有业务接口和调试文档均返回 401；探针成功或失败均返回空 data。
- 登录后可读公开文档和本人私有文档，不能读取他人私有文档，也不能编辑或删除他人文档。
- 创建和上传分别检查权限及到期时间；权限或账号在操作过程中变化时事务复核阻止提交。
- 文档、标签、回收快照和关联清理任一步失败全部回滚；共享标签保留，并发绑定不产生悬空关系。
- state 不能重放，错误 nonce、issuer、audience、过期令牌、错误 PKCE 均拒绝；删除账号不复活。
- 登录和会话不按查询参数或请求体认证；退出后原 Cookie 失效，危险回跳回退首页。
- COS 仅允许指定对象和大小，签名兼容中文路径且不使用跨请求缓存，临时密钥不出现在持久记录或日志。
- 前端不出现语言入口、翻译调用或英文业务提示，代码预览、Markdown、数学公式与上传交互保持可用。

SQL 执行计划须对真实查询的可见条件、标签子查询、关键词条件、计数和当前页关联读取分别执行 EXPLAIN。
按执行计划检查 owner/public、标签唯一索引和评论 doc_id 索引的使用情况。
前导通配符搜索不能视为索引覆盖查询；不为优化改变搜索语义或自动增加索引。
一次性 SQL 和执行计划只放系统临时目录，结论应说明测试数据量和条件范围。

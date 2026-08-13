<p align="center">
  <img src="public/logo.png" alt="iWiki Logo" width="120">
</p>

<h1 align="center">iWiki</h1>

<p align="center">
  <strong>一个集博客与知识库于一体的文档管理系统。</strong>
</p>

<p align="center">
  <a href="./README_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

---

## ✨ 特性

- **统一平台**：无缝整合博客与知识库功能。
- **现代技术栈**：基于 [React 19](https://react.dev/)、[Vite](https://vitejs.dev/) 和 [TypeScript](https://www.typescriptlang.org/) 构建。
- **丰富编辑**：集成 [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor)，提供强大的 Markdown 编辑体验。
- **图表与代码**：原生支持 [Mermaid](https://mermaid.js.org/) 图表和语法高亮。
- **数学公式**：内置 [KaTeX](https://katex.org/) 支持数学公式渲染。

## 🛠️ 开发

### 环境要求

- Node.js
- pnpm

### 本地启动

1. **克隆仓库**

   ```bash
   git clone https://github.com/OVINC/iWiki.git
   cd iWiki
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **启动开发服务器**

   ```bash
   pnpm dev
   ```

4. **构建生产版本**

   ```bash
   pnpm build
   ```

## 构建时 Head 片段

生产构建可以将一个外部 HTML 片段插入 `<head>` 开始标签之后。通过 `BUILD_HEAD_FRAGMENT_FILE` 传入文件路径：

```shell
BUILD_HEAD_FRAGMENT_FILE=tracking.fragment.html pnpm build
```

相对路径以仓库根目录为基准。该文件被视为可信的构建输入，可以包含如下追踪脚本标签：

```html
<script defer src="https://example.com/script.js" data-website-id="website-id"></script>
<script defer src="https://example.com/recorder.js" data-website-id="website-id"></script>
```

片段文件应由构建环境提供并保持在 Git 追踪之外；推荐的 `tracking.fragment.html` 文件名默认已被忽略。未设置该变量时不会注入任何内容；修改片段后需要重新构建和部署。

## 🚀 部署

### 方式一：Vercel 部署（推荐）

Fork 本仓库并使用 [Vercel](https://vercel.com) 进行部署。

**配置说明：**

1. **构建设置：**
    - 构建命令：`pnpm build`
    - 安装命令：`pnpm install`

2. **环境变量：**

   | 变量 | 说明 |
   | --- | --- |
   | `VITE_FRONTEND_URL` | 前端地址 (例如 `http://localhost:5173`) |
   | `VITE_BACKEND_URL` | 后端 API 地址 (例如 `http://localhost:8000`) |
   | `VITE_SSO_URL` | SSO 登录地址 (例如 `http://localhost:8001`) |
   | `VITE_SSO_API_URL` | SSO API 地址 (例如 `http://localhost:8001/api`) |
   | `VITE_ALLOWED_HOSTS` | 允许的域名 (逗号分隔) |

### 方式二：手动部署

你可以将静态资源托管在任意静态文件服务器（Nginx、Apache）或对象存储（COS、OSS、S3）上。

```bash
# 设置环境变量并构建
VITE_FRONTEND_URL=<前端地址> \
VITE_BACKEND_URL=<后端 API 地址> \
VITE_SSO_URL=<SSO 登录地址> \
VITE_SSO_API_URL=<SSO API 地址> \
VITE_ALLOWED_HOSTS=<允许的域名> \
pnpm install && pnpm build
```

## 📄 许可证

[MIT](./LICENSE) © [OVINC-CN](https://github.com/OVINC)

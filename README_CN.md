<p align="center">
  <img src="public/logo.png" alt="iWiki Logo" width="120">
</p>

<h1 align="center">iWiki</h1>

<p align="center">
  <strong>博客、知识库一体的文档管理系统</strong>
</p>

<p align="center">
  <a href="./README_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

---

## ✨ 特性

- **一体化平台**：无缝融合博客与知识库功能，满足多样化文档管理需求。
- **现代技术栈**：基于 [Vue 3](https://vuejs.org/)、[Vite](https://vitejs.dev/) 和 [Arco Design](https://arco.design/) 构建。
- **强大编辑体验**：集成 [Vditor](https://github.com/Vanessa219/vditor)，提供卓越的 Markdown 编辑体验。
- **图表与代码**：原生支持 [Mermaid](https://mermaid.js.org/) 图表和 [PrismJS](https://prismjs.com/) 代码高亮。

## 🛠️ 本地开发

### 前置要求

- Node.js
- Yarn

### 启动项目

1. **克隆仓库**

   ```bash
   git clone https://github.com/OVINC/iWiki.git
   cd iWiki
   ```

2. **安装依赖**

   ```bash
   yarn install
   ```

3. **启动开发服务器**

   ```bash
   yarn dev
   ```

4. **构建生产版本**

   ```bash
   yarn build
   ```

## 🚀 部署指南

### 方式一：Vercel 部署 (推荐)

Fork 此仓库后，使用 [Vercel](https://vercel.com) 进行部署。

**配置说明：**

1. **构建设置 (Build Settings):**
   - Build Command: `yarn build`
   - Install Command: `yarn`

2. **环境变量 (Environment Variables):**

   | 变量名 | 说明 |
   | --- | --- |
   | `SITE_URL` | 站点地址 |
   | `BACKEND_URL` | 后端 API 地址 |
   | `OVINC_WEB_URL` | OVINC Web 地址 |
   | `OVINC_URL` | OVINC 统一 API 地址 |
   | `VDITOR_CDN` | Vditor CDN 地址 (可选) |

### 方式二：手动打包部署

此方式部署需要有自己的静态资源服务器（如 Nginx），也可以将静态资源托管到 COS, OSS, S3 等对象存储。

```bash
# 设置环境变量并构建
SITE_URL=<SITE URL> \
BACKEND_URL=<API URL> \
OVINC_WEB_URL=<OVINC WEB URL> \
OVINC_URL=<OVINC UNION API URL> \
VDITOR_CDN=<VDITOR CDN URL> \
yarn && yarn build
```

## 📄 开源协议

[MIT](./LICENSE) © [OVINC-CN](https://github.com/OVINC)

<p align="center">
  <img src="public/logo.png" alt="iWiki Logo" width="120">
</p>

<h1 align="center">iWiki</h1>

<p align="center">
  <strong>A document management system that combines blogs and knowledge bases.</strong>
</p>

<p align="center">
  <a href="./README_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

---

## ✨ Features

- **Unified Platform**: Seamlessly combines blog and knowledge base functionalities.
- **Modern Stack**: Built with [React 19](https://react.dev/), [Vite](https://vitejs.dev/), and [TypeScript](https://www.typescriptlang.org/).
- **Rich Editing**: Integrated [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor) for a powerful Markdown editing experience.
- **Diagrams & Code**: Native support for [Mermaid](https://mermaid.js.org/) diagrams and syntax highlighting.
- **Math Support**: Built-in [KaTeX](https://katex.org/) for rendering mathematical formulas.

## 🛠️ Development

### Prerequisites

- Node.js
- pnpm

### Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/OVINC/iWiki.git
   cd iWiki
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

4. **Build for production**

   ```bash
   pnpm build
   ```

## Build-time Head Fragment

An optional external HTML fragment can be inserted immediately after the opening `<head>` tag during a production build. Pass its path through `BUILD_HEAD_FRAGMENT_FILE`:

```shell
BUILD_HEAD_FRAGMENT_FILE=tracking.fragment.html pnpm build
```

Relative paths are resolved from the repository root. The fragment is treated as trusted build input and can contain script tags such as:

```html
<script defer src="https://example.com/script.js" data-website-id="website-id"></script>
<script defer src="https://example.com/recorder.js" data-website-id="website-id"></script>
```

The fragment file should be supplied by the build environment and kept outside Git tracking; the recommended `tracking.fragment.html` filename is ignored by default. When the variable is unset, no fragment is injected. Changing the fragment requires rebuilding and redeploying the site.

## 🚀 Deployment

### Method 1: Deploy on Vercel (Recommended)

Fork this repository and deploy it using [Vercel](https://vercel.com).

**Configuration:**

1. **Build Settings:**
    - Build Command: `pnpm build`
    - Install Command: `pnpm install`

2. **Environment Variables:**

   | Variable | Description |
   | --- | --- |
   | `VITE_FRONTEND_URL` | Frontend URL (e.g., `http://localhost:5173`) |
   | `VITE_BACKEND_URL` | Backend API URL (e.g., `http://localhost:8000`) |
   | `VITE_SSO_URL` | SSO Login URL (e.g., `http://localhost:8001`) |
   | `VITE_SSO_API_URL` | SSO API URL (e.g., `http://localhost:8001/api`) |
   | `VITE_ALLOWED_HOSTS` | Allowed Hosts (comma separated) |

### Method 2: Manual Deployment

You can host the static resources on any static file server (Nginx, Apache) or object storage (COS, OSS, S3).

```bash
# Set environment variables and build
VITE_FRONTEND_URL=<FRONTEND URL> \
VITE_BACKEND_URL=<API URL> \
VITE_SSO_URL=<SSO URL> \
VITE_SSO_API_URL=<SSO API URL> \
VITE_ALLOWED_HOSTS=<ALLOWED HOSTS> \
pnpm install && pnpm build
```

## 📄 License

[MIT](./LICENSE) © [OVINC-CN](https://github.com/OVINC)

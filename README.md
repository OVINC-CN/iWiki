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
- **Modern Stack**: Built with [Vue 3](https://vuejs.org/), [Vite](https://vitejs.dev/), and [Arco Design](https://arco.design/).
- **Rich Editing**: Integrated [Vditor](https://github.com/Vanessa219/vditor) for a powerful Markdown editing experience.
- **Diagrams & Code**: Native support for [Mermaid](https://mermaid.js.org/) diagrams and [PrismJS](https://prismjs.com/) syntax highlighting.

## 🛠️ Development

### Prerequisites

- Node.js
- Yarn

### Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/OVINC/iWiki.git
   cd iWiki
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Start development server**

   ```bash
   yarn dev
   ```

4. **Build for production**

   ```bash
   yarn build
   ```

## 🚀 Deployment

### Method 1: Deploy on Vercel (Recommended)

Fork this repository and deploy it using [Vercel](https://vercel.com).

**Configuration:**

1. **Build Settings:**
   - Build Command: `yarn build`
   - Install Command: `yarn`

2. **Environment Variables:**

   | Variable | Description |
   | --- | --- |
   | `SITE_URL` | Your site URL |
   | `BACKEND_URL` | API URL |
   | `OVINC_WEB_URL` | OVINC Web URL |
   | `OVINC_URL` | OVINC Union API URL |
   | `VDITOR_CDN` | Vditor CDN URL (Optional) |

### Method 2: Manual Deployment

You can host the static resources on any static file server (Nginx, Apache) or object storage (COS, OSS, S3).

```bash
# Set environment variables and build
SITE_URL=<SITE URL> \
BACKEND_URL=<API URL> \
OVINC_WEB_URL=<OVINC WEB URL> \
OVINC_URL=<OVINC UNION API URL> \
VDITOR_CDN=<VDITOR CDN URL> \
yarn && yarn build
```

## 📄 License

[MIT](./LICENSE) © [OVINC-CN](https://github.com/OVINC)

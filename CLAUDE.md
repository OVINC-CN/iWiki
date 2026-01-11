# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iWiki is a document management system combining blog and knowledge base functionality. Built with React 19, TypeScript, Vite, and Tailwind CSS, following Apple-inspired minimalist design principles.

## Commands

```bash
# Development server (port 5173)
yarn dev

# Production build (includes TypeScript check and config generation)
yarn build

# Lint code
yarn lint

# Preview built artifacts
yarn preview
```

## Architecture

### Core Technologies
- **React 19** with TypeScript strict mode
- **Vite 7** for build tooling
- **Tailwind CSS 4** with CSS variables for theming
- **shadcn/ui** (New York style) built on Radix UI primitives
- **React Router v7** for routing
- **Axios** for API calls with auth interceptors

### Key Directories
- `src/api/` - Axios client with auth interceptors and typed API endpoints
- `src/components/ui/` - shadcn/ui primitive components (excluded from linting)
- `src/pages/` - Route page components handling their own data fetching
- `src/contexts/` - React Context for global state (user, permissions, features, i18n)
- `src/hooks/` - Custom hooks (useDocs, useDebounce, useDocumentTitle)
- `src/i18n/` - Internationalization with zh-hans and en locales

### State Management
- Global state via React Context (AppContext) - no external state library
- Custom hooks for data fetching with local state
- OAuth-based authentication with token in cookies

### Markdown Rendering
- react-markdown with remark-gfm, remark-math
- rehype-highlight for syntax highlighting
- rehype-katex for LaTeX math
- Mermaid for diagrams (client-side with DOMPurify sanitization)

### API Layer
- Centralized Axios instance in `api/client.ts`
- 401 responses redirect to login, 403 to forbidden page
- All endpoints typed with TypeScript interfaces

## Development Guidelines

- Use **yarn** as package manager
- Use **eslint-config-alloy** for linting
- All user-facing text must use i18n (via `useApp().t`) - no hardcoded strings
- Use shadcn/ui components for UI elements
- Use Tailwind CSS for styling
- Run `yarn lint` and `yarn build` after code changes

## Environment Variables

Required in `.env` (see `.env.example`):
```
VITE_FRONTEND_URL      # Frontend base URL
VITE_BACKEND_URL       # Backend API URL
VITE_SSO_URL           # OAuth redirect URL
VITE_SSO_API_URL       # SSO API endpoint
VITE_ALLOWED_HOSTS     # Comma-separated allowed domains
```

`generate-config.js` injects these as `window.ENV` for runtime configuration.

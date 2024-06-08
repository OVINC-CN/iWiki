import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import prismjs from 'vite-plugin-prismjs';

export default defineConfig({
  plugins: [
    vue(),
    prismjs({
      languages: [
        'bash',
        'c',
        'cmake',
        'cpp',
        'css',
        'dart',
        'django',
        'docker',
        'go',
        'go-module',
        'java',
        'javascript',
        'json',
        'latex',
        'lua',
        'mermaid',
        'php',
        'python',
        'rust',
        'scheme',
        'sql',
        'swift',
        'toml',
        'typescript',
        'yaml',
      ],
    }),
  ],
  define: {
    'process.env': {
      BACKEND_URL: process.env.BACKEND_URL,
      SITE_URL: process.env.SITE_URL,
      OVINC_URL: process.env.OVINC_URL,
      OVINC_WEB_URL: process.env.OVINC_WEB_URL,
    },
  },
  base: '/',
  publicDir: 'public',
  server: {
    host: process.env.HOST,
    port: 8080,
  },
  css: {
    preprocessorOptions:
    {
      scss:
        {
          charset: false,
        },
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('markdown')) {
            return 'markdown';
          }
          if (id.includes('arco-design')) {
            return 'arco-design';
          }
          if (id.includes('v-md-editor')) {
            return 'v-md-editor';
          }
        },
      },
    },
  },
});

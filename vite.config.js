import {defineConfig, loadEnv} from 'vite';
import vue from '@vitejs/plugin-vue';
import prismjs from 'vite-plugin-prismjs';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
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
        BACKEND_URL: env.BACKEND_URL,
        SITE_URL: env.SITE_URL,
        OVINC_URL: env.OVINC_URL,
        OVINC_WEB_URL: env.OVINC_WEB_URL,
        VDITOR_CDN: env.VDITOR_CDN,
      },
    },
    base: '/',
    publicDir: 'public',
    server: {
      host: env.HOST || '0.0.0.0',
      port: 8080,
      allowedHosts: env.SITE_URL ? [new URL(env.SITE_URL).host] : [],
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
            if (id.includes('vditor')) {
              return 'vditor';
            }
            if (id.includes('mermaid')) {
              return 'mermaid';
            }
          },
        },
      },
    },
  };
});

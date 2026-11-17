import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envVars = [
  'VITE_BACKEND_URL',
  'VITE_FRONTEND_URL',
];

const config = envVars.reduce((acc, key) => {
  if (process.env[key]) {
    acc[key] = process.env[key];
  }
  return acc;
}, {});

const content = `window.ENV = ${JSON.stringify(config, null, 2)};`;

const publicDir = path.resolve(__dirname, 'public');

// 开发时直接提供配置，生产构建按内容生成哈希文件名。
if (fs.existsSync(publicDir)) {
  fs.writeFileSync(path.join(publicDir, 'config.js'), content);
  console.log('Generated public/config.js');
}

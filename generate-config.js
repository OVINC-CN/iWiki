import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envVars = [
  'VITE_BACKEND_URL',
  'VITE_SSO_URL',
  'VITE_FRONTEND_URL',
  'VITE_SSO_API_URL',
  'VITE_ALLOWED_HOSTS'
];

const config = envVars.reduce((acc, key) => {
  if (process.env[key]) {
    acc[key] = process.env[key];
  }
  return acc;
}, {});

const content = `window.ENV = ${JSON.stringify(config, null, 2)};`;

const publicDir = path.resolve(__dirname, 'public');
const distDir = path.resolve(__dirname, 'dist');

// Write to public/config.js for dev
if (fs.existsSync(publicDir)) {
  fs.writeFileSync(path.join(publicDir, 'config.js'), content);
  console.log('Generated public/config.js');
}

// Write to dist/config.js for build preview
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'config.js'), content);
  console.log('Generated dist/config.js');
}

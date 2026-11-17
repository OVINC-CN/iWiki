import { readdir } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { argv, stderr, stdout } from 'node:process';
import { pagePaths } from '../src/routes.ts';

async function listAssetPaths(dist: string): Promise<string[]> {
    const entries = await readdir(dist, { recursive: true, withFileTypes: true });
    const paths = entries
        .filter((entry) => entry.isFile())
        .map((entry) => relative(dist, resolve(entry.parentPath, entry.name)));

    if (!paths.includes('index.html')) {
        throw new Error('CDN_WEB_DIST 中没有 index.html，请先构建或指定前端部署产物目录');
    }

    return paths.map((path) => `/${path.split(sep).map(encodeURIComponent).join('/')}`);
}

async function main() {
    const [, , originValue, dist] = argv;
    if (!originValue || !dist) {
        throw new Error('请设置 CDN_ORIGIN 和 CDN_WEB_DIST');
    }

    const origin = URL.parse(originValue);
    if (
        !origin ||
        !['http:', 'https:'].includes(origin.protocol) ||
        origin.href !== `${origin.origin}/`
    ) {
        throw new Error('CDN_ORIGIN 必须是前端站点的 HTTP 或 HTTPS 源地址');
    }

    // 扫描完成后再输出，避免失败时留下不完整的刷新清单。
    const assets = await listAssetPaths(resolve(dist));
    const urls = new Set(
        [...Object.values(pagePaths), ...assets].map((path) => new URL(path, origin).href),
    );
    stdout.write(`${[...urls].sort().join('\n')}\n`);
}

try {
    await main();
} catch (error) {
    stderr.write(`${error instanceof Error ? error.message : '生成 CDN 刷新清单失败'}\n`);
    process.exitCode = 1;
}

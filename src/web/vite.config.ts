import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'path';

function readBuildHeadFragment(): string {
    const configuredPath = process.env.BUILD_HEAD_FRAGMENT_FILE?.trim();

    if (!configuredPath) {
        return '';
    }

    const fragmentPath = path.isAbsolute(configuredPath)
        ? configuredPath
        : path.resolve(__dirname, configuredPath);

    let fragment: string;

    try {
        fragment = readFileSync(fragmentPath, 'utf-8');
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        throw new Error(`[build-head-fragment] Unable to read "${fragmentPath}": ${reason}`);
    }

    if (!fragment.trim()) {
        throw new Error(`[build-head-fragment] Fragment file "${fragmentPath}" is empty.`);
    }

    return fragment;
}

function injectAfterHead(html: string, fragment: string): string {
    const headOpeningTag = /<head(?:\s[^>]*)?>/i;
    const match = html.match(headOpeningTag);

    if (!match || match.index === undefined) {
        throw new Error('[build-head-fragment] Unable to find an opening <head> tag.');
    }

    const headEnd = match.index + match[0].length;
    const remainder = html.slice(headEnd);
    const lineStart = remainder.match(/^(\r?\n)([ \t]+)/);
    const newline = lineStart?.[1] ?? '\n';
    const indentation = lineStart?.[2] ?? '    ';
    const formattedFragment = fragment
        .trim()
        .split(/\r?\n/)
        .map((line) => (line ? `${indentation}${line}` : ''))
        .join(newline);

    return `${html.slice(0, headEnd)}${newline}${formattedFragment}${remainder}`;
}

// Vite 构建与开发配置。
export default defineConfig(({ command }) => {
    const headFragment = command === 'build' ? readBuildHeadFragment() : '';

    return {
        plugins: [
            react(),
            tailwindcss(),
            {
                name: 'build-runtime-config',
                apply: 'build',
                async writeBundle(outputOptions) {
                    if (!outputOptions.dir) {
                        this.error('[build-runtime-config] Unable to determine the output directory.');
                    }

                    const configPath = path.resolve(outputOptions.dir, 'config.js');
                    const content = await readFile(configPath, 'utf8');
                    const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
                    const filename = `config.${hash}.js`;
                    const htmlPath = path.resolve(outputOptions.dir, 'index.html');
                    const html = await readFile(htmlPath, 'utf8');
                    const reference = 'src="/config.js"';

                    if (html.split(reference).length !== 2) {
                        this.error('[build-runtime-config] Expected exactly one config.js script reference.');
                    }

                    await writeFile(path.resolve(outputOptions.dir, filename), content);
                    await writeFile(htmlPath, html.replace(reference, `src="/${filename}"`));
                    await rm(configPath);
                },
            },
            {
                name: 'build-head-fragment',
                apply: 'build',
                transformIndexHtml: {
                    order: 'post',
                    handler(html) {
                        return headFragment ? injectAfterHead(html, headFragment) : html;
                    },
                },
            },
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 5173,
            allowedHosts: true as const,
        },
    };
});

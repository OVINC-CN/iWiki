import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const configFile = fileURLToPath(new URL('../vite.config.ts', import.meta.url));
const html = '<html><head><script src="/config.js"></script></head><body></body></html>';

async function createFixture() {
    const root = await realpath(await mkdtemp(join(tmpdir(), 'iwiki-config-')));
    await mkdir(join(root, 'public'));
    await writeFile(join(root, 'index.html'), html);
    return root;
}

async function buildFixture(root: string, source: string) {
    await writeFile(join(root, 'public/config.js'), source);
    await build({ configFile, root, logLevel: 'silent' });
    const files = await readdir(join(root, 'dist'));
    const configs = files.filter((file) => /^config\.[a-f0-9]{12}\.js$/.test(file));
    assert.equal(configs.length, 1);
    assert.ok(!files.includes('config.js'));
    const filename = configs[0];
    const outputHTML = await readFile(join(root, 'dist/index.html'), 'utf8');
    assert.ok(outputHTML.includes(`src="/${filename}"`));
    assert.ok(!outputHTML.includes('src="/config.js'));
    assert.equal(await readFile(join(root, 'dist', filename), 'utf8'), source);
    assert.equal(await readFile(join(root, 'public/config.js'), 'utf8'), source);
    assert.equal(await readFile(join(root, 'index.html'), 'utf8'), html);
    return filename;
}

test('build hashes the final configuration, rewrites HTML and keeps hashes stable until content changes', async (context) => {
    const root = await createFixture();
    context.after(() => rm(root, { recursive: true, force: true }));
    const source = 'window.ENV = { "VITE_BACKEND_URL": "https://api.example.com" };';
    const first = await buildFixture(root, source);
    const repeated = await buildFixture(root, source);
    const changed = await buildFixture(root, source.replace('api.example.com', 'api2.example.com'));
    assert.equal(repeated, first);
    assert.notEqual(changed, first);
});

test('build rejects missing or duplicate configuration script references', async (context) => {
    const root = await createFixture();
    context.after(() => rm(root, { recursive: true, force: true }));
    await writeFile(join(root, 'public/config.js'), 'window.ENV = {};');

    for (const document of [
        '<html><head></head><body></body></html>',
        html.replace('</head>', '<script src="/config.js"></script></head>'),
    ]) {
        await writeFile(join(root, 'index.html'), document);
        await assert.rejects(
            build({ configFile, root, logLevel: 'silent' }),
            /Expected exactly one config.js script reference/,
        );
    }
});

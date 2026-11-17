import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execPath } from 'node:process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { matchRoutes } from 'react-router';
import ts from 'typescript';
import { docDetailPath, docEditPath, pagePaths } from '../src/routes.ts';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const scriptPath = join(projectRoot, 'scripts/cdn-urls.ts');

function runManifest(origin: string, dist: string) {
    return spawnSync(execPath, [scriptPath, origin, dist], { encoding: 'utf8' });
}

test('all registered page routes use fixed paths and share the CDN manifest', () => {
    const source = ts.createSourceFile(
        'App.tsx',
        readFileSync(join(projectRoot, 'src/App.tsx'), 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
    );
    const paths: string[] = [];

    function visit(node: ts.Node) {
        if (ts.isJsxAttribute(node) && node.name.getText(source) === 'path') {
            const value = node.initializer;
            assert.ok(value && ts.isJsxExpression(value));
            const expression = value.expression;
            assert.ok(expression && ts.isPropertyAccessExpression(expression));
            assert.equal(expression.expression.getText(source), 'pagePaths');
            const path = pagePaths[expression.name.text as keyof typeof pagePaths];
            assert.equal(typeof path, 'string');
            assert.doesNotMatch(path, /[:*?]/);
            paths.push(path);
        }
        ts.forEachChild(node, visit);
    }

    visit(source);
    assert.deepEqual(new Set(paths), new Set(Object.values(pagePaths)));
    assert.equal(paths.length, new Set(paths).size);

    const routes = paths.map((path) => ({ path }));
    assert.equal(matchRoutes(routes, '/docs/123'), null);
    assert.equal(matchRoutes(routes, '/docs/123/edit'), null);
    assert.ok(matchRoutes(routes, '/docs/detail?id=123'));
    assert.ok(matchRoutes(routes, '/docs/edit?id=123'));
});

test('document links round-trip IDs without injecting query parameters or fragments', () => {
    for (const id of ['123', '文档 / 100%+?#&=']) {
        for (const [buildPath, pathname] of [
            [docDetailPath, pagePaths.docDetail],
            [docEditPath, pagePaths.docEdit],
        ] as const) {
            const url = new URL(buildPath(id), 'https://wiki.example.com');
            assert.equal(url.pathname, pathname);
            assert.equal(url.searchParams.get('id'), id);
            assert.equal(url.searchParams.size, 1);
            assert.equal(url.hash, '');
        }
    }
});

test('make emits sorted, unique page and build URLs, including encoded nested assets', (context) => {
    const directory = mkdtempSync(join(tmpdir(), 'iwiki-cdn-'));
    const dist = join(directory, 'build with spaces');
    context.after(() => rmSync(directory, { recursive: true, force: true }));
    const files = ['index.html', 'config.abc123def456.js', 'favicon.ico', 'assets/app #100%.js', 'assets/文档.pdf', 'docs/detail'];
    for (const file of files) {
        mkdirSync(dirname(join(dist, file)), { recursive: true });
        writeFileSync(join(dist, file), 'fixture');
    }

    const result = spawnSync('make', [
        '--no-print-directory',
        'cdn-urls',
        'CDN_ORIGIN=https://wiki.example.com/',
        `CDN_WEB_DIST=${dist}`,
    ], { cwd: projectRoot, encoding: 'utf8' });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    const expected = [
        ...Object.values(pagePaths),
        '/index.html',
        '/config.abc123def456.js',
        '/favicon.ico',
        '/assets/app%20%23100%25.js',
        '/assets/%E6%96%87%E6%A1%A3.pdf',
    ].map((path) => `https://wiki.example.com${path}`).sort();
    assert.equal(result.stdout, `${expected.join('\n')}\n`);
});

test('invalid origins fail without producing a partial refresh list', () => {
    for (const origin of [
        '',
        'invalid',
        'ftp://wiki.example.com',
        'https://user:pass@wiki.example.com',
        'https://wiki.example.com/path',
        'https://wiki.example.com/?id=123',
        'https://wiki.example.com/#fragment',
    ]) {
        const result = runManifest(origin, projectRoot);
        assert.notEqual(result.status, 0);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /CDN_ORIGIN/);
    }
});

test('missing or incomplete build directories fail without producing a partial refresh list', (context) => {
    const dist = mkdtempSync(join(tmpdir(), 'iwiki-cdn-'));
    context.after(() => rmSync(dist, { recursive: true, force: true }));
    writeFileSync(join(dist, 'config.js'), 'fixture');

    for (const directory of [dist, join(dist, 'missing')]) {
        const result = runManifest('https://wiki.example.com', directory);
        assert.notEqual(result.status, 0);
        assert.equal(result.stdout, '');
        assert.notEqual(result.stderr, '');
    }
});

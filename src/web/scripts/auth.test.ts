import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAuthPage, loginPath, pagePaths, safeReturnPath } from '../src/routes.ts';
import { parseOIDCCallback } from '../src/utils/auth.ts';

test('login links preserve local queries and fragments without nesting authentication pages', () => {
    const original = '/docs/detail?id=note%201&tag=a&tag=b#section-2';
    const login = new URL(loginPath(original), 'https://wiki.example.com');
    assert.equal(login.pathname, pagePaths.login);
    assert.equal(login.searchParams.get('return_to'), original);
    assert.equal(login.searchParams.size, 1);
    assert.equal(safeReturnPath(original), original);
    assert.ok(isAuthPage(pagePaths.login));
    assert.ok(isAuthPage(pagePaths.loginCallback));
    assert.equal(isAuthPage(pagePaths.docs), false);
});

test('return paths reject external targets, encoded separators and login loops', () => {
    for (const value of [
        '', 'https://attacker.example', '//attacker.example', '/\\attacker.example',
        '/%2fattack.example', '/%5cattack.example', '/%00evil', '/%0aevil', '/%invalid',
        '/login', '/login?return_to=/login', '/login/callback?code=secret', '/docs/../login',
        '/v1/auth', '/v1/auth/oidc/login', '/403', '/docs\n//attacker.example',
    ]) {
        assert.equal(safeReturnPath(value), '/', value);
        assert.equal(new URL(loginPath(value), 'https://wiki.example.com').searchParams.get('return_to'), '/');
    }
});

test('OIDC callbacks accept a single code or provider error with the original state', () => {
    const state = 'A'.repeat(43);
    assert.deepEqual(parseOIDCCallback(`?state=${state}&code=code%2Bvalue`), { state, code: 'code+value' });
    assert.deepEqual(parseOIDCCallback(`?state=${state}&error=access_denied&error_description=ignored`), {
        state, error: 'access_denied',
    });
});

test('OIDC callbacks reject missing, duplicated or ambiguous authorization parameters', () => {
    const state = 'A'.repeat(43);
    for (const search of [
        '', '?code=value', '?state=short&code=value', `?state=${state}`,
        `?state=${state}&state=${state}&code=value`, `?state=${state}&code=first&code=second`,
        `?state=${state}&code=value&error=access_denied`, `?state=${state}&code=`,
        `?state=${state}&error=`, `?state=${state}&error=first&error=second`,
    ]) {
        assert.throws(() => parseOIDCCallback(search), /登录请求无效或已失效/);
    }
});

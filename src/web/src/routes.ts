export const pagePaths = {
    home: '/',
    docs: '/docs',
    docNew: '/docs/new',
    docDetail: '/docs/detail',
    docEdit: '/docs/edit',
    login: '/login',
    loginCallback: '/login/callback',
    forbidden: '/403',
} as const;

export function isAuthPage(pathname: string): boolean {
    const path = pathname.replace(/\/+$/, '');
    return path === pagePaths.login || path === pagePaths.loginCallback;
}

function hasControlCharacters(value: string): boolean {
    return Array.from(value).some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127;
    });
}

// 只接受站内业务路径，保留查询参数和锚点。
export function safeReturnPath(value: string): string {
    if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || hasControlCharacters(value)) {
        return pagePaths.home;
    }
    try {
        const target = new URL(value, 'https://wiki.invalid');
        const pathname = decodeURIComponent(target.pathname);
        if (target.origin !== 'https://wiki.invalid' || pathname.startsWith('//') ||
            pathname.includes('\\') || hasControlCharacters(pathname) ||
            pathname === pagePaths.login || pathname.startsWith(`${pagePaths.login}/`) ||
            pathname === '/v1/auth' || pathname.startsWith('/v1/auth/') ||
            pathname === pagePaths.forbidden) {
            return pagePaths.home;
        }
        return `${target.pathname}${target.search}${target.hash}`;
    } catch {
        return pagePaths.home;
    }
}

export function loginPath(returnTo: string): string {
    return `${pagePaths.login}?${new URLSearchParams({ return_to: safeReturnPath(returnTo) })}`;
}

export function docDetailPath(id: string): string {
    return `${pagePaths.docDetail}?${new URLSearchParams({ id })}`;
}

export function docEditPath(id: string): string {
    return `${pagePaths.docEdit}?${new URLSearchParams({ id })}`;
}

export const pagePaths = {
    home: '/',
    docs: '/docs',
    docNew: '/docs/new',
    docDetail: '/docs/detail',
    docEdit: '/docs/edit',
    forbidden: '/403',
} as const;

export function docDetailPath(id: string): string {
    return `${pagePaths.docDetail}?${new URLSearchParams({ id })}`;
}

export function docEditPath(id: string): string {
    return `${pagePaths.docEdit}?${new URLSearchParams({ id })}`;
}

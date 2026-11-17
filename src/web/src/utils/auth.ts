export interface OIDCCallback {
    state: string;
    code?: string;
    error?: string;
}

// 回调必须包含单个状态值，以及授权码或错误代码中的一项。
export function parseOIDCCallback(search: string): OIDCCallback {
    const query = new URLSearchParams(search);
    const states = query.getAll('state');
    const codes = query.getAll('code');
    const errors = query.getAll('error');
    if (states.length !== 1 || !/^[A-Za-z0-9_-]{43}$/.test(states[0]) ||
        codes.length > 1 || errors.length > 1 ||
        (codes.length === 1) === (errors.length === 1) ||
        (codes.length === 1 && !codes[0]) || (errors.length === 1 && !errors[0])) {
        throw new Error('登录请求无效或已失效，请重新登录');
    }
    return codes.length === 1 ? { state: states[0], code: codes[0] } :
        { state: states[0], error: errors[0] };
}

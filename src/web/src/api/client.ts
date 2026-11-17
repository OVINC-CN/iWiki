import axios, { type AxiosError } from 'axios';
import { config } from '@/config';
import { isAuthPage, loginPath, pagePaths } from '@/routes';

let redirecting = false;

export const redirectToLogin = (returnTo?: string) => {
    if (redirecting) {
        return;
    }
    redirecting = true;
    window.location.replace(loginPath(returnTo ||
        `${window.location.pathname}${window.location.search}${window.location.hash}`));
};

function createClient() {
    const client = axios.create({
        baseURL: `${config.API_BASE_URL}/v1`,
        withCredentials: true,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
        paramsSerializer: { indexes: null },
    });
    client.interceptors.response.use((response) => response, (error: AxiosError) => {
        const body = error.response?.data as { error_msg?: unknown } | undefined;
        error.message = typeof body?.error_msg === 'string' && body.error_msg ?
            body.error_msg : '请求失败，请稍后重试';
        return Promise.reject(error);
    });
    return client;
}

export const authClient = createClient();
export const apiClient = createClient();

apiClient.interceptors.response.use((response) => response, (error: AxiosError) => {
    if (isAuthPage(window.location.pathname) || window.location.pathname === pagePaths.forbidden) {
        return Promise.reject(error);
    }
    if (error.response?.status === 401) {
        redirectToLogin();
    } else if (error.response?.status === 403) {
        window.location.replace(pagePaths.forbidden);
    }
    return Promise.reject(error);
});

export default apiClient;

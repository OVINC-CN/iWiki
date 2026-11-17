import axios, { type AxiosError } from 'axios';
import { config } from '@/config';

let redirecting = false;

export const redirectToLogin = (returnTo?: string) => {
    if (redirecting) {
        return;
    }
    redirecting = true;
    const target = new URL(`${config.API_BASE_URL}/v1/auth/oidc/login`, window.location.origin);
    target.searchParams.set('return_to', returnTo ||
        `${window.location.pathname}${window.location.search}${window.location.hash}`);
    window.location.replace(target.href);
};

export const apiClient = axios.create({
    baseURL: `${config.API_BASE_URL}/v1`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
    paramsSerializer: { indexes: null },
});

apiClient.interceptors.response.use((response) => response, (error: AxiosError) => {
    const body = error.response?.data as { error_msg?: unknown } | undefined;
    error.message = typeof body?.error_msg === 'string' && body.error_msg ?
        body.error_msg : '请求失败，请稍后重试';
    if (error.response?.status === 401) {
        redirectToLogin();
    } else if (error.response?.status === 403 && window.location.pathname !== '/403') {
        window.location.replace('/403');
    }
    return Promise.reject(error);
});

export default apiClient;

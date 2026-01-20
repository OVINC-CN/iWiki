import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';

const { API_BASE_URL, SSO_URL, FRONTEND_URL } = config;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    },
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Only redirect to login if not on the login callback page
            if (!window.location.pathname.includes('/login/callback')) {
                const currentUrl = encodeURIComponent(window.location.href);
                const callbackUrl = encodeURIComponent(`${FRONTEND_URL}/login/callback`);
                window.location.href = `${SSO_URL}/login/?next=${callbackUrl}?redirect=${currentUrl}`;
            }
        } else if (error.response?.status === 403) {
            if (window.location.pathname !== '/403' && !window.location.pathname.includes('/login/callback')) {
                window.location.href = '/403';
            }
        }
        return Promise.reject(error);
    },
);

export const redirectToLogin = () => {
    const currentUrl = encodeURIComponent(window.location.href);
    const callbackUrl = encodeURIComponent(`${FRONTEND_URL}/login/callback`);
    window.location.href = `${SSO_URL}/login/?next=${callbackUrl}?redirect=${currentUrl}`;
};

export default apiClient;

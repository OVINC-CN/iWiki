import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
const SSO_URL = import.meta.env.VITE_SSO_URL || '';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

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
  }
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
    }
    return Promise.reject(error);
  }
);

export const redirectToLogin = () => {
  const currentUrl = encodeURIComponent(window.location.href);
  const callbackUrl = encodeURIComponent(`${FRONTEND_URL}/login/callback`);
  window.location.href = `${SSO_URL}/login/?next=${callbackUrl}?redirect=${currentUrl}`;
};

export default apiClient;

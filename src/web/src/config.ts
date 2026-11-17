declare global {
    interface Window {
        ENV?: {
            VITE_BACKEND_URL?: string;
            VITE_FRONTEND_URL?: string;
        };
    }
}

export const getConfig = (key: keyof NonNullable<Window['ENV']>) => {
    return window.ENV?.[key] || import.meta.env[key] || '';
};

export const config = {
    API_BASE_URL: getConfig('VITE_BACKEND_URL').replace(/\/+$/, ''),
    FRONTEND_URL: getConfig('VITE_FRONTEND_URL') || window.location.origin,
};

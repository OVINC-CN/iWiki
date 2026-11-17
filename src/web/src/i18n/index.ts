import zhHans from './locales/zh-hans';
import en from './locales/en';

export type Locale = 'zh-hans' | 'en';
export type Translations = typeof zhHans;

const translations: Record<Locale, Translations> = {
    'zh-hans': zhHans,
    en,
};

export const getTranslation = (lang: string): Translations => {
    const locale = (lang === 'en' ? 'en' : 'zh-hans') as Locale;
    return translations[locale];
};

// Helper to get nested property by path string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((prev, curr) => {
        return prev ? prev[curr] : null;
    }, obj) || path;
};

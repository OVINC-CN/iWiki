import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);

export const formatDate = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatDateShort = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatRelativeTime = (date: string | Date, locale?: string) => {
  const localeMap: Record<string, string> = {
    'zh-hans': 'zh-cn',
    'en': 'en',
  };
  const dayjsLocale = locale ? localeMap[locale] || 'en' : 'zh-cn';
  return dayjs(date).locale(dayjsLocale).fromNow();
};

export const isToday = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'day');
};

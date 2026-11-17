const relativeFormatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export const formatDate = (value: string | Date) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '时间无效' : dateFormatter.format(date).replaceAll('/', '-');
};

export const formatDateShort = (value: string | Date) => formatDate(value).split(' ')[0];

export const formatRelativeTime = (value: string | Date) => {
    const seconds = (new Date(value).getTime() - Date.now()) / 1000;
    if (!Number.isFinite(seconds)) {
        return '时间无效';
    }
    const magnitude = Math.abs(seconds);
    // 格式化相对时间。
    if (magnitude < 60) {
        return relativeFormatter.format(Math.round(seconds), 'second');
    }
    if (magnitude < 3600) {
        return relativeFormatter.format(Math.round(seconds / 60), 'minute');
    }
    if (magnitude < 86400) {
        return relativeFormatter.format(Math.round(seconds / 3600), 'hour');
    }
    if (magnitude < 2592000) {
        return relativeFormatter.format(Math.round(seconds / 86400), 'day');
    }
    if (magnitude < 31536000) {
        return relativeFormatter.format(Math.round(seconds / 2592000), 'month');
    }
    return relativeFormatter.format(Math.round(seconds / 31536000), 'year');
};

export const isToday = (value: string | Date) => {
    const date = new Date(value);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
};

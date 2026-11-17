import COS from 'cos-js-sdk-v5';
import { getTempSecret } from '@/api';

export const uploadFileToCOS = async (
    file: File,
    onProgress?: (progress: number) => void,
): Promise<string> => {
    const response = await getTempSecret(file.name);
    const credentials = response.data.data;
    if (file.size > credentials.max_file_bytes) {
        throw new Error('文件超过上传大小限制');
    }

    // 创建 COS 上传客户端。
    const cos = new COS({
        SecretId: credentials.secret_id,
        SecretKey: credentials.secret_key,
        SecurityToken: credentials.token,
    });
    return new Promise((resolve, reject) => {
        cos.putObject({
            Bucket: credentials.cos_bucket,
            Region: credentials.cos_region,
            Key: credentials.key,
            Body: file,
            onProgress: (progress) => onProgress?.(Math.round(progress.percent * 100)),
        }, (error) => {
            if (error) {
                reject(new Error('文件上传失败，请稍后重试'));
                return;
            }
            const base = new URL(credentials.cos_url);
            base.pathname = `${base.pathname.replace(/\/$/, '')}/${credentials.key}`;
            if (credentials.cdn_sign && credentials.cdn_sign_param) {
                base.searchParams.set(credentials.cdn_sign_param, credentials.cdn_sign);
            }
            resolve(base.href);
        });
    });
};

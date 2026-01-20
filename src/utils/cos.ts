import COS from 'cos-js-sdk-v5';
import { getTempSecret } from '@/api';

export const uploadFileToCOS = async (
    file: File,
    onProgress?: (progress: number) => void,
): Promise<string> => {
    // Get temp secret from backend
    const response = await getTempSecret(file.name);
    const credentials = response.data.data;

    // Initialize COS SDK
    const cos = new COS({
        SecretId: credentials.secret_id,
        SecretKey: credentials.secret_key,
        SecurityToken: credentials.token,
    });

    return new Promise((resolve, reject) => {
        cos.uploadFile(
            {
                Bucket: credentials.cos_bucket,
                Region: credentials.cos_region,
                Key: credentials.key,
                Body: file,
                onProgress: (progressData) => {
                    if (onProgress) {
                        onProgress(Math.round(progressData.percent * 100));
                    }
                },
            },
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    // Build the final URL with CDN sign if available
                    let url = `${credentials.cos_url}/${credentials.key}`;
                    if (credentials.cdn_sign && credentials.cdn_sign_param) {
                        url += `?${credentials.cdn_sign_param}=${credentials.cdn_sign}`;
                    }
                    if (credentials.image_format) {
                        url += url.includes('?') ? '&' : '?';
                        url += credentials.image_format;
                    }
                    resolve(url);
                }
            },
        );
    });
};

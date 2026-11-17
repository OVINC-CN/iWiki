import { z } from 'zod';

// API 响应模型和类型定义。
const timestamp = z.iso.datetime({ offset: true });
export const userSchema = z.object({
    username: z.string().min(1),
    nick_name: z.string().nullable(),
    user_type: z.enum(['personal', 'platform']),
    last_login: timestamp.nullable(),
});

export const tagSchema = z.object({ id: z.string().min(1), name: z.string() });
export const docListSchema = z.object({
    id: z.string().min(1),
    owner: z.string(),
    owner_nick_name: z.string(),
    title: z.string(),
    header_img: z.string().nullable(),
    is_public: z.boolean(),
    pv: z.number().int().nonnegative(),
    comments: z.number().int().nonnegative(),
    tags: z.array(z.string()),
    updated_at: timestamp,
    created_at: timestamp,
});
export const docSchema = docListSchema.extend({ content: z.string() });
export const permissionSchema = z.object({
    permission_item: z.enum(['create_doc', 'upload_file']),
    expired_at: timestamp.nullable(),
});
export const featureSchema = z.object({ doc_fuzzy_search: z.boolean() });
export const credentialSchema = z.object({
    cos_url: z.url(), cos_bucket: z.string(), cos_region: z.string(), key: z.string(),
    secret_id: z.string(), secret_key: z.string(), token: z.string(),
    start_time: z.number().int(), expired_time: z.number().int(),
    cdn_sign: z.string(), cdn_sign_param: z.string(),
    max_file_bytes: z.number().int().positive(),
});
export const homeSchema = z.object({ resp: z.string(), user: userSchema });
export const idSchema = z.object({ id: z.string().min(1) });
export const docPageSchema = z.object({
    total: z.number().int().nonnegative(), current: z.number().int().positive(),
    results: z.array(docListSchema),
});
export const envelopeSchema = <T extends z.ZodType>(data: T) => z.object({
    trace: z.string().regex(/^[0-9a-f]{32}$/), error_msg: z.string(), data,
});

export type UserInfo = z.infer<typeof userSchema>;
export type TagInfo = z.infer<typeof tagSchema>;
export type DocList = z.infer<typeof docListSchema>;
export type DocInfo = z.infer<typeof docSchema>;
export type UserPermission = z.infer<typeof permissionSchema>;
export type FeatureResponse = z.infer<typeof featureSchema>;
export type COSCredentialResponse = z.infer<typeof credentialSchema>;
export type HomeResponse = z.infer<typeof homeSchema>;

export interface ApiResponse<T> {
    trace: string;
    error_msg: string;
    data: T;
}

export interface PaginatedResponse<T> {
    total: number;
    current: number;
    results: T[];
}

export interface EditDocRequest {
    title: string;
    content: string;
    header_img: string | null;
    is_public: boolean;
    tags: string[];
    created_at?: string;
}

export type SearchMode = 'title' | 'content' | 'all';

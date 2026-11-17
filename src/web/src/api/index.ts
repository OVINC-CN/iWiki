import type { AxiosResponse } from 'axios';
import { z } from 'zod';
import apiClient, { authClient } from './client';
import type { OIDCCallback } from '@/utils/auth';
import {
    credentialSchema, docPageSchema, docSchema, envelopeSchema, featureSchema,
    homeSchema, idSchema, loginURLSchema, loginResultSchema, permissionSchema, tagSchema, userSchema,
    type ApiResponse, type EditDocRequest,
} from '@/types';

async function checked<T extends z.ZodType>(
    pending: Promise<AxiosResponse<unknown>>, schema: T,
): Promise<AxiosResponse<ApiResponse<z.infer<T>>>> {
    const response = await pending;
    const result = envelopeSchema(schema).safeParse(response.data);
    if (!result.success) {
        throw new Error('数据加载失败，请稍后重试');
    }
    return { ...response, data: result.data as ApiResponse<z.infer<T>> };
}

export const getHomeInfo = () => checked(apiClient.get('/home'), homeSchema);
export const getUserInfo = () => checked(apiClient.get('/user-info'), userSchema);
export const signOut = () => checked(apiClient.post('/auth/logout'), z.null());

export const startOIDCLogin = (returnTo: string) =>
    checked(authClient.get('/auth/oidc/login', { params: { return_to: returnTo } }), loginURLSchema);

export const completeOIDCLogin = async (params: OIDCCallback) => {
    const result = await checked(authClient.get('/auth/oidc/callback', { params }), loginResultSchema);
    await checked(authClient.get('/user-info'), userSchema);
    return result;
};

export const getDocs = (params?: {
    page?: number;
    size?: number;
    tags?: string[];
    keywords?: string[];
}) => checked(apiClient.get('/docs', { params }), docPageSchema);

export const getDocDetail = (id: string) =>
    checked(apiClient.get(`/docs/${encodeURIComponent(id)}`), docSchema);
export const createDoc = (data: EditDocRequest) =>
    checked(apiClient.post('/docs', data), idSchema);
export const updateDoc = (id: string, data: EditDocRequest) =>
    checked(apiClient.put(`/docs/${encodeURIComponent(id)}`, data), idSchema);
export const deleteDoc = (id: string) =>
    checked(apiClient.delete(`/docs/${encodeURIComponent(id)}`), z.null());

export const getTags = () => checked(apiClient.get('/tags'), z.array(tagSchema));
export const getBoundTags = () => checked(apiClient.get('/tags/bound'), z.array(tagSchema));
export const getPermissions = () => checked(apiClient.get('/permissions'), z.array(permissionSchema));
export const getFeatures = () => checked(apiClient.get('/features'), featureSchema);
export const getTempSecret = (filename: string) =>
    checked(apiClient.post('/cos/temp-secret', { filename }), credentialSchema);

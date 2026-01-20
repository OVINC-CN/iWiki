import apiClient from './client';
import type {
    ApiResponse,
    PaginatedResponse,
    HomeResponse,
    DocList,
    DocInfo,
    TagInfo,
    UserPermission,
    FeatureResponse,
    COSCredentialResponse,
    EditDocRequest,
} from '@/types';

// Home API
export const getHomeInfo = () =>
    apiClient.get<ApiResponse<HomeResponse>>('/');

// Account APIs
export const signIn = (code: string) =>
    apiClient.post('/account/sign_in/', { code });

export const signOut = () =>
    apiClient.get('/account/sign_out/');

export const getUserInfo = () =>
    apiClient.get('/account/user_info/');

// Document APIs
export const getDocs = (params?: {
  page?: number;
  size?: number;
  tags?: string;
  keywords?: string;
}) =>
    apiClient.get<ApiResponse<PaginatedResponse<DocList>>>('/docs/', { params });

export const getDocDetail = (id: string) =>
    apiClient.get<ApiResponse<DocInfo>>(`/docs/${id}/`);

export const createDoc = (data: EditDocRequest) =>
    apiClient.post<ApiResponse<{ id: string }>>('/docs/', data);

export const updateDoc = (id: string, data: EditDocRequest) =>
    apiClient.put<ApiResponse<{ id: string }>>(`/docs/${id}/`, data);

export const deleteDoc = (id: string) =>
    apiClient.delete(`/docs/${id}/`);

// Tag APIs
export const getTags = (params?: { page?: number; size?: number }) =>
    apiClient.get<ApiResponse<TagInfo[]>>('/tags/', { params });

export const getBoundTags = (params?: { page?: number; size?: number }) =>
    apiClient.get<ApiResponse<TagInfo[]>>('/tags/bound/', { params });

// Permission API
export const getPermissions = () =>
    apiClient.get<ApiResponse<UserPermission[]>>('/permissions/');

// Feature API
export const getFeatures = () =>
    apiClient.get<ApiResponse<FeatureResponse>>('/features/');

// COS API
export const getTempSecret = (filename: string) =>
    apiClient.post<ApiResponse<COSCredentialResponse>>('/cos/temp_secret/', { filename });

// I18n API
export const changeLanguage = (language: string) =>
    apiClient.post('/i18n/', { language });

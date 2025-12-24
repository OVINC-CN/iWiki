// User types
export interface UserInfo {
  username: string;
  nick_name: string | null;
  user_type: 'personal' | 'platform';
  last_login: string | null;
}

// API response types
export interface ApiResponse<T> {
  message: string;
  trace: string | null;
  data: T;
}

export interface PaginatedResponse<T> {
  total: number;
  current: number;
  results: T[];
}

// Tag types
export interface TagInfo {
  id: string;
  name: string;
}

// Document types
export interface DocList {
  id: string;
  owner: string;
  owner_nick_name: string;
  title: string;
  header_img: string | null;
  is_public: boolean;
  pv: number;
  comments: number;
  tags: TagInfo[];
  updated_at: string;
  created_at: string;
}

export interface DocInfo extends DocList {
  content: string;
}

export interface EditDocRequest {
  title: string;
  content: string;
  header_img: string | null;
  is_public: boolean;
  tags: string[];
  created_at?: string;
}

// Permission types
export interface UserPermission {
  permission_item: 'create_doc' | 'upload_file';
  expired_at: string | null;
}

// Feature types
export interface FeatureResponse {
  doc_fuzzy_search: boolean;
}

// COS types
export interface COSCredentialResponse {
  cos_url: string;
  cos_bucket: string;
  cos_region: string;
  key: string;
  secret_id: string;
  secret_key: string;
  token: string;
  start_time: number;
  expired_time: number;
  cdn_sign: string;
  cdn_sign_param: string;
  image_format: string;
}

// Home response
export interface HomeResponse {
  resp: string;
  user: UserInfo;
}

// Search mode type
export type SearchMode = 'title' | 'content' | 'all';

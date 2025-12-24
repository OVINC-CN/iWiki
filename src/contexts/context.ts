import { createContext } from 'react';
import type { UserInfo, UserPermission, FeatureResponse } from '../types';

import { type Translations } from '../i18n';

export interface AppContextType {
  user: UserInfo | null;
  permissions: UserPermission[];
  features: FeatureResponse | null;
  loading: boolean;
  isLoggedIn: boolean;
  hasPermission: (permission: 'create_doc' | 'upload_file') => boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  login: () => void;
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
  t: Translations;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

import React, { useState, useEffect, useCallback } from 'react';
import type { UserInfo, UserPermission, FeatureResponse } from '../types';
import { getHomeInfo, getPermissions, getFeatures, signOut as apiSignOut, changeLanguage as apiChangeLanguage } from '../api';
import { getTranslation } from '../i18n';
import { redirectToLogin } from '../api/client';
import { AppContext } from './context';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [features, setFeatures] = useState<FeatureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>(localStorage.getItem('language') || 'zh-hans');
  const t = getTranslation(language);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const [homeRes, permRes, featRes] = await Promise.all([
        getHomeInfo(),
        getPermissions().catch(() => null),
        getFeatures().catch(() => null),
      ]);

      const userData = homeRes.data.data.user;
      if (userData?.username) {
        setUser(userData);
      }

      if (permRes?.data.data) {
        setPermissions(permRes.data.data);
      }

      if (featRes?.data.data) {
        setFeatures(featRes.data.data);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const hasPermission = useCallback(
    (permission: 'create_doc' | 'upload_file') => {
      const perm = permissions.find((p) => p.permission_item === permission);
      if (!perm) return false;
      if (perm.expired_at && new Date(perm.expired_at) < new Date()) return false;
      return true;
    },
    [permissions]
  );

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
      setUser(null);
      setPermissions([]);
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  const login = useCallback(() => {
    redirectToLogin();
  }, []);

  const changeLanguage = useCallback(async (lang: string) => {
    try {
      await apiChangeLanguage(lang);
      setLanguage(lang);
      localStorage.setItem('language', lang);
      window.location.reload();
    } catch (error) {
      console.error('Change language failed:', error);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        permissions,
        features,
        loading,
        isLoggedIn: !!user,
        hasPermission,
        refreshUser: fetchUserData,
        signOut,
        login,
        language,
        changeLanguage,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

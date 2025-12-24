import React, { useState, useEffect, useCallback } from 'react';
import type { UserInfo, UserPermission, FeatureResponse } from '../types';
import { getHomeInfo, getPermissions, getFeatures, signOut as apiSignOut } from '../api';
import { redirectToLogin } from '../api/client';
import { AppContext } from './context';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [features, setFeatures] = useState<FeatureResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

      if (permRes?.data.data.results) {
        setPermissions(permRes.data.data.results);
      }

      if (featRes?.data.data.results?.[0]) {
        setFeatures(featRes.data.data.results[0]);
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

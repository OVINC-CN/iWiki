import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router';
import type { UserInfo, UserPermission, FeatureResponse } from '@/types';
import { getHomeInfo, getPermissions, getFeatures, signOut as apiSignOut } from '@/api';
import { redirectToLogin } from '@/api/client';
import { AppContext } from './context';
import { isAuthPage, pagePaths } from '@/routes';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [permissions, setPermissions] = useState<UserPermission[]>([]);
    const [features, setFeatures] = useState<FeatureResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = useCallback(async () => {
        if (isAuthPage(location.pathname) || location.pathname === pagePaths.forbidden) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const [home, permission, feature] = await Promise.all([
                getHomeInfo(), getPermissions(), getFeatures(),
            ]);
            setUser(home.data.data.user);
            setPermissions(permission.data.data);
            setFeatures(feature.data.data);
        } catch (reason) {
            setUser(null);
            setPermissions([]);
            setFeatures(null);
            setError(reason instanceof Error ? reason.message : '加载用户信息失败');
        } finally {
            setLoading(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const hasPermission = useCallback((permission: 'create_doc' | 'upload_file') => {
        const item = permissions.find((entry) => entry.permission_item === permission);
        return !!item && (!item.expired_at || new Date(item.expired_at).getTime() > Date.now());
    }, [permissions]);

    const signOut = useCallback(async () => {
        await apiSignOut();
        setUser(null);
        setPermissions([]);
        setFeatures(null);
        redirectToLogin('/');
    }, []);

    const login = useCallback(() => redirectToLogin(), []);
    const value = useMemo(() => ({
        user, permissions, features, loading, error, isLoggedIn: !!user,
        hasPermission, refreshUser: fetchUserData, signOut, login,
    }), [user, permissions, features, loading, error, hasPermission, fetchUserData, signOut, login]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, tokenStorage } from '@/lib/auth';
import { AuthState } from '@/types/auth';

/**
 * Authentication Context
 * Provides auth state and methods to all child components
 */
interface AuthContextType extends Omit<AuthState, 'refreshToken'> {
  login: (user_id: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
    accessToken: null,
    refreshToken: null,
  });

  /**
   * Initialize auth state from localStorage on mount (client-side only)
   */
  useEffect(() => {
    let isActive = true;

    const initializeAuth = async () => {
      try {
        const storedState = tokenStorage.getAuthState();
        const token = tokenStorage.getAccessToken();

        if (!storedState || !token) {
          if (isActive) {
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: null,
              accessToken: null,
              refreshToken: null,
            });
          }
          return;
        }

        const userResult = await authApi.getCurrentUser();
        if (!isActive) return;

        if (userResult.success) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userResult.data,
            error: null,
            accessToken: token,
            refreshToken: storedState.refresh_token,
          });
          return;
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }

      tokenStorage.clearAuthState();
      if (isActive) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
          accessToken: null,
          refreshToken: null,
        });
      }
    };

    void initializeAuth();

    return () => {
      isActive = false;
    };
  }, []);

  /**
   * Handle login
   */
  const handleLogin = useCallback(
    async (user_id: string, password: string) => {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await authApi.login(user_id, password);

      if (!result.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
        }));
        return { success: false, error: result.error };
      }

      // Fetch user profile
      const userResult = await authApi.getCurrentUser();
      if (userResult.success) {
        const storedState = tokenStorage.getAuthState();
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: userResult.data,
          accessToken: tokenStorage.getAccessToken(),
          refreshToken: storedState?.refresh_token || null,
          isLoading: false,
          error: null,
        }));
        return { success: true };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: userResult.error,
        }));
        return { success: false, error: userResult.error };
      }
    },
    []
  );

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await authApi.logout();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      accessToken: null,
      refreshToken: null,
    });
  }, []);

  /**
   * Handle token refresh
   */
  const handleRefreshToken = useCallback(async (): Promise<boolean> => {
    if (tokenStorage.shouldRefreshToken()) {
      const result = await authApi.refreshAccessToken();
      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: prev.user,
          accessToken: tokenStorage.getAccessToken(),
          refreshToken: tokenStorage.getRefreshToken(),
        }));
        return true;
      } else {
        // Refresh failed, logout
        await handleLogout();
        return false;
      }
    }
    return true;
  }, [handleLogout]);

  /**
   * Fetch and update user profile
   */
  const handleGetUser = useCallback(async () => {
    const result = await authApi.getCurrentUser();
    if (result.success) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: result.data,
        accessToken: tokenStorage.getAccessToken(),
        refreshToken: tokenStorage.getRefreshToken(),
        error: null,
      }));
    } else {
      // User fetch failed, logout
      await handleLogout();
    }
  }, [handleLogout]);

  const value: AuthContextType = {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
    getUser: handleGetUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * Throws error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to get current user
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to get access token
 */
export function useAccessToken() {
  const { accessToken } = useAuth();
  return accessToken;
}

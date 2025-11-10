/**
 * useAuth Hook
 * Manages admin authentication state and session verification
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { STORAGE_KEYS } from '@/config/constants';

export interface AuthState {
  authenticated: boolean;
  email: string | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    email: null,
    loading: true,
    error: null,
  });

  // Verify authentication on mount
  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await adminApi.verify();

      if (response.success && response.data?.authenticated) {
        setAuthState({
          authenticated: true,
          email: response.data.email,
          loading: false,
          error: null,
        });
        return true;
      } else {
        setAuthState({
          authenticated: false,
          email: null,
          loading: false,
          error: null,
        });
        router.push('/admin/login');
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Auth verification failed';
      setAuthState({
        authenticated: false,
        email: null,
        loading: false,
        error: message,
      });
      router.push('/admin/login');
      return false;
    }
  }, [router]);

  const login = useCallback(
    async (email: string, code: string) => {
      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        const response = await adminApi.login(email, code);

        if (response.success) {
          setAuthState({
            authenticated: true,
            email: response.data?.email || email,
            loading: false,
            error: null,
          });
          return true;
        } else {
          setAuthState((prev) => ({
            ...prev,
            error: response.error || 'Login failed',
            loading: false,
          }));
          return false;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        setAuthState((prev) => ({
          ...prev,
          error: message,
          loading: false,
        }));
        return false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      setAuthState({
        authenticated: false,
        email: null,
        loading: false,
        error: null,
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  return {
    ...authState,
    login,
    logout,
    verifyAuth,
  };
}

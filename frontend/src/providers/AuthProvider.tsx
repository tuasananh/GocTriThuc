import type { AuthContextType } from '@/contexts/AuthContext';
import AuthContext from '@/contexts/AuthContext';
import { CurrentUser, type CurrentUserResponse } from '@/types';
import { api } from '@/lib/api';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const login = (provider: string) => {
  window.location.href = `/oauth2/authorization/${provider}`;
};

const unauthenticatedAuthValue: AuthContextType = {
  isAuthenticated: false,
  login,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authValue, setAuthValue] = useState<AuthContextType | null>(null);
  const navigate = useNavigate();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get<CurrentUserResponse>('/api/users/me', {
        validateStatus: (status) => status >= 200 && status < 500,
      });

      if (response.status >= 400) {
        setAuthValue(unauthenticatedAuthValue);
        return;
      }

      const data = response.data;

      if (data.authenticated === true) {
        const user = new CurrentUser(
          data.id,
          data.displayName,
          data.email,
          data.avatarUrl,
          data.username,
          data.roles,
          data.permissions,
        );

        setAuthValue({
          isAuthenticated: true,
          user,
          logout: async () => {
            await api.post('/api/logout');
            setAuthValue(unauthenticatedAuthValue);
            navigate('/');
          },
          refreshUser: async () => {
            await fetchCurrentUser();
          },
        });
      } else {
        setAuthValue(unauthenticatedAuthValue);
      }
    } catch (error) {
      console.error('Failed to fetch user data', error);
      setAuthValue(unauthenticatedAuthValue);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

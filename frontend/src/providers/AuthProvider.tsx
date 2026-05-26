import type { AuthContextType } from '@/contexts/AuthContext';
import AuthContext from '@/contexts/AuthContext';
import type { CurrentUserResponse } from '@/dtos/CurrentUserResponse';
import { CurrentUser } from '@/entities/CurrentUser';
import axios from 'axios';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch('/api/users/me');
        if (!response.ok) {
          setAuthValue(unauthenticatedAuthValue);
          return;
        }

        const data: CurrentUserResponse = await response.json();

        if (data.authenticated === true) {
          const user = new CurrentUser(
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
              await axios.post('/api/logout');
              setAuthValue(unauthenticatedAuthValue);
              navigate('/');
            },
          });
        } else {
          setAuthValue(unauthenticatedAuthValue);
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
        setAuthValue(unauthenticatedAuthValue);
      }
    }

    fetchCurrentUser();
  }, [navigate]);

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

import React, { useState, useEffect } from 'react';
import apiClient from '../services/api-client';
import { AuthContext } from './auth-context';
import type { User } from './auth-context';

// Helper to decode JWT claims in pure client-side JS
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT', e);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // Ensure we have a valid 3-part JWT, discarding legacy mock credentials
    if (storedToken && storedToken.split('.').length === 3 && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    } else if (storedToken || storedUser) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('active_workspace_id');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { accessToken, refreshToken } = response.data;

    const claims = decodeJwt(accessToken);
    if (!claims) {
      throw new Error('Invalid token claims structure');
    }

    const parsedUser: User = {
      id: claims.sub,
      email: claims.email,
      name: claims.email.split('@')[0] || 'User',
      roles: claims.roles
        ? claims.roles.split(',').map((r: string) => r.trim())
        : ['USER'],
    };

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(parsedUser));

    setToken(accessToken);
    setUser(parsedUser);
  };

  const register = async (email: string, password: string) => {
    // Post user registration (backend triggers default workspace provisioning)
    await apiClient.post('/auth/register', { email, password });
    // Automate login for smooth UX
    await login(email, password);
  };

  const logout = async () => {
    try {
      // Best-effort logout API notification
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Backend logout failed or server unreachable', e);
    } finally {
      // Enforce local session clearance
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('active_workspace_id');
      setToken(null);
      setUser(null);
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { authApi } from '../api/authApi';
import { getStoredToken, setStoredToken, removeStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    removeStoredToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      setUser(response.user);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('callpilot:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('callpilot:unauthorized', handleUnauthorized);
    };
  }, [refreshUser, logout]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authApi.login(email, password);
    setStoredToken(response.token);
    setTokenState(response.token);
    setUser(response.user);
    return response.user;
  };

  const value: AuthContextType = {
    user,
    token,
    role: user?.role || null,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

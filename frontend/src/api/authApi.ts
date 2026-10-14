import { apiClient } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    return apiClient<{ user: User }>('/api/auth/me', {
      method: 'GET',
    });
  },
};

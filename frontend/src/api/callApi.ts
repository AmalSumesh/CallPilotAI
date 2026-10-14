import { apiClient } from './client';
import type { Conversation, CreateConversationPayload } from '../types';

export const callApi = {
  getConversations: async (): Promise<{ count: number; conversations: Conversation[] }> => {
    return apiClient<{ count: number; conversations: Conversation[] }>('/api/conversations', {
      method: 'GET',
    });
  },

  getConversationById: async (id: string): Promise<{ conversation: Conversation }> => {
    return apiClient<{ conversation: Conversation }>(`/api/conversations/${id}`, {
      method: 'GET',
    });
  },

  createConversation: async (
    payload: CreateConversationPayload | string,
    sourceFallback?: 'upload' | 'live'
  ): Promise<{ message: string; conversation: Conversation }> => {
    const body =
      typeof payload === 'string'
        ? { title: payload, source: sourceFallback || 'upload' }
        : payload;

    return apiClient<{ message: string; conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  deleteConversation: async (id: string): Promise<{ message: string; id: string }> => {
    return apiClient<{ message: string; id: string }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },
};

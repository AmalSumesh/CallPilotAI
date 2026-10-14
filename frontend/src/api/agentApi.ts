import { apiClient } from './client';
import type { Agent, CreateAgentPayload } from '../types';

export const agentApi = {
  getAgents: async (): Promise<{ count: number; agents: Agent[] }> => {
    return apiClient<{ count: number; agents: Agent[] }>('/api/agents', {
      method: 'GET',
    });
  },

  createAgent: async (payload: CreateAgentPayload): Promise<{ message: string; agent: Agent }> => {
    return apiClient<{ message: string; agent: Agent }>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateAgentStatus: async (id: string, isActive: boolean): Promise<{ message: string; agent: Agent }> => {
    return apiClient<{ message: string; agent: Agent }>(`/api/agents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
};

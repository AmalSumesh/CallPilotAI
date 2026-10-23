import React, { useState, useEffect } from 'react';
import { UserPlus, Users, CheckCircle, ShieldAlert } from 'lucide-react';
import { agentApi } from '../api/agentApi';
import type { Agent } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { AgentTable } from '../components/agents/AgentTable';
import { CreateAgentModal } from '../components/agents/CreateAgentModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const AgentManagement: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await agentApi.getAgents();
      setAgents(res.agents || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch agent directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAgentCreated = (newAgent: Agent) => {
    setAgents((prev) => [newAgent, ...prev]);
    setNotification(`Agent ${newAgent.name} successfully created!`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      setIsTogglingStatus(true);
      const updatedStatus = !agent.isActive;
      const res = await agentApi.updateAgentStatus(agent._id, updatedStatus);

      setAgents((prev) =>
        prev.map((a) => (a._id === agent._id ? { ...a, isActive: res.agent.isActive } : a))
      );

      setNotification(
        `Agent ${agent.name} is now ${res.agent.isActive ? 'Active' : 'Deactivated'}.`
      );
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setError((err as Error).message || 'Failed to update agent status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const activeCount = agents.filter((a) => a.isActive).length;
  const inactiveCount = agents.length - activeCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Directory"
        subtitle="Provision, manage, and monitor authorized contact center agents"
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition"
          >
            <UserPlus className="w-4 h-4" />
            Provision Agent
          </button>
        }
      />

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {notification}
          </span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={fetchAgents} />}

      {/* Directory Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Agents</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{agents.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Accounts</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Deactivated Accounts</p>
            <p className="text-xl font-bold text-slate-600 dark:text-slate-400">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner label="Loading agent records..." size="lg" />
        </div>
      ) : (
        <AgentTable
          agents={agents}
          onToggleStatus={handleToggleStatus}
          isLoadingAction={isTogglingStatus}
        />
      )}

      {/* Provision Agent Modal */}
      <CreateAgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAgentCreated={handleAgentCreated}
      />
    </div>
  );
};

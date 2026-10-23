import React, { useState } from 'react';
import { Search, UserCheck, UserX, Shield, Calendar } from 'lucide-react';
import type { Agent } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';

interface AgentTableProps {
  agents: Agent[];
  onToggleStatus: (agent: Agent) => Promise<void>;
  isLoadingAction?: boolean;
}

export const AgentTable: React.FC<AgentTableProps> = ({
  agents,
  onToggleStatus,
  isLoadingAction = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!selectedAgent) return;
    await onToggleStatus(selectedAgent);
    setSelectedAgent(null);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agents by name or email..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total Agents: <span className="font-semibold text-slate-800 dark:text-slate-200">{agents.length}</span>
          </span>
        </div>

        {/* Table */}
        {filteredAgents.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No agents found"
              description={
                searchTerm
                  ? 'No agent accounts match your search query.'
                  : 'No agent accounts exist in the database yet.'
              }
              icon={Shield}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Agent Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAgents.map((agent) => (
                  <tr key={agent._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-200 dark:border-blue-800">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{agent.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">{agent.email}</td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        agent
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge
                        status={agent.isActive ? 'active' : 'inactive'}
                        variant="agentStatus"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        {formatDate(agent.createdAt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedAgent(agent)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition border ${
                          agent.isActive
                            ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                            : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                        }`}
                      >
                        {agent.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedAgent && (
        <ConfirmModal
          isOpen={!!selectedAgent}
          title={selectedAgent.isActive ? 'Deactivate Agent Account' : 'Activate Agent Account'}
          message={`Are you sure you want to ${
            selectedAgent.isActive ? 'deactivate' : 'activate'
          } ${selectedAgent.name} (${selectedAgent.email})? ${
            selectedAgent.isActive
              ? 'The agent will immediately lose access to CallPilot AI until reactivated.'
              : 'The agent will immediately regain access to log in and analyze calls.'
          }`}
          confirmLabel={selectedAgent.isActive ? 'Deactivate Account' : 'Activate Account'}
          variant={selectedAgent.isActive ? 'danger' : 'primary'}
          isLoading={isLoadingAction}
          onConfirm={handleConfirmStatusToggle}
          onCancel={() => setSelectedAgent(null)}
        />
      )}
    </>
  );
};

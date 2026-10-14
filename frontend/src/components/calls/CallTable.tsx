import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, PhoneCall, Calendar, Filter, Trash2 } from 'lucide-react';
import type { Conversation } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';

interface CallTableProps {
  calls: Conversation[];
  showAgentColumn?: boolean;
  baseDetailPath?: string;
  onDelete?: (call: Conversation) => void;
}

export const CallTable: React.FC<CallTableProps> = ({
  calls,
  showAgentColumn = true,
  baseDetailPath = '/admin/calls',
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'upload' | 'live'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof call.agentId === 'object' &&
        call.agentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSource = sourceFilter === 'all' || call.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;

    return matchesSearch && matchesSource && matchesStatus;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or agent..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as 'all' | 'upload' | 'live')}
              className="bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="upload">Upload</option>
              <option value="live">Live</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'processing' | 'failed')}
              className="bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredCalls.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No call records found"
            description={
              searchTerm || sourceFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'No analyzed calls have been recorded yet.'
            }
            icon={PhoneCall}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Call Title</th>
                {showAgentColumn && <th className="py-3.5 px-4">Agent</th>}
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Signal</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCalls.map((call) => {
                const agentName =
                  typeof call.agentId === 'object' && call.agentId ? call.agentId.name : 'Assigned Agent';

                return (
                  <tr
                    key={call._id}
                    className="hover:bg-slate-50/80 transition group cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        to={`${baseDetailPath}/${call._id}`}
                        className="font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-2"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                        <span className="truncate max-w-xs">{call.title}</span>
                      </Link>
                    </td>

                    {showAgentColumn && (
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {agentName}
                      </td>
                    )}

                    <td className="py-3.5 px-4">
                      <StatusBadge status={call.source} variant="source" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={call.status} variant="callStatus" />
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {formatDuration(call.duration)}
                    </td>

                    <td className="py-3.5 px-4">
                      {call.escalationDetected ? (
                        <StatusBadge status="escalated" variant="escalation" />
                      ) : (
                        <span className="text-[11px] text-slate-400">Normal</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        {formatDate(call.createdAt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`${baseDetailPath}/${call._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                        >
                          Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        {onDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDelete(call);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete Call Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Count */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex justify-between items-center">
        <span>Showing {filteredCalls.length} of {calls.length} calls</span>
        <span className="font-mono">Backend Persisted</span>
      </div>
    </div>
  );
};

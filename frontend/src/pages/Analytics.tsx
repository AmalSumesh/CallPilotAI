import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Users, Calendar, Filter } from 'lucide-react';
import { callApi } from '../api/callApi';
import { agentApi } from '../api/agentApi';
import { useAuth } from '../context/AuthContext';
import type { Conversation, Agent, EmotionName } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/common/MetricCard';
import { CallVolumeChart } from '../components/charts/CallVolumeChart';
import { EmotionDistributionChart } from '../components/charts/EmotionDistributionChart';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [calls, setCalls] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [callsRes, agentsRes] = await Promise.all([
        callApi.getConversations(),
        isAdmin ? agentApi.getAgents() : Promise.resolve({ agents: [] }),
      ]);

      setCalls(callsRes.conversations || []);
      setAgents(agentsRes.agents || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load analytics metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  // Filter calls by date and agent
  const filteredCalls = useMemo(() => {
    const now = new Date();
    return calls.filter((call) => {
      // Date filter
      if (dateFilter !== 'all') {
        const callDate = new Date(call.createdAt);
        if (dateFilter === 'today') {
          const isToday =
            callDate.getDate() === now.getDate() &&
            callDate.getMonth() === now.getMonth() &&
            callDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === '7d') {
          const diffDays = (now.getTime() - callDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === '30d') {
          const diffDays = (now.getTime() - callDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      // Agent filter
      if (agentFilter !== 'all') {
        const agentId = typeof call.agentId === 'object' ? call.agentId?._id : call.agentId;
        if (agentId !== agentFilter) return false;
      }

      return true;
    });
  }, [calls, dateFilter, agentFilter]);

  // Aggregate Emotion Distribution
  const emotionDistribution = useMemo(() => {
    const counts: Record<EmotionName, number> = {
      anger: 0,
      disgust: 0,
      fear: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
    };

    filteredCalls.forEach((call) => {
      if (call.emotionTrend) {
        call.emotionTrend.forEach((pt) => {
          let maxVal = -1;
          let maxEmotion: EmotionName = 'neutral';
          const list: EmotionName[] = ['anger', 'disgust', 'fear', 'happy', 'neutral', 'sad'];
          list.forEach((em) => {
            const v = pt[em] || 0;
            if (v > maxVal) {
              maxVal = v;
              maxEmotion = em;
            }
          });
          counts[maxEmotion] = (counts[maxEmotion] || 0) + 1;
        });
      }
    });

    return counts;
  }, [filteredCalls]);

  // Daily Call Volume
  const volumeData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredCalls.forEach((call) => {
      const d = new Date(call.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [filteredCalls]);

  // Agent comparison metrics for Admin
  const agentComparison = useMemo(() => {
    if (!isAdmin) return [];

    const map: Record<string, { name: string; total: number; escalations: number }> = {};

    filteredCalls.forEach((call) => {
      const agentId = typeof call.agentId === 'object' ? call.agentId?._id : call.agentId;
      const agentName = typeof call.agentId === 'object' ? call.agentId?.name : 'Unknown Agent';

      if (agentId) {
        if (!map[agentId]) {
          map[agentId] = { name: agentName || 'Agent', total: 0, escalations: 0 };
        }
        map[agentId].total += 1;
        if (call.escalationDetected) {
          map[agentId].escalations += 1;
        }
      }
    });

    return Object.values(map);
  }, [isAdmin, filteredCalls]);

  const totalCalls = filteredCalls.length;
  const escalationCount = filteredCalls.filter((c) => c.escalationDetected).length;
  const escalationRate = totalCalls > 0 ? ((escalationCount / totalCalls) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Calculating contact center emotion analytics..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligence Analytics"
        subtitle="Aggregate emotion distribution, escalation ratios, and agent performance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Date filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | '7d' | '30d')}
                className="bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Agent filter (if Admin) */}
            {isAdmin && agents.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="bg-transparent focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Agents</option>
                  {agents.map((ag) => (
                    <option key={ag._id} value={ag._id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={fetchData} />}

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Analyzed Calls"
          value={totalCalls}
          subtitle="Filtered dataset sample"
          icon={BarChart3}
          variant="blue"
        />

        <MetricCard
          title="Escalation Rate"
          value={`${escalationRate}%`}
          subtitle={`${escalationCount} of ${totalCalls} calls triggered signals`}
          icon={AlertTriangle}
          variant={parseFloat(escalationRate) > 20 ? 'rose' : 'emerald'}
        />

        <MetricCard
          title="Classification Signal"
          value="WavLM Attention"
          subtitle="Trained speech feature extractor"
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Volume Trend */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Call Volume Cadence</h3>
            <p className="text-xs text-slate-500">Total conversation recordings by date</p>
          </div>
          <CallVolumeChart data={volumeData} height={220} />
        </div>

        {/* Emotion Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Emotion Distribution</h3>
            <p className="text-xs text-slate-500">
              Aggregated frequency of predicted emotion classes
            </p>
          </div>
          <EmotionDistributionChart distribution={emotionDistribution} />
        </div>
      </div>

      {/* Team / Agent Level Comparison (for Admin) */}
      {isAdmin && agentComparison.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Agent Performance & Escalation Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Authorized supervisor breakdown of agent call volumes and frustration escalations
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Total Calls</th>
                  <th className="py-3 px-4">Frustration Escalations</th>
                  <th className="py-3 px-4">Escalation Ratio</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentComparison.map((ag, idx) => {
                  const ratio = ag.total > 0 ? Math.round((ag.escalations / ag.total) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{ag.name}</td>
                      <td className="py-3 px-4 font-mono">{ag.total}</td>
                      <td className="py-3 px-4 font-mono text-rose-700 font-semibold">
                        {ag.escalations}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${Math.min(100, ratio)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold">{ratio}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${
                            ratio > 30
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {ratio > 30 ? 'High Escalations' : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

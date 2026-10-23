import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall,
  Users,
  Clock,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { callApi } from '../api/callApi';
import { agentApi } from '../api/agentApi';
import type { Conversation, Agent, EmotionName } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/common/MetricCard';
import { CallVolumeChart } from '../components/charts/CallVolumeChart';
import { EmotionDistributionChart } from '../components/charts/EmotionDistributionChart';
import { CallTable } from '../components/calls/CallTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const AdminDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filter state: 'all' | 'today' | '7d' | '30d'
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [callsRes, agentsRes] = await Promise.all([
        callApi.getConversations(),
        agentApi.getAgents(),
      ]);

      setConversations(callsRes.conversations || []);
      setAgents(agentsRes.agents || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load dashboard data from backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter conversations by selected date range
  const filteredCalls = useMemo(() => {
    if (dateFilter === 'all') return conversations;

    const now = new Date();
    return conversations.filter((call) => {
      const callDate = new Date(call.createdAt);
      if (dateFilter === 'today') {
        return (
          callDate.getDate() === now.getDate() &&
          callDate.getMonth() === now.getMonth() &&
          callDate.getFullYear() === now.getFullYear()
        );
      }
      if (dateFilter === '7d') {
        const diffDays = (now.getTime() - callDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (dateFilter === '30d') {
        const diffDays = (now.getTime() - callDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [conversations, dateFilter]);

  // Derived Metrics
  const totalCalls = filteredCalls.length;
  const activeAgentsCount = agents.filter((a) => a.isActive).length;

  const totalDuration = filteredCalls.reduce((acc, c) => acc + (c.duration || 0), 0);
  const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const formattedAvgDuration = `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`;

  const escalationCount = filteredCalls.filter((c) => c.escalationDetected).length;
  const completedAnalyses = filteredCalls.filter((c) => c.status === 'completed').length;

  // Emotion Distribution Aggregation across analyzed calls
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
      if (call.emotionTrend && call.emotionTrend.length > 0) {
        call.emotionTrend.forEach((pt) => {
          let maxVal = -1;
          let maxEmotion: EmotionName = 'neutral';
          const emotions: EmotionName[] = ['anger', 'disgust', 'fear', 'happy', 'neutral', 'sad'];
          emotions.forEach((em) => {
            const val = pt[em] || 0;
            if (val > maxVal) {
              maxVal = val;
              maxEmotion = em;
            }
          });
          counts[maxEmotion] = (counts[maxEmotion] || 0) + 1;
        });
      }
    });

    return counts;
  }, [filteredCalls]);

  // Call Volume grouping by day
  const volumeTrend = useMemo(() => {
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

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading CallPilot AI command center..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Date Filter */}
      <PageHeader
        title="Command Center"
        subtitle="Real-time contact center emotion analytics and performance telemetry"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | '7d' | '30d')}
                className="bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="all">All-Time Data</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <Link
              to="/admin/analytics"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              View Analytics
            </Link>
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={fetchData} />}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Calls"
          value={totalCalls}
          subtitle={`${completedAnalyses} analyzed successfully`}
          icon={PhoneCall}
          variant="blue"
          badge={dateFilter.toUpperCase()}
        />

        <MetricCard
          title="Active Agents"
          value={activeAgentsCount}
          subtitle={`Out of ${agents.length} provisioned agents`}
          icon={Users}
          variant="emerald"
        />

        <MetricCard
          title="Average Duration"
          value={formattedAvgDuration}
          subtitle="Audio conversation length"
          icon={Clock}
          variant="purple"
        />

        <MetricCard
          title="Escalation Signals"
          value={escalationCount}
          subtitle="High frustration threshold"
          icon={AlertTriangle}
          variant={escalationCount > 0 ? 'rose' : 'amber'}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Volume Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Call Volume History</h3>
              <p className="text-xs text-slate-500">Inbound and uploaded calls over time</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <CallVolumeChart data={volumeTrend} height={190} />
        </div>

        {/* Aggregate Emotion Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Emotion Distribution</h3>
              <p className="text-xs text-slate-500">Aggregate speech classification</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <EmotionDistributionChart distribution={emotionDistribution} />
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Calls & Recordings</h2>
            <p className="text-xs text-slate-500">Persisted in MongoDB with emotion timeline data</p>
          </div>
          <Link
            to="/admin/calls"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All Calls →
          </Link>
        </div>

        <CallTable calls={filteredCalls.slice(0, 10)} showAgentColumn={true} baseDetailPath="/admin/calls" />
      </div>
    </div>
  );
};

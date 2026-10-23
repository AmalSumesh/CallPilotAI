import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall,
  Clock,
  AlertTriangle,
  Headphones,
  Mic,
  CheckCircle2,
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { callApi } from '../api/callApi';
import { useAuth } from '../context/AuthContext';
import type { Conversation, EmotionName } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/common/MetricCard';
import { CallVolumeChart } from '../components/charts/CallVolumeChart';
import { EmotionDistributionChart } from '../components/charts/EmotionDistributionChart';
import { CallTable } from '../components/calls/CallTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentCalls = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Backend automatically scopes conversations to req.user.id for agent role!
      const res = await callApi.getConversations();
      setCalls(res.conversations || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load personal call records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentCalls();
  }, []);

  const totalCalls = calls.length;
  const totalDuration = calls.reduce((acc, c) => acc + (c.duration || 0), 0);
  const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const formattedAvgDuration = `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`;

  const escalationCount = calls.filter((c) => c.escalationDetected).length;
  const completedCount = calls.filter((c) => c.status === 'completed').length;
  const resolutionRate = totalCalls > 0
    ? `${Math.round(((totalCalls - escalationCount) / totalCalls) * 100)}%`
    : '100%';

  // Emotion distribution for agent's own calls
  const emotionDistribution = useMemo(() => {
    const counts: Record<EmotionName, number> = {
      anger: 0,
      disgust: 0,
      fear: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
    };

    calls.forEach((call) => {
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
  }, [calls]);

  // Volume trend
  const volumeData = useMemo(() => {
    const map: Record<string, number> = {};
    calls.forEach((call) => {
      const d = new Date(call.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [calls]);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading your personal performance console..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || 'Agent'}`}
        subtitle="Your assigned calls, emotion trends, and speech acoustic telemetry"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/agent/live"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition"
            >
              <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Live Stream
            </Link>
            <Link
              to="/agent/analyze"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition"
            >
              <Headphones className="w-3.5 h-3.5" />
              Analyze Call
            </Link>
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={fetchAgentCalls} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="My Calls"
          value={totalCalls}
          subtitle={`${completedCount} completed analyses`}
          icon={PhoneCall}
          variant="blue"
        />

        <MetricCard
          title="Average Duration"
          value={formattedAvgDuration}
          subtitle="Audio conversation length"
          icon={Clock}
          variant="purple"
        />

        <MetricCard
          title="Frustration Signals"
          value={escalationCount}
          subtitle="Calls flagged for customer escalation"
          icon={AlertTriangle}
          variant={escalationCount > 0 ? 'rose' : 'emerald'}
        />

        <MetricCard
          title="Resolution Rate"
          value={resolutionRate}
          subtitle="Calls handled without escalation"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Handled Calls Timeline</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recordings assigned to your agent profile</p>
          </div>
          <CallVolumeChart data={volumeData} height={190} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Emotion Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Customer emotion signals on your calls</p>
          </div>
          <EmotionDistributionChart distribution={emotionDistribution} />
        </div>
      </div>

      {/* Recent Calls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Assigned Calls</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only your authorized calls are retrieved from the backend
            </p>
          </div>
          <Link
            to="/agent/calls"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            All My Calls →
          </Link>
        </div>

        <CallTable calls={calls.slice(0, 10)} showAgentColumn={false} baseDetailPath="/agent/calls" />
      </div>
    </div>
  );
};

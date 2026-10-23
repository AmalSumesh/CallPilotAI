import React, { useState, useEffect } from 'react';
import { PhoneCall, RefreshCw, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callApi } from '../api/callApi';
import type { Conversation } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { CallTable } from '../components/calls/CallTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const CallHistory: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [calls, setCalls] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [callToDelete, setCallToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await callApi.getConversations();
      setCalls(res.conversations || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to retrieve call history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!callToDelete) return;
    try {
      setIsDeleting(true);
      setError(null);
      await callApi.deleteConversation(callToDelete._id);
      setCalls((prev) => prev.filter((c) => c._id !== callToDelete._id));
      setDeleteSuccess(`Call record "${callToDelete.title}" was permanently deleted.`);
      setCallToDelete(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to delete call record');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const baseDetailPath = isAdmin ? '/admin/calls' : '/agent/calls';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? 'Call Audit Records' : 'My Call Records'}
        subtitle={
          isAdmin
            ? 'Enterprise-wide call recordings and speech emotion classification logs'
            : 'Your personal analyzed calls and emotion performance summaries'
        }
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchCalls}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {!isAdmin && (
              <Link
                to="/agent/analyze"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition"
              >
                <Headphones className="w-3.5 h-3.5" />
                Analyze Audio
              </Link>
            )}
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={fetchCalls} />}

      {deleteSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{deleteSuccess}</span>
          <button
            type="button"
            onClick={() => setDeleteSuccess(null)}
            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              Total Records: <span className="font-bold text-blue-600 dark:text-blue-400">{calls.length}</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              {isAdmin
                ? 'Authorized to inspect and manage all agent calls across the organization'
                : 'Showing calls assigned specifically to your agent profile'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner label="Fetching call history..." size="lg" />
        </div>
      ) : (
        <CallTable
          calls={calls}
          showAgentColumn={isAdmin}
          baseDetailPath={baseDetailPath}
          onDelete={(call) => setCallToDelete(call)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!callToDelete}
        title="Delete Call Record"
        message={`Are you sure you want to permanently delete "${callToDelete?.title || 'this call'}"? This will remove all speech emotion predictions and saved audio recordings.`}
        confirmLabel="Delete Call"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCallToDelete(null)}
      />
    </div>
  );
};

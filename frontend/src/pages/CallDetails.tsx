import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  Radio,
  Activity,
  FileText,
  Play,
  Pause,
  Headphones,
  RotateCcw,
  VolumeX,
  Trash2,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { callApi } from '../api/callApi';
import type { Conversation, EmotionName } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmotionTrendChart } from '../components/charts/EmotionTrendChart';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const CallDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [call, setCall] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audio Playback State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playableUrl, setPlayableUrl] = useState<string>('');
  const [audioPlaybackError, setAudioPlaybackError] = useState<string | null>(null);

  // Convert base64 Data URL to Blob URL for 100% reliable browser playback and seeking
  useEffect(() => {
    if (!call?.audioUrl) {
      setPlayableUrl('');
      return;
    }

    if (call.audioUrl.startsWith('data:')) {
      try {
        const parts = call.audioUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'audio/webm';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const objUrl = URL.createObjectURL(blob);
        setPlayableUrl(objUrl);
        setAudioPlaybackError(null);

        return () => {
          URL.revokeObjectURL(objUrl);
        };
      } catch (e) {
        console.error('Failed to convert base64 to Blob URL:', e);
        setPlayableUrl(call.audioUrl);
      }
    } else {
      setPlayableUrl(call.audioUrl);
    }
  }, [call?.audioUrl]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    setAudioPlaybackError(null);
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (err) {
        console.error('Audio play error:', err);
        setAudioPlaybackError('Playback failed. Please try again or use the native player below.');
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const fetchCall = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await callApi.getConversationById(id);
      setCall(res.conversation);
    } catch (err) {
      setError((err as Error).message || 'Failed to retrieve call details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCall();
  }, [id]);

  const backPath = user?.role === 'admin' ? '/admin/calls' : '/agent/calls';

  const handleDeleteCall = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await callApi.deleteConversation(id);
      navigate(backPath, { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Failed to delete call record');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading call analysis and emotion timeline..." size="lg" />
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Calls
        </button>
        <ErrorAlert
          title="Call not found"
          message={error || 'The requested call record does not exist or you lack authorization.'}
          onRetry={fetchCall}
        />
      </div>
    );
  }

  const agentName =
    typeof call.agentId === 'object' && call.agentId ? call.agentId.name : 'Assigned Agent';
  const agentEmail =
    typeof call.agentId === 'object' && call.agentId ? call.agentId.email : '';

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Call History
        </Link>
      </div>

      {/* Header */}
      <PageHeader
        title={call.title}
        subtitle={`Session ID: ${call._id}`}
        badge={call.source.toUpperCase()}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={call.status} variant="callStatus" />
            {call.escalationDetected && (
              <StatusBadge status="escalated" variant="escalation" />
            )}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition shadow-2xs cursor-pointer ml-1"
              title="Delete Call Record"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Call
            </button>
          </div>
        }
      />

      {/* Metadata Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <User className="w-4 h-4 text-slate-400" />
            Agent
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">{agentName}</p>
          {agentEmail && <p className="text-[11px] text-slate-400 truncate">{agentEmail}</p>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Clock className="w-4 h-4 text-slate-400" />
            Duration
          </div>
          <p className="text-sm font-bold text-slate-900 font-mono">
            {formatDuration(call.duration)}
          </p>
          <p className="text-[11px] text-slate-400">Audio playback duration</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Radio className="w-4 h-4 text-slate-400" />
            Input Source
          </div>
          <p className="text-sm font-bold text-slate-900 capitalize">{call.source}</p>
          <p className="text-[11px] text-slate-400">
            {call.source === 'upload' ? 'Batch File Upload' : 'Live Stream Session'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            Recorded At
          </div>
          <p className="text-xs font-bold text-slate-900">{formatDate(call.createdAt)}</p>
          <p className="text-[11px] text-slate-400">Persisted in MongoDB</p>
        </div>
      </div>

      {/* Frustration / Escalation Notice if flagged */}
      {call.escalationDetected && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Frustration-Related Escalation Detected</h4>
            <p className="mt-1 text-rose-700 leading-relaxed">
              Elevated combined anger and disgust signals were detected across speech segments during
              this session. Supervisor review recommended.
            </p>
          </div>
        </div>
      )}

      {/* Emotion Timeline Chart Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Speech Emotion Timeline
            </h3>
            <p className="text-xs text-slate-500">
              WavLM 6-class neural prediction probabilities plotted over time
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {call.emotionTrend?.length || 0} sample windows
          </span>
        </div>

        <EmotionTrendChart data={call.emotionTrend || []} height={280} showFrustrationSignal={true} />
      </div>

      {/* Audio Playback Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Call Audio Recording</h3>
              <p className="text-xs text-slate-500">
                {call.audioUrl
                  ? 'Acoustic waveform and synchronized speech playback'
                  : 'Speech emotion recognition derived via WavLM neural inference'}
              </p>
            </div>
          </div>

          {call.audioUrl && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {formatTime(currentTime)} / {formatTime(audioDuration || call.duration)}
              </span>
            </div>
          )}
        </div>

        {call.audioUrl ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            {audioPlaybackError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{audioPlaybackError}</span>
              </div>
            )}

            <audio
              ref={audioRef}
              src={playableUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
              onEnded={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('Audio load error:', e);
                setAudioPlaybackError('Audio decoder encountered an issue. Try the native player below.');
              }}
              preload="auto"
              className="hidden"
            />

            {/* Custom Controls Bar */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition shrink-0 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {/* Progress Slider */}
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="0"
                  max={audioDuration || call.duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    setCurrentTime(t);
                    if (audioRef.current) audioRef.current.currentTime = t;
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(audioDuration || call.duration)}</span>
                </div>
              </div>

              {/* Reset to Start */}
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = 0;
                  setCurrentTime(0);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                title="Restart Audio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Native Browser Player */}
            {playableUrl && (
              <div className="pt-2 border-t border-slate-200/60">
                <audio
                  controls
                  src={playableUrl}
                  className="w-full h-8"
                  preload="auto"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center gap-3 text-xs text-slate-500">
            <VolumeX className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-700">Audio recording not attached to this legacy record</p>
              <p className="text-[11px] text-slate-400">
                This record contains WavLM emotion predictions ({call.duration}s duration). All new uploaded audio files and live microphone recordings include full synchronized playback here.
              </p>
            </div>
          </div>
        )}

        {/* Transcript Section if text exists */}
        {call.transcript && (
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Transcript
            </h4>
            <p className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
              {call.transcript}
            </p>
          </div>
        )}
      </div>

      {/* Timestamped Emotion Segments Data Table */}
      {call.emotionTrend && call.emotionTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Segmented Window Breakdown</h3>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 text-rose-600">Anger</th>
                  <th className="py-2.5 px-3 text-amber-600">Disgust</th>
                  <th className="py-2.5 px-3 text-purple-600">Fear</th>
                  <th className="py-2.5 px-3 text-emerald-600">Happy</th>
                  <th className="py-2.5 px-3 text-slate-600">Neutral</th>
                  <th className="py-2.5 px-3 text-blue-600">Sad</th>
                  <th className="py-2.5 px-3 text-right">Dominant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {call.emotionTrend.map((pt, idx) => {
                  const emotions: EmotionName[] = [
                    'anger',
                    'disgust',
                    'fear',
                    'happy',
                    'neutral',
                    'sad',
                  ];
                  let maxVal = -1;
                  let maxEmotion: EmotionName = 'neutral';
                  emotions.forEach((em) => {
                    const val = pt[em] || 0;
                    if (val > maxVal) {
                      maxVal = val;
                      maxEmotion = em;
                    }
                  });

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{pt.time.toFixed(1)}s</td>
                      <td className="py-2 px-3 text-rose-700">{Math.round((pt.anger || 0) * 100)}%</td>
                      <td className="py-2 px-3 text-amber-700">
                        {Math.round((pt.disgust || 0) * 100)}%
                      </td>
                      <td className="py-2 px-3 text-purple-700">{Math.round((pt.fear || 0) * 100)}%</td>
                      <td className="py-2 px-3 text-emerald-700">
                        {Math.round((pt.happy || 0) * 100)}%
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        {Math.round((pt.neutral || 0) * 100)}%
                      </td>
                      <td className="py-2 px-3 text-blue-700">{Math.round((pt.sad || 0) * 100)}%</td>
                      <td className="py-2 px-3 text-right">
                        <span className="capitalize font-bold text-slate-900">{maxEmotion}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Call Record"
        message={`Are you sure you want to permanently delete "${call.title}"? This will remove all speech emotion predictions and audio recordings.`}
        confirmLabel="Delete Call"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteCall}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

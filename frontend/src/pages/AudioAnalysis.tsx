import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileAudio,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Save,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { mlApi } from '../api/mlApi';
import { callApi } from '../api/callApi';
import type { MLAnalysisResponse, EmotionPoint, EmotionName, Conversation } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/common/MetricCard';
import { EmotionTrendChart } from '../components/charts/EmotionTrendChart';
import { EmotionDistributionChart } from '../components/charts/EmotionDistributionChart';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorAlert } from '../components/common/ErrorAlert';

const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.flac', '.ogg', '.m4a'];
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export const AudioAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<MLAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persistence state
  const [isSaving, setIsSaving] = useState(false);
  const [savedCall, setSavedCall] = useState<Conversation | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Audio Playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    setAnalysisResult(null);
    setSavedCall(null);
    setSaveSuccess(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file format "${ext}". Please upload WAV, MP3, FLAC, OGG, or M4A.`);
      return;
    }

    if (file.size > MAX_BYTES) {
      setError('File size exceeds the 50 MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      setUploadProgress(10);

      const result = await mlApi.analyzeAudio(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setAnalysisResult(result);
      setUploadProgress(100);
    } catch (err) {
      setError((err as Error).message || 'Failed to complete audio inference.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!analysisResult || !selectedFile) return;

    try {
      setIsSaving(true);
      setError(null);

      // Create conversation record via backend API with full inference metrics and audio recording
      const title = selectedFile.name.replace(/\.[^/.]+$/, '');

      let base64Audio = '';
      try {
        base64Audio = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(selectedFile);
        });
      } catch {
        base64Audio = '';
      }

      const res = await callApi.createConversation({
        title,
        source: 'upload',
        duration: Math.round(analysisResult.audio_duration_seconds),
        audioUrl: base64Audio,
        emotionTrend: trendPoints,
        escalationDetected: hasEscalation,
        status: 'completed',
      });

      setSavedCall(res.conversation);
      setSaveSuccess(`Call record "${res.conversation.title}" and audio recording saved to Call History.`);
    } catch (err) {
      setError((err as Error).message || 'Failed to save analysis to backend database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Convert ML analysis windows into EmotionPoints for EmotionTrendChart
  const trendPoints: EmotionPoint[] = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.results.map((win) => ({
      time: (win.window_start_seconds + win.window_end_seconds) / 2,
      anger: win.emotion_probabilities.anger,
      disgust: win.emotion_probabilities.disgust,
      fear: win.emotion_probabilities.fear,
      happy: win.emotion_probabilities.happy,
      neutral: win.emotion_probabilities.neutral,
      sad: win.emotion_probabilities.sad,
    }));
  }, [analysisResult]);

  // Aggregate emotion counts for Distribution Chart
  const distributionData = useMemo(() => {
    const counts: Record<EmotionName, number> = {
      anger: 0,
      disgust: 0,
      fear: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
    };

    if (analysisResult) {
      analysisResult.results.forEach((win) => {
        counts[win.predicted_emotion] = (counts[win.predicted_emotion] || 0) + 1;
      });
    }

    return counts;
  }, [analysisResult]);

  // Overall dominant emotion across all windows
  const overallDominant = useMemo(() => {
    if (!analysisResult || analysisResult.results.length === 0) return 'neutral';
    let maxCount = -1;
    let dominant: EmotionName = 'neutral';
    Object.entries(distributionData).forEach(([em, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = em as EmotionName;
      }
    });
    return dominant;
  }, [analysisResult, distributionData]);

  // Check if any window exceeded frustration threshold
  const hasEscalation = useMemo(() => {
    if (!analysisResult) return false;
    return analysisResult.results.some(
      (win) => win.frustration_related_signal >= 0.5 || win.predicted_emotion === 'anger'
    );
  }, [analysisResult]);

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Speech Emotion Analysis"
        subtitle="Analyze customer audio recordings using the WavLM neural attention model"
      />

      {error && <ErrorAlert message={error} />}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {saveSuccess}
          </span>
          {savedCall && (
            <Link
              to={`/agent/calls/${savedCall._id}`}
              className="font-bold underline text-emerald-900 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-100 inline-flex items-center gap-1"
            >
              View in Call History <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors p-8 sm:p-10 text-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.flac,.ogg,.m4a"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/60">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Drag and drop your audio file here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 cursor-pointer"
          >
            browse files
          </button>
        </h3>

        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Supported formats: WAV, MP3, FLAC, OGG, M4A • Maximum file size: 50 MB
        </p>

        {/* Selected File Card */}
        {selectedFile && (
          <div className="mt-6 max-w-lg mx-auto bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left overflow-hidden">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0">
                <FileAudio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleStartAnalysis}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing Audio...
                </>
              ) : (
                'Run Emotion Inference'
              )}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mt-6 max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Processing acoustic frames with WavLM...</span>
              <span className="font-mono font-semibold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Audio Player Card (if file chosen) */}
      {audioUrl && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={toggleAudioPlay}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Audio Preview Player</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {currentTime.toFixed(1)}s / {duration > 0 ? duration.toFixed(1) : '0.0'}s
              </p>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => setIsPlaying(false)}
            className="w-full sm:max-w-md"
            controls
          />
        </div>
      )}

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Inference Results & Emotion Timeline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Processed {analysisResult.windows_analyzed} sliding windows ({analysisResult.audio_duration_seconds.toFixed(1)} seconds total duration)
              </p>
            </div>

            <button
              type="button"
              disabled={isSaving || !!savedCall}
              onClick={handleSaveToHistory}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition ${
                savedCall
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                  : 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }`}
            >
              <Save className="w-4 h-4" />
              {savedCall ? 'Analysis Persisted' : isSaving ? 'Saving to DB...' : 'Save to Call History'}
            </button>
          </div>

          {/* Model Note Alert */}
          {analysisResult.note && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="font-semibold">Note on Emotion Intelligence:</strong>{' '}
                {analysisResult.note}
              </span>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Overall Emotion"
              value={overallDominant.toUpperCase()}
              subtitle="Highest aggregate frequency"
              icon={CheckCircle2}
              variant="blue"
            />

            <MetricCard
              title="Duration"
              value={`${analysisResult.audio_duration_seconds.toFixed(1)}s`}
              subtitle={`${analysisResult.windows_analyzed} analysis windows`}
              icon={FileAudio}
              variant="purple"
            />

            <MetricCard
              title="Frustration Signal"
              value={hasEscalation ? 'ELEVATED' : 'LOW'}
              subtitle="Anger + Disgust probability"
              icon={AlertTriangle}
              variant={hasEscalation ? 'rose' : 'emerald'}
            />

            <MetricCard
              title="Sampling Architecture"
              value="16 kHz"
              subtitle="WavLM CNN/Transformer CPU"
              icon={Activity}
              variant="amber"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emotion Trend Over Time</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    6-class probability curves across 3-second sliding windows
                  </p>
                </div>
              </div>
              <EmotionTrendChart data={trendPoints} height={280} showFrustrationSignal={true} />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emotion Distribution</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Distribution across analyzed windows</p>
              </div>
              <EmotionDistributionChart distribution={distributionData} />
            </div>
          </div>

          {/* Detailed Window Predictions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Timestamped Window Breakdown</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed neural model probabilities for each audio segment
              </p>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Window</th>
                    <th className="py-2.5 px-3">Predicted Emotion</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3 text-rose-600 dark:text-rose-400">Anger</th>
                    <th className="py-2.5 px-3 text-amber-600 dark:text-amber-400">Disgust</th>
                    <th className="py-2.5 px-3 text-purple-600 dark:text-purple-400">Fear</th>
                    <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">Happy</th>
                    <th className="py-2.5 px-3 text-slate-600 dark:text-slate-400">Neutral</th>
                    <th className="py-2.5 px-3 text-blue-600 dark:text-blue-400">Sad</th>
                    <th className="py-2.5 px-3 text-rose-700 dark:text-rose-400 font-bold">Frustration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analysisResult.results.map((win, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {win.window_start_seconds.toFixed(1)}s - {win.window_end_seconds.toFixed(1)}s
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={win.predicted_emotion} variant="emotion" />
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {(win.model_confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-rose-700 dark:text-rose-400">
                        {(win.emotion_probabilities.anger * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-amber-700 dark:text-amber-400">
                        {(win.emotion_probabilities.disgust * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-purple-700 dark:text-purple-400">
                        {(win.emotion_probabilities.fear * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400">
                        {(win.emotion_probabilities.happy * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {(win.emotion_probabilities.neutral * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-blue-700 dark:text-blue-400">
                        {(win.emotion_probabilities.sad * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-800 dark:text-rose-400">
                        {(win.frustration_related_signal * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

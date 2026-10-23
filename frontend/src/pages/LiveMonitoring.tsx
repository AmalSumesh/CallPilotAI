import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Wifi,
  WifiOff,
  AlertTriangle,
  Info,
  Activity,
  CheckCircle2,
  Save,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ML_WS_URL } from '../api/client';
import { callApi } from '../api/callApi';
import type { LiveSocketMessage, EmotionPoint, EmotionName, Conversation } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/common/MetricCard';
import { EmotionTrendChart } from '../components/charts/EmotionTrendChart';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const LiveMonitoring: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const [error, setError] = useState<string | null>(null);

  // Persistence state for completed recordings
  const [isSaving, setIsSaving] = useState(false);
  const [savedCall, setSavedCall] = useState<Conversation | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [callTitle, setCallTitle] = useState('');
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const allSessionPointsRef = useRef<EmotionPoint[]>([]);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Live emotion data stream
  const [livePoints, setLivePoints] = useState<EmotionPoint[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionName | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number>(0);
  const [frustrationSignal, setFrustrationSignal] = useState<number>(0);

  // Audio stream references
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  const startStreaming = async () => {
    setError(null);
    setSaveSuccess(null);
    setSavedCall(null);
    setLivePoints([]);
    setCurrentEmotion(null);
    setCurrentConfidence(0);
    setFrustrationSignal(0);
    setSessionDuration(0);
    setCallTitle('');
    allSessionPointsRef.current = [];
    audioChunksRef.current = [];
    sessionStartTimeRef.current = Date.now();
    setStatusMessage('Connecting to ML WebSocket...');

    try {
      // 1. Establish WebSocket connection to FastAPI live service
      const ws = new WebSocket(ML_WS_URL);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusMessage('WebSocket connected. Waiting for server ready handshake...');
      };

      ws.onmessage = (event) => {
        try {
          const data: LiveSocketMessage = JSON.parse(event.data);

          if (data.type === 'ready') {
            setServerReady(true);
            setStatusMessage('Neural stream active (16 kHz PCM16 mono)');
          } else if (data.type === 'emotion') {
            setCurrentEmotion(data.predicted_emotion);
            setCurrentConfidence(data.model_confidence);
            setFrustrationSignal(data.frustration_related_signal);

            const newPoint: EmotionPoint = {
              time: (data.window_start_seconds + data.window_end_seconds) / 2,
              anger: data.emotion_probabilities.anger,
              disgust: data.emotion_probabilities.disgust,
              fear: data.emotion_probabilities.fear,
              happy: data.emotion_probabilities.happy,
              neutral: data.emotion_probabilities.neutral,
              sad: data.emotion_probabilities.sad,
            };

            allSessionPointsRef.current.push(newPoint);

            setLivePoints((prev) => {
              // Keep last 30 seconds for bounded memory
              const updated = [...prev, newPoint];
              return updated.slice(-30);
            });
          } else if (data.type === 'error') {
            setError(`ML Server Error: ${data.message}`);
          }
        } catch {
          // ignore non-json messages
        }
      };

      ws.onerror = () => {
        setError(
          `Unable to connect to live inference socket at ${ML_WS_URL}. Ensure the Python ML service is running.`
        );
        stopStreaming();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsStreaming(false);
        setServerReady(false);
        setStatusMessage('Disconnected');
      };

      // 2. Request user microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Start MediaRecorder to record audio for playback persistence
      audioChunksRef.current = [];
      try {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(1000); // 1-second timeslices
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn('MediaRecorder not available or failed to start:', recErr);
      }

      // 3. Setup Web Audio pipeline to downsample to 16 kHz and convert to PCM16
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      // ScriptProcessor downsamples to 16000 Hz PCM16 chunks
      const bufferSize = 4096;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const sampleRateRatio = audioCtx.sampleRate / 16000;
        const newLength = Math.round(inputData.length / sampleRateRatio);
        const pcm16 = new Int16Array(newLength);

        // Simple linear decimation / resampling to 16 kHz
        for (let i = 0; i < newLength; i++) {
          const originIdx = Math.round(i * sampleRateRatio);
          const sample = Math.max(-1, Math.min(1, inputData[originIdx]));
          pcm16[i] = sample < 0 ? sample * 32768 : sample * 32767;
        }

        // Send binary PCM16 audio bytes to WebSocket
        wsRef.current.send(pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsStreaming(true);
    } catch (err) {
      setError(
        (err as Error).message ||
          'Failed to initialize microphone or WebSocket streaming pipeline.'
      );
      stopStreaming();
    }
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (sessionStartTimeRef.current) {
      const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      setSessionDuration(elapsed);
    }

    setIsStreaming(false);
    setIsConnected(false);
    setServerReady(false);
    setStatusMessage('Disconnected');
  };

  const handleSaveLiveSession = async () => {
    if (allSessionPointsRef.current.length === 0) return;

    try {
      setIsSaving(true);
      setError(null);

      const hasEscalation = allSessionPointsRef.current.some(
        (p) => p.anger >= 0.5 || (p.anger + p.disgust) >= 0.7
      );

      const title =
        callTitle.trim() ||
        `Live Call - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      let base64Audio = '';
      if (audioChunksRef.current.length > 0) {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          base64Audio = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(audioBlob);
          });
        } catch {
          base64Audio = '';
        }
      }

      const res = await callApi.createConversation({
        title,
        source: 'live',
        duration: sessionDuration || allSessionPointsRef.current.length * 3,
        audioUrl: base64Audio,
        emotionTrend: allSessionPointsRef.current,
        escalationDetected: hasEscalation,
        status: 'completed',
      });

      setSavedCall(res.conversation);
      setSaveSuccess(
        `Live call "${res.conversation.title}" and recorded audio saved to Call History.`
      );

      // Clean up session buffers so it doesn't bleed into any subsequent recording
      allSessionPointsRef.current = [];
      audioChunksRef.current = [];
      sessionStartTimeRef.current = null;
      setLivePoints([]);
      setCallTitle('');
      setCurrentEmotion(null);
      setCurrentConfidence(0);
      setFrustrationSignal(0);
      setSessionDuration(0);
    } catch (err) {
      setError((err as Error).message || 'Failed to save live session to database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Emotion Telemetry"
        subtitle="Real-time acoustic emotion analysis via low-latency WebSocket stream"
        badge="WavLM Live"
        actions={
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isStreaming
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isStreaming ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Streaming (16 kHz PCM16)
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {statusMessage}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={isStreaming ? stopStreaming : startStreaming}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer ${
                isStreaming
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isStreaming ? (
                <>
                  <MicOff className="w-4 h-4" /> Stop Live Session
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> Start Microphone Demonstration
                </>
              )}
            </button>
          </div>
        }
      />

      {error && <ErrorAlert message={error} />}

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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

      {/* Save Completed Live Recording Session Card */}
      {!isStreaming && allSessionPointsRef.current.length > 0 && !savedCall && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Recording Session Ready to Save
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Captured {allSessionPointsRef.current.length} emotion windows ({sessionDuration}s duration).
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Call title (e.g. Inbound Support #402)"
              value={callTitle}
              onChange={(e) => setCallTitle(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-full sm:w-56"
            />
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveLiveSession}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition shrink-0 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Call'}
            </button>
          </div>
        </div>
      )}

      {/* Honest Telephony Architecture Callout */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold">Telephony & Source Audio Architecture Notice</h4>
          <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
            This module streams binary 16 kHz PCM16 mono audio directly to the CallPilot ML
            inference WebSocket (<code>/ws/live</code>). Browser microphone streaming is used here
            for testing and live acoustic demonstrations. Production contact center telephony (SIP,
            WebRTC gateway, or Twilio AudioStreams) connects through this identical WebSocket
            protocol when telephony hardware is provisioned.
          </p>
        </div>
      </div>

      {/* Current Stream Signal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Emotion"
          value={currentEmotion ? currentEmotion.toUpperCase() : 'Awaiting Audio'}
          subtitle={
            currentEmotion
              ? `Confidence: ${(currentConfidence * 100).toFixed(1)}%`
              : 'Start microphone stream'
          }
          icon={Radio}
          variant={currentEmotion ? 'blue' : 'purple'}
        />

        <MetricCard
          title="Frustration Signal"
          value={
            frustrationSignal > 0 ? `${(frustrationSignal * 100).toFixed(0)}%` : '0%'
          }
          subtitle="Anger + Disgust acoustic weight"
          icon={AlertTriangle}
          variant={frustrationSignal >= 0.5 ? 'rose' : 'emerald'}
        />

        <MetricCard
          title="Stream Status"
          value={isStreaming ? 'Active' : 'Idle'}
          subtitle={
            serverReady
              ? 'Handshake complete'
              : isConnected
              ? 'Negotiating window size...'
              : 'No audio pipeline'
          }
          icon={Activity}
          variant={isStreaming ? 'emerald' : 'amber'}
        />

        <MetricCard
          title="Acoustic Protocol"
          value="16 kHz Mono"
          subtitle="Signed 16-bit LE (3s window, 1s step)"
          icon={CheckCircle2}
          variant="blue"
        />
      </div>

      {/* Live Trend Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Live Emotion Timeline (Sliding 30s Buffer)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time neural probabilities updating continuously without page refresh
            </p>
          </div>
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Inference
            </span>
          )}
        </div>

        {/* Azure Cold Start Warning Banner */}
        {isStreaming && (!serverReady || livePoints.length === 0) && (
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 animate-pulse">
            <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-spin mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-950 dark:text-amber-200">
                Connecting & Warming up Azure Neural Engine...
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Because CallPilot AI is hosted on a cost-efficient scale-to-zero cloud container, the WavLM deep learning model takes ~5–10 seconds to wake up and load into memory on the initial connection. Your microphone is already buffering—live emotion graphs will appear automatically in a moment.
              </p>
            </div>
          </div>
        )}

        {livePoints.length === 0 ? (
          isStreaming ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-amber-50/40 dark:bg-amber-950/20 rounded-lg border border-dashed border-amber-300 dark:border-amber-800">
              <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Initializing WavLM Speech Transformer...
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Connecting to Azure WebSocket (<code className="text-amber-700 dark:text-amber-300 font-mono">/ws/live</code>) and loading acoustic attention weights into memory. Please speak normally into your microphone.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              <Mic className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No active live audio stream</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                Click &quot;Start Microphone Demonstration&quot; above to capture browser audio and
                receive live WavLM emotion classifications.
              </p>
            </div>
          )
        ) : (
          <EmotionTrendChart data={livePoints} height={280} showFrustrationSignal={true} />
        )}
      </div>
    </div>
  );
};

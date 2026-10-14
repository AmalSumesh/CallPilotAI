export type UserRole = 'admin' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Agent {
  _id: string;
  name: string;
  email: string;
  role: 'agent';
  isActive: boolean;
  createdAt: string;
}

export interface CreateAgentPayload {
  name: string;
  email: string;
  password: string;
}

export interface EmotionPoint {
  time: number;
  anger: number;
  disgust: number;
  fear: number;
  happy: number;
  neutral: number;
  sad: number;
}

export type EmotionName = 'anger' | 'disgust' | 'fear' | 'happy' | 'neutral' | 'sad';

export interface EmotionProbabilities {
  anger: number;
  disgust: number;
  fear: number;
  happy: number;
  neutral: number;
  sad: number;
}

export interface AudioAnalysisWindow {
  window_start_seconds: number;
  window_end_seconds: number;
  predicted_emotion: EmotionName;
  model_confidence: number;
  emotion_probabilities: EmotionProbabilities;
  anger_probability: number;
  disgust_probability: number;
  frustration_related_signal: number;
}

export interface MLAnalysisResponse {
  audio_duration_seconds: number;
  windows_analyzed: number;
  results: AudioAnalysisWindow[];
  note?: string;
}

export interface CreateConversationPayload {
  title?: string;
  source: 'upload' | 'live';
  duration?: number;
  audioUrl?: string;
  transcript?: string;
  emotionTrend?: EmotionPoint[];
  escalationDetected?: boolean;
  status?: 'processing' | 'completed' | 'failed';
}

export interface Conversation {
  _id: string;
  agentId: string | { _id: string; name: string; email: string };
  title: string;
  source: 'upload' | 'live';
  status: 'processing' | 'completed' | 'failed';
  duration: number;
  audioUrl?: string;
  transcript?: string;
  emotionTrend: EmotionPoint[];
  escalationDetected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MLHealthResponse {
  status: string;
  model_loaded: boolean;
  sample_rate: number;
}

export interface LiveEmotionEvent extends AudioAnalysisWindow {
  type: 'emotion';
}

export interface LiveReadyEvent {
  type: 'ready';
  sample_rate: number;
  format: string;
  channels: number;
  window_seconds: number;
  step_seconds: number;
}

export interface LiveErrorEvent {
  type: 'error';
  message: string;
}

export type LiveSocketMessage = LiveReadyEvent | LiveEmotionEvent | LiveErrorEvent;

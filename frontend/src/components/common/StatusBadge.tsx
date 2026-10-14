import React from 'react';
import type { EmotionName } from '../../types';

interface StatusBadgeProps {
  status: string;
  variant?: 'callStatus' | 'agentStatus' | 'source' | 'emotion' | 'escalation';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'callStatus' }) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'callStatus') {
    if (normalized === 'completed') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (normalized === 'processing') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (normalized === 'failed') {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else if (variant === 'agentStatus') {
    if (normalized === 'active' || normalized === 'true') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else {
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    }
  } else if (variant === 'source') {
    if (normalized === 'live') {
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
    } else {
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    }
  } else if (variant === 'escalation') {
    if (normalized === 'escalated' || normalized === 'true') {
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
    } else {
      colorClasses = 'bg-slate-50 text-slate-600 border-slate-200';
    }
  } else if (variant === 'emotion') {
    switch (normalized as EmotionName) {
      case 'anger':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'disgust':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
      case 'fear':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'happy':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'sad':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'neutral':
      default:
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  }

  const label =
    variant === 'agentStatus'
      ? normalized === 'true' || normalized === 'active'
        ? 'Active'
        : 'Inactive'
      : variant === 'escalation'
      ? normalized === 'true' || normalized === 'escalated'
        ? 'Escalated'
        : 'Normal'
      : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap w-fit shrink-0 ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70 shrink-0"></span>
      {label}
    </span>
  );
};

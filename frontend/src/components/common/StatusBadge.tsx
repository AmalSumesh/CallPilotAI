import React from 'react';
import type { EmotionName } from '../../types';

interface StatusBadgeProps {
  status: string;
  variant?: 'callStatus' | 'agentStatus' | 'source' | 'emotion' | 'escalation';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'callStatus' }) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (variant === 'callStatus') {
    if (normalized === 'completed') {
      colorClasses = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    } else if (normalized === 'processing') {
      colorClasses = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    } else if (normalized === 'failed') {
      colorClasses = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
  } else if (variant === 'agentStatus') {
    if (normalized === 'active' || normalized === 'true') {
      colorClasses = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    } else {
      colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  } else if (variant === 'source') {
    if (normalized === 'live') {
      colorClasses = 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    } else {
      colorClasses = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  } else if (variant === 'escalation') {
    if (normalized === 'escalated' || normalized === 'true') {
      colorClasses = 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-semibold';
    } else {
      colorClasses = 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  } else if (variant === 'emotion') {
    switch (normalized as EmotionName) {
      case 'anger':
        colorClasses = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
        break;
      case 'disgust':
        colorClasses = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        break;
      case 'fear':
        colorClasses = 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
        break;
      case 'happy':
        colorClasses = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        break;
      case 'sad':
        colorClasses = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        break;
      case 'neutral':
      default:
        colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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

import React from 'react';
import type { EmotionName } from '../../types';

interface EmotionDistributionChartProps {
  distribution: Record<EmotionName, number>;
}

const EMOTION_META: Record<EmotionName, { label: string; color: string; bg: string }> = {
  anger: { label: 'Anger', color: '#ef4444', bg: 'bg-rose-500' },
  disgust: { label: 'Disgust', color: '#f59e0b', bg: 'bg-amber-500' },
  fear: { label: 'Fear', color: '#a855f7', bg: 'bg-purple-500' },
  happy: { label: 'Happy', color: '#10b981', bg: 'bg-emerald-500' },
  neutral: { label: 'Neutral', color: '#64748b', bg: 'bg-slate-500' },
  sad: { label: 'Sad', color: '#3b82f6', bg: 'bg-blue-500' },
};

export const EmotionDistributionChart: React.FC<EmotionDistributionChartProps> = ({
  distribution,
}) => {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

  const sortedEmotions = (Object.keys(EMOTION_META) as EmotionName[]).map((key) => {
    const count = distribution[key] || 0;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      key,
      ...EMOTION_META[key],
      count,
      percentage,
    };
  });

  return (
    <div className="space-y-4">
      {/* Horizontal Multi-color Stacked Bar */}
      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex relative shadow-inner">
        {total === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            No speech data recorded yet
          </div>
        ) : (
          sortedEmotions.map((item) => {
            if (item.percentage === 0) return null;
            return (
              <div
                key={item.key}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.label}: ${item.percentage}% (${item.count} windows)`}
                className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              />
            );
          })
        )}
      </div>

      {/* Grid of Emotion Breakdown Cards - 2 Columns ensures labels and percentages never collide */}
      <div className="grid grid-cols-2 gap-2.5">
        {sortedEmotions.map((item) => (
          <div
            key={item.key}
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition duration-150"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="flex items-center gap-1.5 min-w-0 font-medium text-xs text-slate-700 dark:text-slate-200">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white shrink-0">
                {item.percentage}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

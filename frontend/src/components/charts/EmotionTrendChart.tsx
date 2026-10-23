import React, { useState, useMemo } from 'react';
import type { EmotionPoint, EmotionName } from '../../types';

interface EmotionTrendChartProps {
  data: EmotionPoint[];
  height?: number;
  showFrustrationSignal?: boolean;
}

const EMOTION_COLORS: Record<EmotionName, string> = {
  anger: '#ef4444',
  disgust: '#f59e0b',
  fear: '#a855f7',
  happy: '#10b981',
  neutral: '#64748b',
  sad: '#3b82f6',
};

export const EmotionTrendChart: React.FC<EmotionTrendChartProps> = ({
  data,
  height = 260,
  showFrustrationSignal = true,
}) => {
  const [activeEmotions, setActiveEmotions] = useState<Record<EmotionName, boolean>>({
    anger: true,
    disgust: true,
    fear: true,
    happy: true,
    neutral: true,
    sad: true,
  });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const toggleEmotion = (emotion: EmotionName) => {
    setActiveEmotions((prev) => ({
      ...prev,
      [emotion]: !prev[emotion],
    }));
  };

  const chartPoints = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  if (chartPoints.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-400 dark:text-slate-500">
        No emotion trend data available
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 800; // SVG internal coordinate space (viewBox scaled)
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(...chartPoints.map((p) => p.time), 1);
  const minTime = Math.min(...chartPoints.map((p) => p.time), 0);
  const timeSpan = Math.max(maxTime - minTime, 1);

  // Function to calculate SVG coordinates
  const getX = (time: number) => {
    return padding.left + ((time - minTime) / timeSpan) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - Math.max(0, Math.min(1, val)) * chartHeight;
  };

  // Build SVG path strings for each emotion
  const emotionPaths = (Object.keys(EMOTION_COLORS) as EmotionName[]).map((emotion) => {
    if (!activeEmotions[emotion]) return null;

    const points = chartPoints.map((p) => {
      const x = getX(p.time);
      const y = getY(p[emotion]);
      return `${x},${y}`;
    });

    const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

    return {
      emotion,
      color: EMOTION_COLORS[emotion],
      pathD,
    };
  });

  // Calculate frustration signal path if requested
  const frustrationPoints = chartPoints.map((p) => {
    const x = getX(p.time);
    const signal = Math.min(1, (p.anger || 0) + (p.disgust || 0));
    const y = getY(signal);
    return `${x},${y}`;
  });
  const frustrationPathD = frustrationPoints.length > 0 ? `M ${frustrationPoints.join(' L ')}` : '';

  const hoveredPoint = hoveredIndex !== null && chartPoints[hoveredIndex] ? chartPoints[hoveredIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Legend & Emotion Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(EMOTION_COLORS) as EmotionName[]).map((emotion) => {
            const isActive = activeEmotions[emotion];
            return (
              <button
                key={emotion}
                type="button"
                onClick={() => toggleEmotion(emotion)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs'
                    : 'bg-transparent text-slate-400 dark:text-slate-500 opacity-50 hover:opacity-80'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                />
                <span className="capitalize">{emotion}</span>
              </button>
            );
          })}
        </div>

        {showFrustrationSignal && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
            <span className="w-2.5 h-1 border-t-2 border-dashed border-rose-500 dark:border-rose-400 inline-block" />
            <span>Frustration Signal (Anger+Disgust)</span>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden rounded-lg bg-white dark:bg-slate-900/50">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = getY(ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {Math.round(ratio * 100)}%
                </text>
              </g>
            );
          })}

          {/* Time axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
          />

          {/* Time ticks */}
          {chartPoints.map((p, idx) => {
            if (chartPoints.length > 15 && idx % Math.ceil(chartPoints.length / 8) !== 0) {
              return null;
            }
            const x = getX(p.time);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={padding.top + chartHeight}
                  x2={x}
                  y2={padding.top + chartHeight + 4}
                  className="stroke-slate-400 dark:stroke-slate-600"
                />
                <text
                  x={x}
                  y={padding.top + chartHeight + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 dark:fill-slate-400 font-mono"
                >
                  {Math.round(p.time)}s
                </text>
              </g>
            );
          })}

          {/* Emotion lines */}
          {emotionPaths.map((item) => {
            if (!item || !item.pathD) return null;
            return (
              <path
                key={item.emotion}
                d={item.pathD}
                fill="none"
                stroke={item.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Frustration signal line */}
          {showFrustrationSignal && frustrationPathD && (
            <path
              d={frustrationPathD}
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* Hover Crosshair */}
          {hoveredPoint && (
            <line
              x1={getX(hoveredPoint.time)}
              y1={padding.top}
              x2={getX(hoveredPoint.time)}
              y2={padding.top + chartHeight}
              className="stroke-slate-600 dark:stroke-slate-400"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}

          {/* Transparent hit boxes for each point to catch hover easily */}
          {chartPoints.map((p, idx) => {
            const x = getX(p.time);
            const boxWidth = chartWidth / chartPoints.length;
            return (
              <rect
                key={idx}
                x={x - boxWidth / 2}
                y={padding.top}
                width={boxWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="mt-2 p-3 bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-lg text-xs flex flex-wrap items-center justify-between gap-4 border border-transparent dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300 dark:text-slate-400">Timestamp:</span>
              <span className="font-mono bg-slate-800 dark:bg-slate-900 px-2 py-0.5 rounded text-blue-300 dark:text-blue-400">
                {hoveredPoint.time.toFixed(1)}s
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono">
              {(Object.keys(EMOTION_COLORS) as EmotionName[]).map((em) => (
                <div key={em} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: EMOTION_COLORS[em] }}
                  />
                  <span className="capitalize text-slate-400 dark:text-slate-400">{em}:</span>
                  <span className="font-bold text-white">
                    {Math.round((hoveredPoint[em] || 0) * 100)}%
                  </span>
                </div>
              ))}
              {showFrustrationSignal && (
                <div className="flex items-center gap-1 pl-2 border-l border-slate-700 text-rose-300 dark:text-rose-400 font-bold">
                  <span>Frustration:</span>
                  <span>
                    {Math.round(
                      Math.min(1, (hoveredPoint.anger || 0) + (hoveredPoint.disgust || 0)) * 100
                    )}
                    %
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

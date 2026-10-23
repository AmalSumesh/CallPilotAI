import React, { useState } from 'react';

interface VolumeDataPoint {
  date: string;
  count: number;
}

interface CallVolumeChartProps {
  data: VolumeDataPoint[];
  height?: number;
}

export const CallVolumeChart: React.FC<CallVolumeChartProps> = ({
  data,
  height = 180,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-400 dark:text-slate-500">
        No call volume history available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 5);
  const padding = { top: 15, right: 15, bottom: 25, left: 30 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const barWidth = Math.min(36, Math.max(12, (chartWidth / data.length) * 0.65));
  const stepX = chartWidth / data.length;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          const labelVal = Math.round(ratio * maxCount);
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
                x={padding.left - 6}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
              >
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const x = padding.left + idx * stepX + (stepX - barWidth) / 2;
          const barHeight = Math.max(3, (item.count / maxCount) * chartHeight);
          const y = padding.top + chartHeight - barHeight;
          const isHovered = hoveredIndex === idx;

          return (
            <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} className="cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                className={`transition-all duration-200 ${
                  isHovered ? 'fill-blue-700 dark:fill-blue-500' : 'fill-blue-500 hover:fill-blue-600 dark:fill-blue-600 dark:hover:fill-blue-500'
                }`}
              />
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 16}
                textAnchor="middle"
                className="text-[9px] fill-slate-500 dark:fill-slate-400 font-sans"
              >
                {item.date}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div className="absolute top-2 right-4 bg-slate-900 dark:bg-slate-800 text-white text-xs px-2.5 py-1 rounded shadow-md font-mono border border-transparent dark:border-slate-700">
          <span className="text-slate-300 dark:text-slate-400 mr-2">{data[hoveredIndex].date}:</span>
          <span className="font-bold text-blue-300 dark:text-blue-400">{data[hoveredIndex].count} calls</span>
        </div>
      )}
    </div>
  );
};

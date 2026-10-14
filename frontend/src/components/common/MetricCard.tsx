import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  variant = 'blue',
}) => {
  const iconColorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center text-xs">
              <span
                className={`font-medium ${
                  trend.direction === 'up'
                    ? 'text-emerald-600'
                    : trend.direction === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'} {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${iconColorMap[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

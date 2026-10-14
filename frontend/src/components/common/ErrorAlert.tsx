import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`rounded-xl border border-rose-200 bg-rose-50/80 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          <p className="mt-1 text-xs text-rose-700 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 underline underline-offset-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

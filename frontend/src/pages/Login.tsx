import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Headphones, Eye, EyeOff, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await login(email.trim(), password);

      // Redirect to previous route or appropriate role dashboard
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        const dest = user.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard';
        navigate(dest, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('admin@example.com');
    setPassword('admin1234567');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-4">
          <Headphones className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          CallPilot <span className="text-blue-600">AI</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Real-time Speech Emotion Recognition & Contact Center Analytics
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Aid */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Default Admin Credentials
                </span>
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
                >
                  Fill Admin
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-mono">
                admin@example.com / admin1234567
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            <span>Enterprise Role-Based Access Control • Agent accounts are managed by Admins</span>
          </div>
        </div>
      </div>
    </div>
  );
};

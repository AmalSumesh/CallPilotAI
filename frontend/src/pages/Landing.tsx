import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Radio, Activity, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Landing: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const dashboardRoute = user?.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Background Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-300/30 via-blue-200/20 to-transparent dark:from-blue-600/25 dark:via-blue-500/15 dark:to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-200/30 dark:bg-indigo-600/10 blur-[100px] pointer-events-none -z-10" />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Header / Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            CallPilot <span className="text-blue-600 dark:text-blue-500 font-extrabold">AI</span>
          </span>
        </Link>

        {/* Action Button: Login & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <Link
              to={dashboardRoute}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition duration-200"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition duration-200 cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 sm:py-24 max-w-5xl mx-auto relative z-10">
        {/* Big Bold Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
          Hear The <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent">Emotion</span>
          <br />
          Prevent <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Escalation</span>
        </h1>

        {/* Tagline / Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-10">
          AI-powered speech emotion recognition that understands customer sentiment in real-time. Detect frustration early, protect call resolution rates, and empower contact center agents live.
        </p>

        {/* Hero Call To Action */}
        <div className="flex justify-center w-full sm:w-auto mb-16">
          <button
            type="button"
            onClick={handleLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Get Started
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left">
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/50 dark:hover:border-slate-700 shadow-md shadow-slate-200/40 dark:shadow-xs transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 border border-blue-200/60 dark:border-blue-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Live WebSocket Telemetry</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bi-directional 16 kHz PCM streaming with sliding-window classification updating in sub-250ms.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-400/50 dark:hover:border-slate-700 shadow-md shadow-slate-200/40 dark:shadow-xs transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 border border-cyan-200/60 dark:border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Frustration Detection</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Combined acoustic anger and disgust heuristics flag at-risk calls before escalation occurs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-400/50 dark:hover:border-slate-700 shadow-md shadow-slate-200/40 dark:shadow-xs transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 border border-purple-200/60 dark:border-purple-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">WavLM Self-Supervised AI</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Deep transformer backbone with attention pooling for 6-class speech emotion recognition.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/60 py-6 text-center text-xs text-slate-500 dark:text-slate-400 relative z-20">
        <p>© 2026 CallPilot AI | Real-Time Voice Emotion Telemetry & Contact Center Intelligence</p>
      </footer>
    </div>
  );
};

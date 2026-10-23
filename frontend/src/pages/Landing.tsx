import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Shield, Radio, Activity, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Landing: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate('/login?role=admin', { state: { adminPrefill: true } });
  };

  const handleRegularLogin = () => {
    navigate('/login');
  };

  const dashboardRoute = user?.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard';

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/20 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] pointer-events-none -z-10" />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Header / Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
            <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            CallPilot <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-extrabold">AI</span>
          </span>
        </Link>

        {/* Action Buttons: Login & Login as Admin */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <Link
              to={dashboardRoute}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition duration-200"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              {/* Regular Login */}
              <button
                type="button"
                onClick={handleRegularLogin}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md transition duration-200 cursor-pointer"
              >
                Login
              </button>

              {/* Login as Admin */}
              <button
                type="button"
                onClick={handleAdminLogin}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 transition duration-200 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-slate-950" />
                Login as Admin
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 sm:py-20 max-w-5xl mx-auto relative z-10">
        {/* Top Innovation Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 shadow-inner mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>WavLM Neural Transformer • Real-Time Voice Telemetry</span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
          Hear The <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Emotion</span>
          <br />
          Prevent <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Escalation</span>
        </h1>

        {/* Tagline / Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
          AI-powered speech emotion recognition that understands customer sentiment in real-time. Detect frustration early, protect call resolution rates, and empower contact center agents live.
        </p>

        {/* Main Hero Call To Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <button
            type="button"
            onClick={handleAdminLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-slate-950" />
            Login as Admin
          </button>

          <button
            type="button"
            onClick={handleRegularLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-800 transition duration-200 cursor-pointer"
          >
            Login
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition backdrop-blur-sm shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3 border border-blue-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Live WebSocket Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bi-directional 16 kHz PCM streaming with sliding-window classification updating in sub-250ms.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition backdrop-blur-sm shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mb-3 border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Frustration Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combined acoustic anger and disgust heuristics flag at-risk calls before escalation occurs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition backdrop-blur-sm shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">WavLM Self-Supervised AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deep transformer backbone with attention pooling for 6-class speech emotion recognition.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 relative z-20">
        <p>© 2026 CallPilot AI | Real-Time Voice Emotion Telemetry & Contact Center Intelligence</p>
      </footer>
    </div>
  );
};

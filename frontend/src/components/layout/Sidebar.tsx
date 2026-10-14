import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  Activity,
  BarChart3,
  Mic,
  Headphones,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminNavItems = [
    { label: 'Command Center', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Analytics & Insights', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Agent Management', path: '/admin/agents', icon: Users },
    { label: 'Call Records', path: '/admin/calls', icon: PhoneCall },
  ];

  const agentNavItems = [
    { label: 'My Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
    { label: 'Audio Analysis', path: '/agent/analyze', icon: Headphones },
    { label: 'Live Stream Inference', path: '/agent/live', icon: Mic },
    { label: 'My Call Records', path: '/agent/calls', icon: PhoneCall },
    { label: 'My Profile', path: '/agent/profile', icon: UserCheck },
  ];

  const navItems = isAdmin ? adminNavItems : agentNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block">
                CallPilot <span className="text-blue-600 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
                Emotion Intelligence
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Pill Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Workspace</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
              isAdmin
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isAdmin ? 'Administrator' : 'Agent Portal'}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card at Bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

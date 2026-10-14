import React, { useState } from 'react';
import { Menu, LogOut, Headphones } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface TopNavProps {
  onToggleSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isAgent = user?.role === 'agent';

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">CallPilot AI Engine</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Quick Analyze Button (Agents only) */}
          {isAgent && (
            <Link
              to="/agent/analyze"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-2xs"
            >
              <Headphones className="w-3.5 h-3.5" />
              Analyze Audio
            </Link>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition"
            title="Sign out of CallPilot AI"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to end your CallPilot AI session?"
        confirmLabel="Sign Out"
        cancelLabel="Stay Logged In"
        variant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
};

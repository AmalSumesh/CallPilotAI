import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, LogOut, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Active session';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Account Profile"
        subtitle="Manage your credentials and security session status"
      />

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 flex items-end">
          <div className="translate-y-1/2 flex items-end gap-4">
            <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-md">
              <div className="w-full h-full rounded-xl bg-blue-100 text-blue-700 font-extrabold text-2xl flex items-center justify-center border border-blue-200">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Address
              </div>
              <p className="text-sm font-bold text-slate-900 font-mono">{user?.email}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <Shield className="w-4 h-4 text-slate-400" />
                Role & Authorization
              </div>
              <p className="text-sm font-bold text-slate-900 capitalize">
                {user?.role === 'admin' ? 'System Administrator' : 'Contact Center Agent'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                Member Since
              </div>
              <p className="text-sm font-bold text-slate-900">{formatDate(user?.createdAt)}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <User className="w-4 h-4 text-slate-400" />
                User ID
              </div>
              <p className="text-xs font-bold text-slate-700 font-mono truncate">{user?.id}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Session
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
};

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

import { Login } from '../pages/Login';
import { Landing } from '../pages/Landing';
import { AdminDashboard } from '../pages/AdminDashboard';
import { AgentManagement } from '../pages/AgentManagement';
import { CallHistory } from '../pages/CallHistory';
import { CallDetails } from '../pages/CallDetails';
import { AudioAnalysis } from '../pages/AudioAnalysis';
import { LiveMonitoring } from '../pages/LiveMonitoring';
import { Analytics } from '../pages/Analytics';
import { AgentDashboard } from '../pages/AgentDashboard';
import { Profile } from '../pages/Profile';

export const AppRoutes: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="agents" element={<AgentManagement />} />
        <Route path="calls" element={<CallHistory />} />
        <Route path="calls/:id" element={<CallDetails />} />
      </Route>

      {/* Agent Protected Routes */}
      <Route
        path="/agent"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/agent/dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboard />} />
        <Route path="analyze" element={<AudioAnalysis />} />
        <Route path="live" element={<LiveMonitoring />} />
        <Route path="calls" element={<CallHistory />} />
        <Route path="calls/:id" element={<CallDetails />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Landing Page as Root */}
      <Route path="/" element={<Landing />} />

      {/* Default Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

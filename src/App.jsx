import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Social from '@/pages/Social';
import Gaming from '@/pages/Gaming';
import Settings from '@/pages/Settings';
import Nova from '@/pages/Nova';
import Profile from '@/pages/Profile';
import PublicProfile from '@/pages/PublicProfile';
import DirectMessages from '@/pages/DirectMessages';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AuthCallback from '@/pages/AuthCallback';
import FriendsPage from '@/pages/Friends';
import { Toaster } from '@/components/ui/toaster';
import CallOverlay from '@/components/CallOverlay';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
            <Route path="/gaming" element={<ProtectedRoute><Gaming /></ProtectedRoute>} />
            <Route path="/nova" element={<ProtectedRoute><Nova /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
            <Route path="/dm" element={<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <CallOverlay />
        </Router>
        <Toaster />
      </SocketProvider>
    </AuthProvider>
  );
}
export default App;

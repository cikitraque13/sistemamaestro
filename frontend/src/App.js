import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ReportPreview from './pages/ReportPreview';
import Opportunities from './pages/Opportunities';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Flow from './pages/Flow';
import AuthCallback from './pages/AuthCallback';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Terms from './pages/Terms';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || user === false) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// App Router with OAuth handling
const AppRouter = () => {
  const location = useLocation();

  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/terms" element={<Terms />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/dashboard/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/dashboard/project/:id/report-preview" element={<ProtectedRoute><ReportPreview /></ProtectedRoute>} />
      <Route path="/dashboard/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
      <Route path="/dashboard/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Flow Routes */}
      <Route path="/flow" element={<ProtectedRoute><Flow /></ProtectedRoute>} />
      <Route path="/flow/:step" element={<ProtectedRoute><Flow /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#171717',
              color: '#F3F4F6',
              border: '1px solid #262626'
            }
          }}
        />
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

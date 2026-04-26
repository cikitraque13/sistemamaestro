import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

// Feature entrypoints
import Home from './features/home/HomePage';
import Login from './features/auth/LoginPage';
import Register from './features/auth/RegisterPage';
import AuthCallback from './features/auth/AuthCallbackPage';
import Dashboard from './features/dashboard/DashboardPage';
import BuilderWorkspacePage from './features/builder/workspace/BuilderWorkspacePage';
import Projects from './features/projects/ProjectsPage';
import ProjectDetail from './features/projects/detail/ProjectDetailPage';
import ReportPreview from './features/reports/ReportPreviewPage';
import ReportPrintPage from './features/reports/ReportPrintPage';
import Opportunities from './features/opportunities/OpportunitiesPage';
import Billing from './features/billing/BillingPage';
import Settings from './features/settings/SettingsPage';
import Flow from './features/flow/FlowPage';

// Public/legal pages kept in pages for now
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Terms from './pages/Terms';

import './App.css';

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

const AppRouter = () => {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/terms" element={<Terms />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/builder" element={<ProtectedRoute><BuilderWorkspacePage /></ProtectedRoute>} />
      <Route path="/dashboard/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/dashboard/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/dashboard/project/:id/report-preview" element={<ProtectedRoute><ReportPreview /></ProtectedRoute>} />
      <Route path="/dashboard/project/:id/report-print" element={<ProtectedRoute><ReportPrintPage /></ProtectedRoute>} />
      <Route path="/dashboard/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
      <Route path="/dashboard/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="/flow" element={<ProtectedRoute><Flow /></ProtectedRoute>} />
      <Route path="/flow/:step" element={<ProtectedRoute><Flow /></ProtectedRoute>} />

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
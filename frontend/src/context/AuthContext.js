import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to format API error details
const ERROR_TRANSLATIONS = {
  'Invalid credentials': 'Credenciales incorrectas',
  'Email already registered': 'Este email ya está registrado',
  'Too many failed attempts. Try again later.': 'Demasiados intentos fallidos. Inténtalo más tarde.',
  'Not authenticated': 'No autenticado',
  'Token expired': 'La sesión ha expirado',
  'User not found': 'Usuario no encontrado',
  'Invalid token': 'Token inválido',
  'Project not found': 'Proyecto no encontrado',
  'Opportunity not found': 'Oportunidad no encontrada',
  'Upgrade to Blueprint plan to unlock this feature': 'Mejora al plan Blueprint para desbloquear esta función',
  'Upgrade to access more opportunities': 'Mejora tu plan para acceder a más oportunidades',
  'Payment system not configured. Set STRIPE_SECRET_KEY in environment.': 'Sistema de pagos no configurado',
  'Payment system not configured': 'Sistema de pagos no configurado',
  'Invalid plan': 'Plan no válido',
  'Transaction not found': 'Transacción no encontrada'
};

const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Algo salió mal. Intenta de nuevo.";
  if (typeof detail === "string") return ERROR_TRANSLATIONS[detail] || detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not auth, object = auth
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { email, password, name },
        { withCredentials: true }
      );
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      setUser(false);
    } finally {
      setUser(false);
    }
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleGoogleCallback = async (sessionId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/google/session`,
        { session_id: sessionId },
        { withCredentials: true }
      );
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message 
      };
    }
  };

  const refreshToken = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
      await checkAuth();
    } catch (error) {
      setUser(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      loginWithGoogle,
      handleGoogleCallback,
      refreshToken,
      checkAuth,
      isAuthenticated: !!user && user !== false
    }}>
      {children}
    </AuthContext.Provider>
  );
};

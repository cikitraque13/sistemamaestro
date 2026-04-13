import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = '/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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
  if (detail == null) return 'Algo salió mal. Intenta de nuevo.';
  if (typeof detail === 'string') return ERROR_TRANSLATIONS[detail] || detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(' ');
  }
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not auth, object = auth
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
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
      const response = await api.post('/auth/register', { email, password, name });
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
      await api.post('/auth/logout', {});
    } catch (error) {
      setUser(false);
    } finally {
      setUser(false);
    }
  };

  const loginWithGoogleCredential = async (credential) => {
    try {
      const response = await api.post('/auth/google/session', { credential });
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      return {
        success: false,
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message
      };
    }
  };

  // Legacy fallback: se conserva por compatibilidad, pero el flujo nuevo ya no lo usa
  const handleGoogleCallback = async (sessionId) => {
    try {
      const response = await api.post('/auth/google/session', { session_id: sessionId });
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
      await api.post('/auth/refresh', {});
      await checkAuth();
    } catch (error) {
      setUser(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogleCredential,
        handleGoogleCallback,
        refreshToken,
        checkAuth,
        isAuthenticated: !!user && user !== false
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

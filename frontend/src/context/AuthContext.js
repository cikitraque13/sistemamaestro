import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://sistemamaestro.com'))
  .trim()
  .replace(/\/$/, '');

const API_BASE = `${BACKEND_URL}/api`;

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
  'Transaction not found': 'Transacción no encontrada',
};

const SESSION_NOT_PERSISTED_ERROR =
  'La sesión no ha quedado guardada correctamente. Vuelve a iniciar sesión y comprueba que frontend y backend usan el mismo host.';

const formatApiErrorDetail = (detail) => {
  if (detail == null) return 'Algo salió mal. Intenta de nuevo.';

  if (typeof detail === 'string') {
    return ERROR_TRANSLATIONS[detail] || detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((entry) => (entry && typeof entry.msg === 'string' ? entry.msg : JSON.stringify(entry)))
      .filter(Boolean)
      .join(' ');
  }

  if (detail && typeof detail.msg === 'string') {
    return detail.msg;
  }

  return String(detail);
};

const getRequestError = (error) =>
  formatApiErrorDetail(error?.response?.data?.detail) || error?.message || 'Algo salió mal.';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not auth, object = auth
  const [loading, setLoading] = useState(true);

  const confirmBackendSession = useCallback(async () => {
    const response = await api.get('/auth/me');
    setUser(response.data);
    return response.data;
  }, []);

  const checkAuth = useCallback(async () => {
    setLoading(true);

    try {
      await confirmBackendSession();
    } catch (error) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, [confirmBackendSession]);

  useEffect(() => {
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      await api.post('/auth/login', { email, password });

      try {
        const confirmedUser = await confirmBackendSession();
        return { success: true, user: confirmedUser };
      } catch (sessionError) {
        setUser(false);
        return {
          success: false,
          error: SESSION_NOT_PERSISTED_ERROR,
        };
      }
    } catch (error) {
      setUser(false);

      return {
        success: false,
        error: getRequestError(error),
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      await api.post('/auth/register', { email, password, name });

      try {
        const confirmedUser = await confirmBackendSession();
        return { success: true, user: confirmedUser };
      } catch (sessionError) {
        setUser(false);
        return {
          success: false,
          error: SESSION_NOT_PERSISTED_ERROR,
        };
      }
    } catch (error) {
      setUser(false);

      return {
        success: false,
        error: getRequestError(error),
      };
    }
  };

  const loginWithGoogleCredential = async (credential) => {
    try {
      await api.post('/auth/google/session', { credential });

      try {
        const confirmedUser = await confirmBackendSession();
        return { success: true, user: confirmedUser };
      } catch (sessionError) {
        setUser(false);
        return {
          success: false,
          error: SESSION_NOT_PERSISTED_ERROR,
        };
      }
    } catch (error) {
      setUser(false);

      return {
        success: false,
        error: getRequestError(error),
      };
    }
  };

  const handleGoogleCallback = async (sessionId) => {
    try {
      await api.post('/auth/google/session', { session_id: sessionId });

      try {
        const confirmedUser = await confirmBackendSession();
        return { success: true, user: confirmedUser };
      } catch (sessionError) {
        setUser(false);
        return {
          success: false,
          error: SESSION_NOT_PERSISTED_ERROR,
        };
      }
    } catch (error) {
      setUser(false);

      return {
        success: false,
        error: getRequestError(error),
      };
    }
  };

  const refreshToken = async () => {
    try {
      await api.post('/auth/refresh', {});
      const confirmedUser = await confirmBackendSession();

      return { success: true, user: confirmedUser };
    } catch (error) {
      setUser(false);

      return {
        success: false,
        error: getRequestError(error),
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      // Aunque falle la llamada, cerramos estado local.
    } finally {
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
        isAuthenticated: !!user && user !== false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

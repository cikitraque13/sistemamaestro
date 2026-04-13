import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);

      let redirectConfig = {
        redirectPath: '/dashboard',
        redirectState: null
      };

      try {
        const saved = sessionStorage.getItem('google_auth_redirect');
        if (saved) {
          redirectConfig = {
            ...redirectConfig,
            ...JSON.parse(saved)
          };
        }
      } catch (error) {
        console.error('Error reading google auth redirect config', error);
      }

      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        const result = await handleGoogleCallback(sessionId);

        sessionStorage.removeItem('google_auth_redirect');
        window.history.replaceState(null, '', window.location.pathname);

        if (result.success) {
          navigate(redirectConfig.redirectPath || '/dashboard', {
            replace: true,
            state: redirectConfig.redirectState || { user: result.user }
          });
        } else {
          navigate('/login', {
            replace: true,
            state: { error: result.error }
          });
        }
      } else {
        sessionStorage.removeItem('google_auth_redirect');
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-[#A3A3A3]">Procesando autenticación...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

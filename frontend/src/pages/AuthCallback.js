import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        const result = await handleGoogleCallback(sessionId);
        
        if (result.success) {
          // Clear the hash and navigate to dashboard
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/dashboard', { replace: true, state: { user: result.user } });
        } else {
          navigate('/login', { replace: true, state: { error: result.error } });
        }
      } else {
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

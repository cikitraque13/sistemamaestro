import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('No se pudo cargar Google Sign-In')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Sign-In'));
    document.head.appendChild(script);
  });

const getGoogleClientId = async () => {
  try {
    const response = await fetch('/api/public/config', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.google_client_id) {
        return data.google_client_id;
      }
    }
  } catch (error) {
    console.error('Error loading public config:', error);
  }

  return process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
};

const GoogleSignInButton = ({ redirectPath = '/dashboard', redirectState = null }) => {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogleCredential } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | ready | missing_client | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const initGoogle = async () => {
      try {
        const clientId = await getGoogleClientId();

        if (!clientId) {
          if (active) {
            setStatus('missing_client');
            setErrorMessage('Google Sign-In no está disponible temporalmente en producción.');
          }
          return;
        }

        await loadGoogleScript();

        if (!active || !window.google?.accounts?.id || !buttonRef.current) return;

        buttonRef.current.innerHTML = '';

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            const result = await loginWithGoogleCredential(response.credential);

            if (result.success) {
              toast.success('Sesión iniciada correctamente');
              navigate(redirectPath, {
                replace: true,
                state: redirectState
              });
            } else {
              toast.error(result.error || 'Error al iniciar sesión con Google');
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 360
        });

        if (active) {
          setStatus('ready');
        }
      } catch (error) {
        console.error('Google Sign-In init error:', error);
        if (active) {
          setStatus('error');
          setErrorMessage('No se pudo inicializar Google Sign-In.');
        }
      }
    };

    initGoogle();

    return () => {
      active = false;
    };
  }, [loginWithGoogleCredential, navigate, redirectPath, redirectState]);

  if (status === 'missing_client' || status === 'error') {
    return (
      <div className="w-full mb-6">
        <div className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
          {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-6 flex justify-center">
      <div className="min-h-[44px] flex items-center justify-center" ref={buttonRef}>
        {status === 'loading' && (
          <div className="text-sm text-[#A3A3A3]">Cargando acceso con Google...</div>
        )}
      </div>
    </div>
  );
};

export default GoogleSignInButton;

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

      const handleLoad = () => resolve();
      const handleError = () => reject(new Error('No se pudo cargar Google Sign-In'));

      existing.addEventListener('load', handleLoad, { once: true });
      existing.addEventListener('error', handleError, { once: true });
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

const fetchGoogleClientId = async () => {
  try {
    const response = await fetch('/api/public/config', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Public config error: ${response.status}`);
    }

    const data = await response.json();
    return data?.google_client_id || '';
  } catch (error) {
    console.error('Error obteniendo google_client_id:', error);
    return '';
  }
};

const GoogleSignInButton = ({ redirectPath = '/dashboard', redirectState = null }) => {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogleCredential } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | ready | missing_client | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const initGoogleButton = async () => {
      try {
        setStatus('loading');
        setErrorMessage('');

        const clientId = await fetchGoogleClientId();

        if (!clientId) {
          if (active) {
            setStatus('missing_client');
            setErrorMessage('Google Sign-In no está disponible temporalmente.');
          }
          return;
        }

        await loadGoogleScript();

        if (!active) return;

        const googleId = window.google?.accounts?.id;
        if (
          !googleId ||
          typeof googleId.initialize !== 'function' ||
          typeof googleId.renderButton !== 'function'
        ) {
          throw new Error('Google Identity Services no está disponible');
        }

        if (!buttonRef.current) {
          throw new Error('No existe el contenedor del botón de Google');
        }

        buttonRef.current.innerHTML = '';

        googleId.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (response) => {
            try {
              if (!response?.credential) {
                throw new Error('Google no devolvió credencial');
              }

              const result = await loginWithGoogleCredential(response.credential);

              if (result.success) {
                toast.success('Sesión iniciada correctamente');
                navigate(redirectPath, {
                  replace: true,
                  state: redirectState
                });
                return;
              }

              toast.error(result.error || 'Error al iniciar sesión con Google');
            } catch (callbackError) {
              console.error('Google callback error:', callbackError);
              toast.error('Error al completar el acceso con Google');
            }
          }
        });

        googleId.renderButton(buttonRef.current, {
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

    initGoogleButton();

    return () => {
      active = false;
      try {
        window.google?.accounts?.id?.cancel?.();
      } catch (error) {
        console.error('Google cancel cleanup error:', error);
      }
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
      <div
        ref={buttonRef}
        className="min-h-[44px] flex items-center justify-center"
      >
        {status === 'loading' && (
          <div className="text-sm text-[#A3A3A3]">Cargando acceso con Google...</div>
        )}
      </div>
    </div>
  );
};

export default GoogleSignInButton;

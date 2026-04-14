import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let googleScriptPromise = null;

const loadGoogleScriptOnce = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    if (existing) {
      const onLoad = () => resolve();
      const onError = () => reject(new Error('No se pudo cargar Google Sign-In'));

      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });

      if (window.google?.accounts?.id) {
        resolve();
      }

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

  return googleScriptPromise;
};

const getGoogleClientId = async () => {
  try {
    const response = await fetch('/api/public/config', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.google_client_id) {
        return data.google_client_id;
      }
    }
  } catch (error) {
    console.error('Error loading Google public config:', error);
  }

  return process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
};

const GoogleSignInButton = ({ redirectPath = '/dashboard', redirectState = null }) => {
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);

  const navigate = useNavigate();
  const { loginWithGoogleCredential } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | ready | missing_client | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        setStatus('loading');
        setErrorMessage('');

        const clientId = await getGoogleClientId();

        if (!clientId) {
          if (mountedRef.current) {
            setStatus('missing_client');
            setErrorMessage('Google Sign-In no está disponible temporalmente.');
          }
          return;
        }

        await loadGoogleScriptOnce();

        if (!mountedRef.current) return;

        const googleId = window.google?.accounts?.id;
        if (!googleId) {
          throw new Error('Google Identity Services no está disponible');
        }

        if (!buttonRef.current) {
          throw new Error('No existe el contenedor del botón de Google');
        }

        if (!initializedRef.current) {
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

          initializedRef.current = true;
        }

        buttonRef.current.innerHTML = '';

        googleId.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 340
        });

        window.setTimeout(() => {
          if (!mountedRef.current) return;

          if (!buttonRef.current || buttonRef.current.childElementCount === 0) {
            setStatus('error');
            setErrorMessage('No se pudo renderizar el acceso con Google.');
            return;
          }

          setStatus('ready');
        }, 300);
      } catch (error) {
        console.error('Google Sign-In init error:', error);
        if (mountedRef.current) {
          setStatus('error');
          setErrorMessage('No se pudo inicializar Google Sign-In.');
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;
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

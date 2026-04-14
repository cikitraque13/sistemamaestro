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

  return googleScriptPromise;
};

const getGoogleClientId = async () => {
  try {
    const response = await fetch('/api/public/config', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Public config error: ${response.status}`);
    }

    const data = await response.json();
    return data?.google_client_id || '';
  } catch (error) {
    console.error('Error cargando /api/public/config:', error);
    return '';
  }
};

const GoogleSignInButton = ({ redirectPath = '/dashboard', redirectState = null }) => {
  const containerRef = useRef(null);
  const initializedRef = useRef(false);
  const mountedRef = useRef(false);
  const authRef = useRef({
    loginWithGoogleCredential: null,
    redirectPath: '/dashboard',
    redirectState: null
  });

  const navigate = useNavigate();
  const { loginWithGoogleCredential } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | ready | missing_client | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    authRef.current = {
      loginWithGoogleCredential,
      redirectPath,
      redirectState
    };
  }, [loginWithGoogleCredential, redirectPath, redirectState]);

  useEffect(() => {
    mountedRef.current = true;

    const initGoogle = async () => {
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

        if (!containerRef.current) {
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

                const {
                  loginWithGoogleCredential: loginFn,
                  redirectPath: nextPath,
                  redirectState: nextState
                } = authRef.current;

                const result = await loginFn(response.credential);

                if (result.success) {
                  toast.success('Sesión iniciada correctamente');
                  navigate(nextPath, {
                    replace: true,
                    state: nextState
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

        // Este nodo debe permanecer vacío para React.
        containerRef.current.innerHTML = '';

        googleId.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 340
        });

        if (mountedRef.current) {
          setStatus('ready');
        }
      } catch (error) {
        console.error('Google Sign-In init error:', error);
        if (mountedRef.current) {
          setStatus('error');
          setErrorMessage('No se pudo inicializar Google Sign-In.');
        }
      }
    };

    initGoogle();

    return () => {
      mountedRef.current = false;
    };
  }, [navigate]);

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
    <div className="w-full mb-6">
      {status === 'loading' && (
        <div className="mb-3 text-sm text-[#A3A3A3] text-center">
          Cargando acceso con Google...
        </div>
      )}

      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="min-h-[44px]"
        />
      </div>
    </div>
  );
};

export default GoogleSignInButton;

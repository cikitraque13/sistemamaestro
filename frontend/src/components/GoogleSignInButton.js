import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let googleScriptPromise = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const GoogleConnectingOverlay = ({ stepText }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-[#0A0A0A]/96 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-[#171717] border border-white/10 rounded-3xl px-8 py-10 text-center shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#0F5257]/15 border border-[#0F5257]/20">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0F5257] animate-pulse"></div>
              <span className="text-[#CDECEE] text-sm font-medium tracking-wide">
                Sistema Maestro
              </span>
            </div>
          </div>

          <h3 className="text-2xl font-light text-white mb-3">
            Conectando tu cuenta
          </h3>

          <p className="text-[#A3A3A3] mb-8 leading-relaxed">
            Estamos validando tu acceso con Google y preparando tu espacio de trabajo.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F5257] animate-pulse"></span>
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#0F5257] animate-pulse"
              style={{ animationDelay: '180ms' }}
            ></span>
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#0F5257] animate-pulse"
              style={{ animationDelay: '360ms' }}
            ></span>
          </div>

          <div className="rounded-2xl bg-[#0A0A0A] border border-white/5 px-4 py-4">
            <p className="text-white text-sm font-medium">{stepText}</p>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [overlayStep, setOverlayStep] = useState('Validando acceso');

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

                if (!mountedRef.current) return;

                setIsAuthenticating(true);
                setOverlayStep('Validando acceso');

                const {
                  loginWithGoogleCredential: loginFn,
                  redirectPath: nextPath,
                  redirectState: nextState
                } = authRef.current;

                const result = await loginFn(response.credential);

                if (!mountedRef.current) return;

                if (result.success) {
                  setOverlayStep('Preparando tu espacio');
                  await wait(320);

                  navigate(nextPath, {
                    replace: true,
                    state: nextState
                  });
                  return;
                }

                setIsAuthenticating(false);
                toast.error(result.error || 'Error al iniciar sesión con Google');
              } catch (callbackError) {
                console.error('Google callback error:', callbackError);
                if (mountedRef.current) {
                  setIsAuthenticating(false);
                }
                toast.error('Error al completar el acceso con Google');
              }
            }
          });

          initializedRef.current = true;
        }

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

  return (
    <>
      {isAuthenticating && <GoogleConnectingOverlay stepText={overlayStep} />}

      {(status === 'missing_client' || status === 'error') ? (
        <div className="w-full mb-6">
          <div className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
            {errorMessage}
          </div>
        </div>
      ) : (
        <div className="w-full mb-6">
          {status === 'loading' && (
            <div className="mb-3 text-sm text-[#A3A3A3] text-center">
              Cargando acceso con Google...
            </div>
          )}

          <div className="flex justify-center">
            <div ref={containerRef} className="min-h-[44px]" />
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSignInButton;

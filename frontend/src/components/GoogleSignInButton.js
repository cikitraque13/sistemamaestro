import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const MATRIX_STRINGS = [
  '101100101001',
  'AUTH',
  'ACCESS',
  'TOKEN',
  'SYS',
  'NODE',
  'LOGIN',
  'FLOW',
  'ID',
  'OK',
  '010101',
  'VALID',
  'SESSION',
  'GRID'
];

const MatrixRain = () => {
  const columns = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${index * 5.8}%`,
        duration: 7 + (index % 5),
        delay: (index % 6) * 0.7,
        opacity: 0.12 + (index % 4) * 0.04,
        text:
          MATRIX_STRINGS[index % MATRIX_STRINGS.length] +
          ' ' +
          MATRIX_STRINGS[(index + 3) % MATRIX_STRINGS.length] +
          ' ' +
          MATRIX_STRINGS[(index + 6) % MATRIX_STRINGS.length]
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {columns.map((column) => (
        <div
          key={column.id}
          className="absolute top-[-30%] text-[10px] sm:text-xs font-mono tracking-[0.25em] text-[#34d399] whitespace-pre-line select-none"
          style={{
            left: column.left,
            opacity: column.opacity,
            animation: `matrixDrop ${column.duration}s linear infinite`,
            animationDelay: `${column.delay}s`
          }}
        >
          {Array.from({ length: 10 }, () => column.text).join('\n')}
        </div>
      ))}
    </div>
  );
};

const GoogleConnectingOverlay = ({ stepText }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-[#020403] flex items-center justify-center px-6">
      <style>{`
        @keyframes matrixDrop {
          0% { transform: translateY(-20%); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(140%); opacity: 0; }
        }
        @keyframes matrixPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes scanLine {
          0% { transform: translateY(-120%); opacity: 0; }
          20% { opacity: 0.35; }
          100% { transform: translateY(120%); opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_55%)]"></div>
      <div className="absolute inset-0 opacity-40">
        <MatrixRain />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ animation: 'scanLine 2.8s linear infinite' }}
      >
        <div className="h-24 w-full bg-gradient-to-b from-transparent via-[#34d399]/10 to-transparent" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="absolute inset-0 rounded-[28px] bg-[#10b981]/10 blur-3xl"></div>

        <div className="relative overflow-hidden rounded-[28px] border border-[#1f7a5c]/35 bg-[#08110d]/92 shadow-[0_0_60px_rgba(16,185,129,0.10)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,211,153,0.06),transparent_22%,transparent_78%,rgba(52,211,153,0.04))]"></div>

          <div className="relative px-8 py-10 sm:px-12 sm:py-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#34d399]/20 bg-[#0b1712] px-4 py-2">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-[#34d399]"
                  style={{ animation: 'matrixPulse 1.2s ease-in-out infinite' }}
                />
                <span className="font-mono text-xs sm:text-sm tracking-[0.24em] text-[#a7f3d0] uppercase">
                  Sistema Maestro
                </span>
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-light text-white mb-3">
              Inicializando acceso
            </h3>

            <p className="text-[#9ca3af] leading-relaxed mb-8 max-w-md mx-auto">
              Validando identidad, cargando sesión y preparando el entorno de trabajo.
            </p>

            <div className="mb-8 rounded-2xl border border-[#34d399]/15 bg-[#050b08] px-5 py-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse [animation-delay:180ms]" />
                <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse [animation-delay:360ms]" />
              </div>

              <p className="font-mono text-sm sm:text-base tracking-[0.18em] uppercase text-[#d1fae5]">
                {stepText}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="rounded-xl border border-[#34d399]/10 bg-[#07100c] px-3 py-3">
                <div className="font-mono text-[10px] tracking-[0.20em] text-[#6ee7b7] uppercase mb-1">
                  Auth
                </div>
                <div className="text-xs text-[#d1d5db]">Google handshake</div>
              </div>
              <div className="rounded-xl border border-[#34d399]/10 bg-[#07100c] px-3 py-3">
                <div className="font-mono text-[10px] tracking-[0.20em] text-[#6ee7b7] uppercase mb-1">
                  Session
                </div>
                <div className="text-xs text-[#d1d5db]">Token activo</div>
              </div>
              <div className="rounded-xl border border-[#34d399]/10 bg-[#07100c] px-3 py-3">
                <div className="font-mono text-[10px] tracking-[0.20em] text-[#6ee7b7] uppercase mb-1">
                  Workspace
                </div>
                <div className="text-xs text-[#d1d5db]">Dashboard listo</div>
              </div>
            </div>
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
                  setOverlayStep('Cargando sesión');
                  await wait(280);
                  setOverlayStep('Preparando dashboard');
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

      {status === 'missing_client' || status === 'error' ? (
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

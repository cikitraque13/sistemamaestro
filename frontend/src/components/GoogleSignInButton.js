import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/$/, '');

const PUBLIC_CONFIG_URL = `${BACKEND_URL}/api/public/config`;

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
  const envClientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').trim();

  if (envClientId) {
    return envClientId;
  }

  try {
    const response = await fetch(PUBLIC_CONFIG_URL, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Public config error: ${response.status}`);
    }

    const data = await response.json();
    return (data?.google_client_id || '').trim();
  } catch (error) {
    console.error(`Error cargando ${PUBLIC_CONFIG_URL}:`, error);
    return '';
  }
};

const MATRIX_CHARS = [
  '0', '1', 'A', 'U', 'T', 'H', 'X', '9', 'K', 'Î£', 'Î›', '7', 'N', 'O', 'D', 'E',
  'S', 'Y', 'S', 'Q', 'R', 'I', 'V', 'M', 'C', '8', '2', '5', 'F', 'P'
];

const buildMatrixColumn = (length = 28) =>
  Array.from({ length }, (_, index) => ({
    id: index,
    char: MATRIX_CHARS[(index * 7 + length) % MATRIX_CHARS.length]
  }));

const hasRenderedGoogleButton = (node) => {
  if (!node) return false;
  return Boolean(node.querySelector('iframe, div[role="button"]'));
};

const MatrixRain = () => {
  const columns = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        id: index,
        left: `${index * 3.95}%`,
        duration: 5.8 + (index % 7) * 0.65,
        delay: (index % 9) * 0.28,
        opacity: 0.14 + (index % 5) * 0.045,
        chars: buildMatrixColumn(24 + (index % 8))
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {columns.map((column) => (
        <div
          key={column.id}
          className="absolute top-[-40%] select-none font-mono text-[11px] sm:text-xs tracking-[0.2em] text-[#39ff88]"
          style={{
            left: column.left,
            opacity: column.opacity,
            animation: `matrixDrop ${column.duration}s linear infinite`,
            animationDelay: `${column.delay}s`
          }}
        >
          {column.chars.map((item, charIndex) => (
            <div
              key={item.id}
              className={charIndex === 0 ? 'text-[#d1ffe5]' : ''}
              style={{
                opacity: Math.max(0.18, 1 - charIndex * 0.045)
              }}
            >
              {item.char}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const GoogleConnectingOverlay = ({ stepText }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-[#010302] flex items-center justify-center px-6">
      <style>{`
        @keyframes matrixDrop {
          0% { transform: translateY(-18%); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translateY(150%); opacity: 0; }
        }
        @keyframes matrixPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes matrixScan {
          0% { transform: translateY(-130%); opacity: 0; }
          10% { opacity: 0.18; }
          100% { transform: translateY(130%); opacity: 0; }
        }
        @keyframes terminalBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,136,0.09),transparent_45%)]" />
      <div className="absolute inset-0 opacity-55">
        <MatrixRain />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ animation: 'matrixScan 2.4s linear infinite' }}
      >
        <div className="h-28 w-full bg-gradient-to-b from-transparent via-[#39ff88]/10 to-transparent" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 rounded-[30px] bg-[#39ff88]/8 blur-3xl" />

        <div className="relative overflow-hidden rounded-[30px] border border-[#1f7a4f]/35 bg-[#06100b]/92 shadow-[0_0_70px_rgba(57,255,136,0.09)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(57,255,136,0.05),transparent_22%,transparent_78%,rgba(57,255,136,0.03))]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.015)_0px,rgba(255,255,255,0.015)_1px,transparent_1px,transparent_4px)] opacity-20" />

          <div className="relative px-8 py-10 sm:px-12 sm:py-12">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#39ff88]/20 bg-[#0a1711] px-4 py-2">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-[#39ff88]"
                  style={{ animation: 'matrixPulse 1.2s ease-in-out infinite' }}
                />
                <span className="font-mono text-[11px] sm:text-xs tracking-[0.28em] text-[#b8ffd4] uppercase">
                  Sistema Maestro
                </span>
              </div>

              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#6ee7a8]">
                AUTH / GOOGLE
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
              <div>
                <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
                  Inicializando acceso
                </h3>

                <p className="text-[#9aa4a0] leading-relaxed mb-8 max-w-xl">
                  Verificando identidad, activando sesiÃ³n segura y preparando el entorno de trabajo para entrar en tu dashboard.
                </p>

                <div className="rounded-2xl border border-[#39ff88]/14 bg-[#040a07] px-5 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse [animation-delay:180ms]" />
                    <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse [animation-delay:360ms]" />
                  </div>

                  <p className="font-mono text-sm sm:text-base tracking-[0.16em] uppercase text-[#e9fff1]">
                    {stepText}
                    <span
                      className="ml-1 inline-block text-[#39ff88]"
                      style={{ animation: 'terminalBlink 1s step-end infinite' }}
                    >
                      _
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#39ff88]/14 bg-[#040a07] px-5 py-5">
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#6ee7a8] mb-4">
                  Estado de sistema
                </div>

                <div className="space-y-3 font-mono text-xs sm:text-[13px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Handshake</span>
                    <span className="text-[#d7ffe7]">OK</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Token</span>
                    <span className="text-[#d7ffe7]">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Session</span>
                    <span className="text-[#d7ffe7]">SECURE</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9aa4a0]">Workspace</span>
                    <span className="text-[#d7ffe7]">LOADING</span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-white/5 bg-[#07110c] px-4 py-4">
                  <div className="font-mono text-[11px] tracking-[0.20em] uppercase text-[#6ee7a8] mb-2">
                    Log
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-[#b8c4be]">
                    <div>&gt; identity.provider = google</div>
                    <div>&gt; auth.channel = secure</div>
                    <div>&gt; redirect.target = dashboard</div>
                    <div>&gt; status = readying session</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#39ff88]/40 to-transparent" />
        </div>
      </div>
    </div>
  );
};

const GoogleSignInButton = ({ redirectPath = '/dashboard', redirectState = null }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const initializedRef = useRef(false);
  const mountedRef = useRef(false);
  const renderTimeoutRef = useRef(null);
  const lastRenderedWidthRef = useRef(null);

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
  const [buttonWidth, setButtonWidth] = useState(340);

  useEffect(() => {
    authRef.current = {
      loginWithGoogleCredential,
      redirectPath,
      redirectState
    };
  }, [loginWithGoogleCredential, redirectPath, redirectState]);

  useEffect(() => {
    if (!wrapperRef.current) return undefined;

    const updateWidth = () => {
      if (!wrapperRef.current) return;
      const width = wrapperRef.current.clientWidth;
      const safeWidth = Math.max(220, Math.min(360, width));
      setButtonWidth((current) => (current === safeWidth ? current : safeWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, []);

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
            setErrorMessage('Google Sign-In no estÃ¡ disponible temporalmente.');
          }
          return;
        }

        await loadGoogleScriptOnce();

        if (!mountedRef.current) return;

        const googleId = window.google?.accounts?.id;
        if (!googleId) {
          throw new Error('Google Identity Services no estÃ¡ disponible');
        }

        if (!containerRef.current) {
          throw new Error('No existe el contenedor del botÃ³n de Google');
        }

        if (!initializedRef.current) {
          googleId.initialize({
            client_id: clientId,
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: async (response) => {
              try {
                if (!response?.credential) {
                  throw new Error('Google no devolviÃ³ credencial');
                }

                if (!mountedRef.current) return;

                setIsAuthenticating(true);
                setOverlayStep('Validando acceso');

                const {
                  loginWithGoogleCredential: loginFn,
                  redirectPath: nextPath,
                  redirectState: nextState
                } = authRef.current;

                const [result] = await Promise.all([
                  loginFn(response.credential),
                  wait(700)
                ]);

                if (!mountedRef.current) return;

                if (result.success) {
                  setOverlayStep('Cargando sesiÃ³n');
                  await wait(420);
                  setOverlayStep('Preparando dashboard');
                  await wait(520);

                  navigate(nextPath, {
                    replace: true,
                    state: nextState
                  });
                  return;
                }

                setIsAuthenticating(false);
                toast.error(result.error || 'Error al iniciar sesiÃ³n con Google');
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

        const alreadyRendered =
          lastRenderedWidthRef.current === buttonWidth &&
          containerRef.current.childElementCount > 0 &&
          hasRenderedGoogleButton(containerRef.current);

        if (!alreadyRendered) {
          containerRef.current.innerHTML = '';

          googleId.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: buttonWidth
          });

          lastRenderedWidthRef.current = buttonWidth;

          window.clearTimeout(renderTimeoutRef.current);
          renderTimeoutRef.current = window.setTimeout(() => {
            const ok = hasRenderedGoogleButton(containerRef.current);

            if (!ok && mountedRef.current) {
              setStatus('error');
              setErrorMessage('No se pudo dibujar el botÃ³n de Google.');
            }
          }, 220);
        }

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

    if (buttonWidth >= 220) {
      initGoogle();
    }

    return () => {
      mountedRef.current = false;
      window.clearTimeout(renderTimeoutRef.current);
    };
  }, [navigate, buttonWidth]);

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
            <div ref={wrapperRef} className="w-full max-w-[360px]">
              <div className="rounded-xl border border-white/10 bg-white/95 p-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div
                  ref={containerRef}
                  className="min-h-[44px] rounded-[11px] bg-white flex items-center justify-center"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSignInButton;

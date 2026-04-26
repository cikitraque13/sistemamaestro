import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const hasProcessed = useRef(false);

  const [statusText, setStatusText] = useState('Validando identidad');
  const [detailText, setDetailText] = useState(
    'Estamos comprobando la respuesta de autenticación y preparando una sesión segura.'
  );

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

        setStatusText('Verificando sesión');
        setDetailText('Comprobando token, integridad y continuidad del acceso.');

        const result = await handleGoogleCallback(sessionId);

        sessionStorage.removeItem('google_auth_redirect');
        window.history.replaceState(null, '', window.location.pathname);

        if (result.success) {
          setStatusText('Preparando entorno');
          setDetailText('La sesión es válida. Redirigiendo al sistema.');
          await wait(320);

          navigate(redirectConfig.redirectPath || '/dashboard', {
            replace: true,
            state: redirectConfig.redirectState || { user: result.user }
          });
        } else {
          setStatusText('Redirigiendo a acceso');
          setDetailText('No se pudo validar la sesión. Volvemos a la pantalla de login.');
          await wait(240);

          navigate('/login', {
            replace: true,
            state: { error: result.error }
          });
        }
      } else {
        sessionStorage.removeItem('google_auth_redirect');
        setStatusText('Sesión no encontrada');
        setDetailText('No llegó un identificador válido. Volvemos a la pantalla de acceso.');
        await wait(220);
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050607]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,136,0.09),transparent_44%)]" />
        <div className="absolute left-[10%] top-[8%] h-56 w-56 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute right-[8%] top-[14%] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center mb-6">
            <Logo size="xlarge" />
          </div>

          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#39ff88]/14 bg-[#07110c] px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#b8ffd4]">
                Auth / Callback
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-[#1f7a4f]/30 bg-[#0b0f0d]/92 shadow-[0_0_70px_rgba(57,255,136,0.09)]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(57,255,136,0.05),transparent_22%,transparent_78%,rgba(57,255,136,0.03))]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.012)_0px,rgba(255,255,255,0.012)_1px,transparent_1px,transparent_4px)] opacity-20" />

            <div className="relative px-8 py-10 sm:px-10 sm:py-12">
              <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-light text-white mb-4">
                    Procesando autenticación
                  </h1>

                  <p className="text-[#9aa4a0] leading-relaxed mb-8">
                    Estamos validando la respuesta del proveedor y preparando la sesión para continuar dentro del sistema sin fricción.
                  </p>

                  <div className="rounded-2xl border border-[#39ff88]/14 bg-[#040a07] px-5 py-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse" />
                      <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse [animation-delay:180ms]" />
                      <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse [animation-delay:360ms]" />
                    </div>

                    <p className="font-mono text-sm sm:text-base tracking-[0.16em] uppercase text-[#e9fff1]">
                      {statusText}
                      <span className="ml-1 inline-block text-[#39ff88] animate-pulse">_</span>
                    </p>

                    <p className="mt-3 text-sm leading-6 text-[#9aa4a0]">
                      {detailText}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#39ff88]/14 bg-[#040a07] px-5 py-5">
                  <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#6ee7a8] mb-4">
                    Estado de sistema
                  </div>

                  <div className="space-y-3 font-mono text-xs sm:text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#9aa4a0]">Provider</span>
                      <span className="text-[#d7ffe7]">GOOGLE</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#9aa4a0]">Callback</span>
                      <span className="text-[#d7ffe7]">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#9aa4a0]">Session</span>
                      <span className="text-[#d7ffe7]">VERIFYING</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#9aa4a0]">Target</span>
                      <span className="text-[#d7ffe7]">DASHBOARD</span>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/5 bg-[#07110c] px-4 py-4">
                    <div className="font-mono text-[11px] tracking-[0.20em] uppercase text-[#6ee7a8] mb-2">
                      Log
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-[#b8c4be]">
                      <div>&gt; auth.provider = google</div>
                      <div>&gt; auth.callback = processing</div>
                      <div>&gt; session.mode = secure</div>
                      <div>&gt; redirect.phase = pending</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#39ff88]/40 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
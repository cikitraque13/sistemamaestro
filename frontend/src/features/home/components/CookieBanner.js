import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'sm_cookie_consent_v1';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleChoice = (value) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 bg-[#0A0A0A]/95 p-5 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-white">Cookies y privacidad</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Usamos cookies para mejorar la experiencia, analizar uso y mantener continuidad funcional. Puedes aceptarlas o configurarlas después desde la política de cookies.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-400">
              <Link to="/cookies" className="transition hover:text-white">Política de cookies</Link>
              <Link to="/privacy" className="transition hover:text-white">Política de privacidad</Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleChoice('rejected')}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-zinc-500"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => handleChoice('accepted')}
              className="inline-flex items-center justify-center rounded-2xl border border-white bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
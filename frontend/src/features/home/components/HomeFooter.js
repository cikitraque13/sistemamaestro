import React from 'react';
import { Link } from 'react-router-dom';

import '../homeFlow.css';

// «Planes» usa el hash #pricing, que la cabecera escucha para abrir el panel de planes.
const navLinks = [
  { label: 'Agencia de IA', href: '#agencia-ia' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Para quién es', href: '#para-quien-es' },
  { label: 'Planes', href: '#pricing' },
];

const legalLinks = [
  { label: 'Privacidad', to: '/privacy' },
  { label: 'Cookies', to: '/cookies' },
  { label: 'Términos', to: '/terms' },
];

const headingClass = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400';
const linkClass = 'sm-footer-link w-fit text-sm text-zinc-300';

const HomeFooter = () => {
  return (
    <footer className="relative px-6 pb-8 pt-12 md:px-10">
      <span className="sm-footer-line" aria-hidden="true" />

      <div className="mx-auto grid max-w-7xl items-start gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr] md:gap-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/15 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,#17120B_0%,#050505_100%)] p-1.5 shadow-[0_0_24px_rgba(245,158,11,0.10)]">
              <img
                src="/sistema_maestro_gold_logo.png"
                alt="Sistema Maestro"
                className="h-full w-full object-contain"
                draggable="false"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Sistema Maestro</p>
              <p className="text-xs text-zinc-400">Dirección, IA y continuidad</p>
            </div>
          </div>

          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-300">
            Construimos tu web, la lanzamos y ponemos un agente de IA a atender a tus clientes por chat, web o WhatsApp.
          </p>
        </div>

        <nav aria-label="Navegación">
          <p className={headingClass}>Navegación</p>
          <div className="mt-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        <div>
          <p className={headingClass}>Legal</p>
          <div className="mt-4 flex flex-col gap-3">
            {legalLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">© 2026 Sistema Maestro. Todos los derechos reservados.</p>
        <Link to="/register" className="sm-footer-link w-fit text-xs font-medium text-zinc-300">
          Crea tu cuenta gratis
        </Link>
      </div>
    </footer>
  );
};

export default HomeFooter;

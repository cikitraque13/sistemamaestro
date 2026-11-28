import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CaretDown, GearSix, Question, SignOut, Waveform } from '@phosphor-icons/react';

import { useAuth } from '../../../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

const PLANS_PATH = '/dashboard/billing';
const SETTINGS_PATH = '/dashboard/settings';

const itemClass =
  'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:bg-white/10 focus:text-white data-[disabled]:cursor-not-allowed data-[disabled]:opacity-100 data-[highlighted]:bg-white/10';

function accountName(user) {
  const name = String(user?.name || '').trim();
  return name || 'Cuenta';
}

function accountInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

// Spendable balance only. credit_lifetime_granted is the cumulative grant
// counter (what the old panel painted as "+ 605"), not extra credits.
export function realCreditBalance(user) {
  const value = user?.credit_balance;
  if (value === undefined || value === null || value === '') return '0';
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return String(Number(value.trim()));
  return '—';
}

function SoonItem({ testId, icon: Icon, label }) {
  return (
    <DropdownMenuItem disabled className={itemClass} data-testid={testId}>
      <Icon size={16} aria-hidden="true" className="text-zinc-500" />
      <span className="min-w-0 flex-1 text-zinc-400">{label}</span>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Próximamente
      </span>
    </DropdownMenuItem>
  );
}

export default function BuilderAccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const logoutPending = useRef(false);
  const name = accountName(user);
  const email = String(user?.email || '').trim();
  const balance = realCreditBalance(user);

  const handleLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    try {
      await logout();
      navigate('/');
    } finally {
      logoutPending.current = false;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="builder-account-menu"
        aria-label={`Cuenta de ${name}`}
        className="inline-flex min-h-11 max-w-[calc(100vw-8.5rem)] items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-2.5 py-1.5 text-left text-sm font-medium text-white outline-none transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:max-w-[240px]"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/15 text-xs font-semibold text-cyan-100"
        >
          {accountInitials(name)}
        </span>
        <span className="min-w-0 truncate">{name}</span>
        <CaretDown aria-hidden="true" size={14} className="shrink-0 text-zinc-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        aria-label="Cuenta"
        data-testid="builder-account-menu-panel"
        className="w-[min(20.5rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-[#0c1016] p-2 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
      >
        {email ? (
          <DropdownMenuLabel className="px-3 py-2 text-sm font-normal text-zinc-400 break-all">
            {email}
          </DropdownMenuLabel>
        ) : null}

        <div className="mx-1 mb-1 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Créditos</p>
          <p
            data-testid="builder-account-balance"
            className="mt-1 text-3xl font-semibold tracking-tight text-white"
            aria-label={`Saldo de créditos: ${balance}`}
          >
            {balance}
          </p>
          <DropdownMenuItem asChild className="mt-3 p-0 focus:bg-transparent data-[highlighted]:bg-transparent">
            <Link
              to={PLANS_PATH}
              data-testid="builder-account-upgrade"
              className="flex w-full items-center justify-center rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-200 via-white to-amber-100 px-3 py-2 text-sm font-semibold text-black outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              Mejorar plan
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1 bg-white/10" />

        <SoonItem testId="builder-account-advisor" icon={Waveform} label="Conoce a tu asesor" />
        <SoonItem testId="builder-account-help" icon={Question} label="Ayuda" />

        <DropdownMenuItem asChild className={itemClass}>
          <Link to={SETTINGS_PATH} data-testid="builder-account-settings">
            <GearSix size={16} aria-hidden="true" className="text-zinc-300" />
            <span>Ajustes</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-white/10" />

        <DropdownMenuItem
          className={itemClass}
          data-testid="builder-account-logout"
          onSelect={() => {
            handleLogout();
          }}
        >
          <SignOut size={16} aria-hidden="true" className="text-zinc-300" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

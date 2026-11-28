import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CaretDown,
  CreditCard,
  DiamondsFour,
  GearSix,
  Info,
  Plus,
  Question,
  SignOut,
  Waveform,
} from '@phosphor-icons/react';

import { useAuth } from '../../../context/AuthContext';
import AdvisorFlowPanel from '../advisor/AdvisorFlowPanel';
import { useAdvisorFlowConfig } from '../advisor/useAdvisorFlowConfig';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

const PLANS_PATH = '/dashboard/billing';
const SETTINGS_PATH = '/dashboard/settings';
const GEMS_HELP = 'Las gemas son el saldo real disponible para construir e iterar. El histórico de gemas concedidas no se suma a este número.';

const itemClass =
  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-100 outline-none focus:bg-white/10 focus:text-white data-[disabled]:cursor-not-allowed data-[disabled]:opacity-100 data-[highlighted]:bg-white/10';

function accountName(user) {
  const name = String(user?.name || '').trim();
  return name || 'Cuenta';
}

function accountInitial(name) {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'U';
}

function profilePicture(user) {
  const value = user?.picture;
  if (typeof value !== 'string') return '';
  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : '';
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
      <Icon size={18} aria-hidden="true" className="text-zinc-500" />
      <span className="min-w-0 flex-1 text-zinc-400">{label}</span>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Próximamente
      </span>
    </DropdownMenuItem>
  );
}

function AccountAvatar({ name, picture, compact = false }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(picture) && !failed;

  return (
    <span
      data-testid="builder-account-avatar"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full text-sm font-semibold text-white ${compact ? 'h-8 w-8 bg-[#6d28d9]' : 'h-9 w-9 bg-[#6d28d9]'}`}
    >
      {showPhoto ? (
        <img
          src={picture}
          alt=""
          data-testid="builder-account-photo"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        accountInitial(name)
      )}
    </span>
  );
}

export default function BuilderAccountMenu({ onNewProject = () => {}, advisorConfig = null, compact = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const logoutPending = useRef(false);
  const fetchedAdvisor = useAdvisorFlowConfig();
  const advisor = advisorConfig ?? fetchedAdvisor;
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const name = accountName(user);
  const email = String(user?.email || '').trim();
  const balance = realCreditBalance(user);
  const picture = profilePicture(user);

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
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="builder-account-menu"
        aria-label={`Cuenta de ${name}`}
        className={compact
          ? 'grid h-8 w-8 place-items-center rounded-full bg-[#6d28d9] text-sm font-semibold text-white outline-none'
          : 'inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/30 py-1 pl-1 pr-2 text-left text-sm font-medium text-white outline-none transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:pr-3'}
      >
        <AccountAvatar name={name} picture={picture} compact={compact} />
        {compact ? null : <span className="hidden max-w-[9rem] truncate sm:inline">{name}</span>}
        {compact ? null : <CaretDown aria-hidden="true" size={14} className="shrink-0 text-zinc-400" />}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        collisionPadding={12}
        aria-label="Cuenta"
        data-testid="builder-account-menu-panel"
        className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-[#0c1016] p-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
      >
        {email ? (
          <p data-testid="builder-account-email" className="px-3 pb-2 pt-1 text-sm text-zinc-400 break-all">
            {email}
          </p>
        ) : null}

        <div data-testid="builder-account-workspace" className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-[10px] font-semibold tracking-[0.14em] text-cyan-100">
            SM
          </span>
          <p className="min-w-0 text-sm leading-5 text-white">
            <span className="font-medium">Sistema Maestro</span>
            <span className="text-zinc-500"> · </span>
            <span className="text-zinc-300">Propietario</span>
          </p>
        </div>

        <div className="mb-2 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-testid="builder-account-gems-info"
                      aria-label={GEMS_HELP}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-zinc-400 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.preventDefault()}
                    >
                      <Info size={16} aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[16rem] border border-white/10 bg-[#0c1016] text-xs leading-5 text-zinc-100">
                    {GEMS_HELP}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-sm font-medium text-zinc-100">Créditos</p>
            </div>
            <p
              data-testid="builder-account-balance"
              className="flex items-center gap-1.5 text-sm font-semibold text-white"
              aria-label={`Saldo de créditos: ${balance}`}
            >
              <DiamondsFour size={16} weight="fill" aria-hidden="true" className="text-cyan-200" />
              <span>{balance}</span>
            </p>
          </div>
          <DropdownMenuItem asChild className="mt-3 p-0 focus:bg-transparent data-[highlighted]:bg-transparent">
            <Link
              to={PLANS_PATH}
              data-testid="builder-account-upgrade"
              className="flex w-full items-center justify-center rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-200 px-3 py-2.5 text-sm font-semibold text-black shadow-[0_0_28px_rgba(250,204,21,0.38)] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              Añadir créditos
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuItem asChild className={itemClass}>
          <Link to={PLANS_PATH} data-testid="builder-account-manage-plan">
            <CreditCard size={18} aria-hidden="true" className="text-zinc-300" />
            <span>Gestionar tu plan</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className={itemClass}>
          <Link to={SETTINGS_PATH} data-testid="builder-account-settings">
            <GearSix size={18} aria-hidden="true" className="text-zinc-300" />
            <span>Configuración de cuenta</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          className={itemClass}
          data-testid="builder-account-new-project"
          onSelect={() => onNewProject()}
        >
          <Plus size={18} aria-hidden="true" className="text-zinc-300" />
          <span>Nuevo proyecto</span>
        </DropdownMenuItem>

        {advisor.enabled ? (
          <DropdownMenuItem
            className={itemClass}
            data-testid="builder-account-advisor"
            onSelect={() => setAdvisorOpen(true)}
          >
            <Waveform size={18} aria-hidden="true" className="text-zinc-300" />
            <span className="min-w-0 flex-1">Conoce a tu asesor</span>
          </DropdownMenuItem>
        ) : (
          <SoonItem testId="builder-account-advisor" icon={Waveform} label="Conoce a tu asesor" />
        )}
        <SoonItem testId="builder-account-help" icon={Question} label="Ayuda" />

        <DropdownMenuSeparator className="my-2 bg-white/10" />

        <DropdownMenuItem
          className={`${itemClass} text-red-400 focus:text-red-300 data-[highlighted]:text-red-300`}
          data-testid="builder-account-logout"
          onSelect={() => {
            handleLogout();
          }}
        >
          <SignOut size={18} aria-hidden="true" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <AdvisorFlowPanel
      open={Boolean(advisor.enabled) && advisorOpen}
      onOpenChange={setAdvisorOpen}
      config={advisor}
    />
    </>
  );
}

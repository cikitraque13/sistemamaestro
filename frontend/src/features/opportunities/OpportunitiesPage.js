import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Lock,
  ArrowRight,
  Sparkle,
  CurrencyDollar,
  Gauge
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

import DashboardLayout from '../../components/DashboardLayout';

const API_BASE = '/api';
const TOTAL_OPPORTUNITIES = 10;

const DEFAULT_BILLING_STATE = {
  suggestedPlan: 'blueprint',
  focusSection: 'opportunities',
  source: 'opportunities-page'
};

const ROUTE_NAMES = {
  improve: 'Mejorar existente',
  sell: 'Vender y cobrar',
  automate: 'Automatizar',
  idea: 'Idea a proyecto'
};

const DIFFICULTY_BADGES = {
  facil: { label: 'Fácil', color: 'bg-green-500/20 text-green-300' },
  media: { label: 'Media', color: 'bg-yellow-500/20 text-yellow-300' },
  avanzada: { label: 'Avanzada', color: 'bg-red-500/20 text-red-300' }
};

const COPY_REPLACEMENTS = [
  [/Consultoría\s*\(\$299\)/gi, 'Paquete estratégico opcional ($299)'],
  [/Consultoría/gi, 'Paquete estratégico'],
  [/Pay-per-report/gi, 'Pago por informe'],
  [/Vender reportes premium/gi, 'Preparar una oferta de reportes premium'],
  [/Vender reportes/gi, 'Preparar una oferta de reportes'],
  [/servicios de setup/gi, 'paquete de configuración inicial'],
  [/servicios de implementación/gi, 'paquete de activación'],
  [/llamadas comerciales/gi, 'flujo de captación'],
  [/hacer llamadas/gi, 'activar contacto comercial'],
  [/suscripción mensual para agencias/gi, 'suscripción mensual para equipos o clientes recurrentes'],
  [/Suscripción mensual \+ servicios de setup/gi, 'Suscripción mensual + paquete de activación inicial'],
  [/Membresía recurrente \+ eventos premium/gi, 'Membresía recurrente + contenidos premium'],
  [/Freemium:/gi, 'Entrada gratuita:'],
  [/Reporte completo/gi, 'Informe completo'],
  [/reportes de mejora automáticos/gi, 'informes de mejora generados desde el sistema'],
  [/reportes PDF profesionales/gi, 'informes PDF profesionales'],
  [/recomendaciones detalladas/gi, 'recomendaciones accionables']
];

const sanitizeOpportunityCopy = (value, fallback = 'Por definir') => {
  const initialText = String(value || '').trim();

  if (!initialText) return fallback;

  return COPY_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    initialText
  );
};

const normalizeOpportunity = (opp) => {
  const isLocked = Boolean(opp.locked);

  return {
    opportunity_id: opp.opportunity_id,
    title: sanitizeOpportunityCopy(opp.title, 'Oportunidad premium'),
    description: sanitizeOpportunityCopy(
      opp.description || opp.teaser,
      isLocked
        ? 'Ruta premium disponible para desbloquear y llevar al Builder.'
        : 'Sin descripción disponible'
    ),
    teaser: sanitizeOpportunityCopy(
      opp.teaser || opp.description,
      'Ruta premium disponible para desbloquear y llevar al Builder.'
    ),
    route: opp.route || 'idea',
    difficulty: opp.difficulty || 'media',
    locked: isLocked,
    access_level: opp.access_level || (isLocked ? 'locked' : 'unlocked'),
    required_plan: opp.required_plan || (isLocked ? 'blueprint' : null),
    required_plan_label: opp.required_plan_label || (isLocked ? 'Pro' : null),
    unlock_message: sanitizeOpportunityCopy(
      opp.unlock_message,
      isLocked ? 'Disponible al desbloquear plantillas con Pro.' : ''
    ),
    monetization: isLocked
      ? ''
      : sanitizeOpportunityCopy(
          opp.monetization || opp.business_model,
          'Ruta de monetización por definir'
        ),
    business_model: isLocked
      ? ''
      : sanitizeOpportunityCopy(
          opp.business_model,
          'Modelo monetizable por definir'
        ),
    steps: !isLocked && Array.isArray(opp.steps)
      ? opp.steps.map((step) => sanitizeOpportunityCopy(step, '')).filter(Boolean)
      : []
  };
};

const buildOpportunityPrompt = (opportunity) => {
  const title = String(opportunity?.title || '').trim();
  const description = String(opportunity?.description || '').trim();
  const businessModel = String(opportunity?.business_model || '').trim();
  const monetization = String(opportunity?.monetization || '').trim();

  return [
    title ? `Quiero convertir esta oportunidad en proyecto: ${title}.` : '',
    description ? `Idea base: ${description}.` : '',
    businessModel ? `Modelo monetizable: ${businessModel}.` : '',
    monetization ? `Ruta de monetización: ${monetization}.` : '',
    'Conviértelo en una primera versión construible en Builder, con propuesta clara, pantalla inicial, CTA principal y siguiente mejora recomendada.'
  ]
    .filter(Boolean)
    .join(' ');
};

const buildLauncherState = (opportunity) => ({
  focus: 'builder-launcher',
  source: 'opportunities-use-template',
  inputType: 'text',
  initialPrompt: buildOpportunityPrompt(opportunity),
  launchContext: {
    source: 'opportunities',
    opportunityId: opportunity?.opportunity_id,
    opportunityTitle: opportunity?.title,
    route: opportunity?.route,
    difficulty: opportunity?.difficulty
  }
});

const buildBillingState = (opportunity = null) => ({
  ...DEFAULT_BILLING_STATE,
  suggestedPlan: opportunity?.required_plan || DEFAULT_BILLING_STATE.suggestedPlan,
  source: opportunity?.locked
    ? 'opportunities-locked-template'
    : DEFAULT_BILLING_STATE.source
});

const getUnlockLabel = (opportunity) => (
  opportunity?.required_plan_label || 'Pro'
);

const getDifficultyMeta = (difficulty) => (
  DIFFICULTY_BADGES[difficulty] || DIFFICULTY_BADGES.media
);

const OpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await axios.get(`${API_BASE}/opportunities`, {
        withCredentials: true
      });

      const normalized = Array.isArray(response.data)
        ? response.data.map(normalizeOpportunity)
        : [];

      setOpportunities(normalized);
    } catch (error) {
      toast.error('Error al cargar oportunidades');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const unlockedOpportunitiesCount = opportunities.filter((opp) => !opp.locked).length;
  const lockedOpportunitiesCount = opportunities.filter((opp) => opp.locked).length;
  const firstLockedOpportunity = opportunities.find((opp) => opp.locked) || null;
  const hasLockedOpportunities = lockedOpportunitiesCount > 0;
  const totalVisibleOpportunities = Math.max(opportunities.length, TOTAL_OPPORTUNITIES);
  const suggestedUnlockLabel = getUnlockLabel(firstLockedOpportunity);

  const handleOpportunityClick = (opportunity) => {
    if (opportunity.locked) return;
    setSelectedOpp(opportunity);
  };

  const handleOpportunityKeyDown = (event, opportunity) => {
    if (opportunity.locked) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedOpp(opportunity);
    }
  };

  return (
    <DashboardLayout title="Oportunidades">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),linear-gradient(180deg,#111111_0%,#080808_100%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                Biblioteca de oportunidades
              </p>

              <h2
                className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-4xl"
                data-testid="opportunities-title"
              >
                Rutas monetizables para descubrir valor y llevar al Builder cuando estén desbloqueadas.
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base">
                Explora oportunidades, rutas de activación y plantillas premium. Gratis
                permite descubrir el catálogo; Pro desbloquea las primeras plantillas
                utilizables para empezar a construir en serio.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <p className="inline-flex rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                  {unlockedOpportunitiesCount} de {totalVisibleOpportunities} plantillas desbloqueadas
                </p>

                {hasLockedOpportunities && (
                  <p className="inline-flex rounded-full border border-amber-300/15 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                    {lockedOpportunitiesCount} disponibles al desbloquear
                  </p>
                )}
              </div>
            </div>

            {hasLockedOpportunities && (
              <Link
                to="/dashboard/billing"
                state={buildBillingState(firstLockedOpportunity)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15"
                data-testid="upgrade-btn"
              >
                <Lock size={16} />
                Desbloquear con {suggestedUnlockLabel}
              </Link>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center rounded-[28px] border border-white/8 bg-white/[0.02] py-24">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {opportunities.map((opp, index) => {
              const difficultyMeta = getDifficultyMeta(opp.difficulty);
              const unlockLabel = getUnlockLabel(opp);

              return (
                <motion.div
                  key={opp.opportunity_id}
                  role={opp.locked ? 'article' : 'button'}
                  tabIndex={opp.locked ? -1 : 0}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative overflow-hidden rounded-[26px] border p-5 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition ${
                    opp.locked
                      ? 'border-amber-200/10 bg-[linear-gradient(180deg,rgba(251,191,36,0.045),rgba(255,255,255,0.012))]'
                      : 'cursor-pointer border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] hover:border-emerald-300/20 hover:bg-white/[0.03]'
                  }`}
                  onClick={() => handleOpportunityClick(opp)}
                  onKeyDown={(event) => handleOpportunityKeyDown(event, opp)}
                  data-testid={`opportunity-${opp.opportunity_id}`}
                >
                  {opp.locked && (
                    <div className="absolute inset-0 z-20 flex items-end justify-center bg-gradient-to-t from-[#050505] via-[#050505]/65 to-transparent p-5">
                      <div className="w-full rounded-3xl border border-amber-200/15 bg-black/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-md">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">
                          <Lock size={14} />
                          Plantilla bloqueada
                        </div>

                        <p className="mb-4 text-sm leading-6 text-zinc-300">
                          {opp.unlock_message || `Disponible al desbloquear con ${unlockLabel}.`}
                        </p>

                        <Link
                          to="/dashboard/billing"
                          state={buildBillingState(opp)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15"
                          data-testid={`unlock-${opp.opportunity_id}`}
                        >
                          Desbloquear con {unlockLabel}
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className={opp.locked ? 'blur-[1.5px] saturate-50' : ''}>
                    <div className="mb-4 flex items-start gap-4">
                      <div
                        className={`rounded-2xl border p-3 ${
                          opp.locked
                            ? 'border-amber-200/10 bg-amber-400/10'
                            : 'border-emerald-300/15 bg-emerald-400/10'
                        }`}
                      >
                        <Lightbulb
                          size={24}
                          className={opp.locked ? 'text-amber-100/70' : 'text-emerald-200'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {opp.locked && (
                            <span className="rounded-full border border-amber-200/15 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                              Premium
                            </span>
                          )}

                          {!opp.locked && (
                            <span className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
                              Desbloqueada
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold leading-6 text-white">
                          {opp.title}
                        </h3>

                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">
                          {opp.locked ? opp.teaser : opp.description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
                        {ROUTE_NAMES[opp.route] || 'Idea a proyecto'}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${difficultyMeta.color}`}
                      >
                        {difficultyMeta.label}
                      </span>
                    </div>

                    {opp.locked ? (
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Preview premium
                        </p>

                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          Esta ruta puede convertirse en una plantilla utilizable dentro
                          de Builder cuando el acceso esté desbloqueado.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-zinc-400">
                          <CurrencyDollar size={16} className="shrink-0" />
                          <span className="truncate">
                            {opp.monetization}
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-1 font-medium text-emerald-200">
                          Ver detalles
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {selectedOpp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
            onClick={() => setSelectedOpp(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
              onClick={(event) => event.stopPropagation()}
              data-testid="opportunity-modal"
            >
              <div className="border-b border-white/8 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-3">
                      <Sparkle size={24} className="text-emerald-200" />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {selectedOpp.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
                          {ROUTE_NAMES[selectedOpp.route] || 'Idea a proyecto'}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                            getDifficultyMeta(selectedOpp.difficulty).color
                          }`}
                        >
                          <Gauge size={12} className="mr-1 inline" />
                          {getDifficultyMeta(selectedOpp.difficulty).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOpp(null)}
                    className="text-zinc-400 transition hover:text-white"
                    aria-label="Cerrar oportunidad"
                  >
                    x
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <p className="mb-2 text-sm text-zinc-500">
                    Descripción
                  </p>

                  <p className="leading-7 text-white">
                    {selectedOpp.description}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm text-zinc-500">
                    Modelo monetizable
                  </p>

                  <p className="leading-7 text-white">
                    {selectedOpp.business_model}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm text-zinc-500">
                    Ruta de monetización
                  </p>

                  <div className="rounded-2xl border border-white/8 bg-black/30 p-4">
                    <CurrencyDollar size={20} className="mb-2 text-emerald-200" />
                    <p className="leading-7 text-white">
                      {selectedOpp.monetization}
                    </p>
                  </div>
                </div>

                {selectedOpp.steps.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm text-zinc-500">
                      Primer sistema a construir
                    </p>

                    <ol className="space-y-2">
                      {selectedOpp.steps.map((step, index) => (
                        <li
                          key={`step-${index}-${step.substring(0, 20)}`}
                          className="flex items-start gap-3 text-white"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-sm text-emerald-200">
                            {index + 1}
                          </span>

                          <span className="leading-6">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="border-t border-white/8 pt-4">
                  <Link
                    to="/dashboard"
                    state={buildLauncherState(selectedOpp)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f8e0a5_0%,#f3b96c_52%,#ef85c0_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_26px_rgba(245,158,11,0.16)] transition hover:scale-[1.01]"
                    onClick={() => setSelectedOpp(null)}
                  >
                    Usar esta oportunidad en Builder
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OpportunitiesPage;

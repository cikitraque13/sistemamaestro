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
import { useAuth } from '../../context/AuthContext';

const API_BASE = '/api';

const BILLING_STATE = {
  suggestedPlan: 'premium',
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
  facil: { label: 'Facil', color: 'bg-green-500/20 text-green-300' },
  media: { label: 'Media', color: 'bg-yellow-500/20 text-yellow-300' },
  avanzada: { label: 'Avanzada', color: 'bg-red-500/20 text-red-300' }
};

const normalizeOpportunity = (opp) => ({
  opportunity_id: opp.opportunity_id,
  title: opp.title || 'Oportunidad',
  description: opp.description || 'Sin descripcion disponible',
  route: opp.route || 'idea',
  difficulty: opp.difficulty || 'media',
  monetization: opp.monetization || opp.business_model || 'Por definir',
  business_model: opp.business_model || 'Por definir',
  steps: Array.isArray(opp.steps) ? opp.steps : []
});

const buildOpportunityPrompt = (opportunity) => {
  const title = String(opportunity?.title || '').trim();
  const description = String(opportunity?.description || '').trim();
  const businessModel = String(opportunity?.business_model || '').trim();
  const monetization = String(opportunity?.monetization || '').trim();

  return [
    title ? `Quiero desarrollar: ${title}.` : '',
    description ? `Idea base: ${description}.` : '',
    businessModel ? `Modelo de negocio: ${businessModel}.` : '',
    monetization ? `Monetizacion prevista: ${monetization}.` : '',
    'Conviertelo en un proyecto construible en Builder, con primera version clara, CTA principal y siguiente mejora recomendada.'
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

const OpportunitiesPage = () => {
  const { user } = useAuth();
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

  const canAccessAll = user?.plan === 'premium' || user?.role === 'admin';
  const isLimited = !canAccessAll && opportunities.length <= 2;

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
                Ideas monetizables listas para convertir en proyecto.
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base">
                Explora rutas, modelos de negocio y primeros pasos. Al usar una oportunidad,
                Sistema Maestro la lleva al Dashboard Launcher para construirla en Builder.
              </p>
            </div>

            {!canAccessAll && (
              <Link
                to="/dashboard/billing"
                state={BILLING_STATE}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15"
                data-testid="upgrade-btn"
              >
                <Lock size={16} />
                Desbloquear mas
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
            {opportunities.map((opp, index) => (
              <motion.button
                type="button"
                key={opp.opportunity_id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-5 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-emerald-300/20 hover:bg-white/[0.03]"
                onClick={() => setSelectedOpp(opp)}
                data-testid={`opportunity-${opp.opportunity_id}`}
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-3">
                    <Lightbulb size={24} className="text-emerald-200" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold leading-6 text-white">
                      {opp.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                      {opp.description}
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
                    {ROUTE_NAMES[opp.route] || 'Idea a proyecto'}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      DIFFICULTY_BADGES[opp.difficulty]?.color ||
                      DIFFICULTY_BADGES.media.color
                    }`}
                  >
                    {DIFFICULTY_BADGES[opp.difficulty]?.label || 'Media'}
                  </span>
                </div>

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
              </motion.button>
            ))}

            {isLimited && (
              <>
                {[1, 2, 3].map((item) => (
                  <motion.div
                    key={`locked-${item}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (opportunities.length + item) * 0.05 }}
                    className="relative overflow-hidden rounded-[26px] border border-white/8 bg-white/[0.02] p-5 opacity-80"
                  >
                    <div className="absolute inset-0 z-10 flex items-end justify-center bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent pb-6">
                      <Link
                        to="/dashboard/billing"
                        state={BILLING_STATE}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15"
                      >
                        <Lock size={14} />
                        Desbloquear
                      </Link>
                    </div>

                    <div className="mb-4 flex items-start gap-4">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                        <Lightbulb size={24} className="text-zinc-500" />
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 h-5 w-3/4 rounded bg-white/10" />
                        <div className="h-4 w-full rounded bg-white/8" />
                        <div className="mt-2 h-4 w-2/3 rounded bg-white/8" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
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
                            DIFFICULTY_BADGES[selectedOpp.difficulty]?.color ||
                            DIFFICULTY_BADGES.media.color
                          }`}
                        >
                          <Gauge size={12} className="mr-1 inline" />
                          {DIFFICULTY_BADGES[selectedOpp.difficulty]?.label || 'Media'}
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
                    Descripcion
                  </p>

                  <p className="leading-7 text-white">
                    {selectedOpp.description}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm text-zinc-500">
                    Modelo de negocio
                  </p>

                  <p className="leading-7 text-white">
                    {selectedOpp.business_model}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm text-zinc-500">
                    Monetizacion
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
                      Primeros pasos
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/$/, '');

const API_URL = `${BACKEND_URL}/api`;

const MODES = [
  {
    id: 'landing',
    label: 'Landing',
    inputType: 'text',
    placeholder: 'Describe la landing: negocio, objetivo, público, oferta y CTA principal...',
    starter:
      'Quiero una landing premium para captar clientes cualificados, explicar bien el servicio y cerrar con un CTA claro de activación.',
  },
  {
    id: 'webapp',
    label: 'Web/App',
    inputType: 'text',
    placeholder: 'Describe la web, app, dashboard, herramienta o sistema que quieres construir...',
    starter:
      'Quiero una app con dashboard, proyectos, estados, acciones rápidas y experiencia premium para usuario final.',
  },
  {
    id: 'automation',
    label: 'Automatización',
    inputType: 'text',
    placeholder: 'Describe el flujo o proceso que quieres automatizar...',
    starter:
      'Quiero automatizar un proceso interno con entrada, clasificación, seguimiento y salida final clara.',
  },
  {
    id: 'url',
    label: 'Analizar URL',
    inputType: 'url',
    placeholder: 'Pega una URL y explica qué quieres mejorar: conversión, claridad, CTA, diseño...',
    starter:
      'https://miweb.com — analiza la web y reconstruye una versión más premium, más clara y más orientada a conversión.',
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    inputType: 'text',
    placeholder: 'Describe la idea para generar estructura, módulos, lógica y ruta de construcción...',
    starter:
      'Quiero convertir esta idea en un blueprint con estructura, módulos, monetización y siguientes pasos claros.',
  },
];

const PROJECT_CONTEXTS = [
  {
    id: '',
    label: 'Servicio',
    context: '',
  },
  {
    id: 'restaurant',
    label: 'Restaurante',
    context: 'restaurante u hostelería: reservas, carta, fotos, reseñas, ubicación y WhatsApp',
  },
  {
    id: 'clinic',
    label: 'Clínica',
    context: 'clínica o salud: citas, tratamientos, confianza, reseñas y contacto',
  },
  {
    id: 'agency',
    label: 'Agencia',
    context: 'agencia o consultoría: servicios, autoridad, casos, llamada comercial y captación',
  },
  {
    id: 'realestate',
    label: 'Inmobiliaria',
    context: 'inmobiliaria: propiedades, valoración, leads, visitas y confianza',
  },
  {
    id: 'architecture',
    label: 'Arquitectura',
    context: 'arquitectura o estudio creativo: portfolio, proyectos, método, autoridad y contacto',
  },
  {
    id: 'ecommerce',
    label: 'Ecommerce',
    context: 'ecommerce: producto, oferta, reseñas, garantías, envíos y compra',
  },
  {
    id: 'saas',
    label: 'SaaS',
    context: 'SaaS o herramienta digital: demo, features, onboarding, prueba social y activación',
  },
  {
    id: 'local',
    label: 'Servicio local',
    context: 'servicio local: zona, confianza, llamada, WhatsApp, reseñas y disponibilidad',
  },
  {
    id: 'education',
    label: 'Educación',
    context: 'educación o formación: alumnos, programa, autoridad, prueba social y matrícula',
  },
  {
    id: 'foodshop',
    label: 'Frutería / tienda',
    context: 'tienda local o alimentación: productos, pedidos, reparto, confianza y contacto directo',
  },
  {
    id: 'other',
    label: 'Otro servicio',
    context: 'servicio personalizado: definir cliente objetivo, oferta, confianza y acción principal',
  },
];

const PROJECT_GOALS = [
  {
    id: '',
    label: 'Objetivo',
    context: '',
  },
  {
    id: 'reservations',
    label: 'Reservas',
    context: 'conseguir reservas o solicitudes directas',
  },
  {
    id: 'leads',
    label: 'Leads',
    context: 'captar leads cualificados',
  },
  {
    id: 'sales',
    label: 'Ventas',
    context: 'aumentar ventas y reducir fricción de compra',
  },
  {
    id: 'appointments',
    label: 'Citas',
    context: 'conseguir citas o diagnósticos',
  },
  {
    id: 'automation',
    label: 'Automatización',
    context: 'automatizar procesos y reducir trabajo manual',
  },
  {
    id: 'redesign',
    label: 'Rediseño',
    context: 'rediseñar una experiencia existente para hacerla más premium y efectiva',
  },
  {
    id: 'budget',
    label: 'Presupuestos',
    context: 'conseguir solicitudes de presupuesto con más calidad',
  },
  {
    id: 'calls',
    label: 'Llamadas',
    context: 'conseguir llamadas comerciales o diagnósticos cualificados',
  },
];

const ASSISTANTS = [
  {
    id: 'master',
    label: 'Maestro',
    context: 'orquestador maestro: priorizar claridad, estructura, conversión y siguiente paso',
  },
  {
    id: 'cro',
    label: 'CRO',
    context: 'agente CRO: optimizar conversión, CTA, fricción y recorrido del usuario',
  },
  {
    id: 'copy',
    label: 'Copy',
    context: 'agente de copy: mejorar promesa, claridad, persuasión y tono comercial',
  },
  {
    id: 'visual',
    label: 'Visual',
    context: 'agente visual: elevar diseño, jerarquía, sensación premium y coherencia',
  },
  {
    id: 'automation',
    label: 'Auto',
    context: 'agente de automatización: estructurar flujos, procesos, entradas y salidas',
  },
];

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || JSON.stringify(item))
      .filter(Boolean)
      .join(' ');
  }

  if (detail && typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail);
  }

  return error?.message || 'No se pudo crear el proyecto.';
};

const getUserFirstName = (user) => {
  const rawName = user?.name || user?.email?.split('@')?.[0] || '';
  const cleanName = String(rawName)
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)[0];

  if (!cleanName) return '';

  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
};

const buildLaunchPrompt = ({
  prompt,
  selectedMode,
  selectedContext,
  selectedGoal,
  selectedAssistant,
}) => {
  const cleanPrompt = prompt.trim();

  const contextLines = [
    selectedMode?.label ? `Tipo de proyecto: ${selectedMode.label}.` : '',
    selectedContext?.context ? `Contexto de negocio: ${selectedContext.context}.` : '',
    selectedGoal?.context ? `Objetivo principal: ${selectedGoal.context}.` : '',
    selectedAssistant?.context ? `Asistente preferente: ${selectedAssistant.context}.` : '',
  ].filter(Boolean);

  if (!contextLines.length) return cleanPrompt;

  return [
    cleanPrompt,
    '',
    'Contexto seleccionado en Resumen:',
    ...contextLines.map((line) => `- ${line}`),
  ].join('\n');
};

const CompactDropUp = ({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  openMenu,
  setOpenMenu,
}) => {
  const menuRef = useRef(null);
  const isOpen = openMenu === id;
  const selectedOption =
    options.find((item) => item.id === value) ||
    options[0];

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpenMenu]);

  return (
    <div ref={menuRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setOpenMenu(isOpen ? null : id)}
        className={`inline-flex h-8 min-w-[116px] items-center justify-between gap-3 rounded-full border px-3 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition ${
          isOpen
            ? 'border-black/25 bg-white/55 text-black'
            : 'border-black/10 bg-white/35 text-black/75 hover:bg-white/50 hover:text-black'
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <span className="text-[10px] text-black/45">
          ▴
        </span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-[220px] overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br from-[#FFE4A3] via-[#FFD2A1] to-[#F28BA5] p-1.5 text-black shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
          <div className="max-h-[235px] overflow-auto pr-1">
            {options.map((item) => {
              const isActive = item.id === value;

              return (
                <button
                  key={item.id || `empty-${item.label}`}
                  type="button"
                  onClick={() => {
                    onChange(item.id);
                    setOpenMenu(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-black/75 hover:bg-white/35 hover:text-black'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-3 text-xs">
                      ●
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardBuilderLauncher = ({ user }) => {
  const navigate = useNavigate();

  const [activeMode, setActiveMode] = useState('landing');
  const [selectedContextId, setSelectedContextId] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState('master');
  const [openMenu, setOpenMenu] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const selectedMode = useMemo(
    () => MODES.find((item) => item.id === activeMode) || MODES[0],
    [activeMode]
  );

  const selectedContext = useMemo(
    () => PROJECT_CONTEXTS.find((item) => item.id === selectedContextId) || null,
    [selectedContextId]
  );

  const selectedGoal = useMemo(
    () => PROJECT_GOALS.find((item) => item.id === selectedGoalId) || null,
    [selectedGoalId]
  );

  const selectedAssistant = useMemo(
    () => ASSISTANTS.find((item) => item.id === selectedAssistantId) || ASSISTANTS[0],
    [selectedAssistantId]
  );

  const firstName = getUserFirstName(user);

  const projectLabel = user?.name
    ? `${user.name} Project`
    : user?.email
      ? user.email
      : 'Proyecto actual';

  const submitToBuilder = async () => {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      setError('Describe una idea, pega una URL o escribe qué quieres construir.');
      return;
    }

    const launchPrompt = buildLaunchPrompt({
      prompt: cleanPrompt,
      selectedMode,
      selectedContext,
      selectedGoal,
      selectedAssistant,
    });

    setError('');
    setCreating(true);

    try {
      const response = await axios.post(
        `${API_URL}/projects`,
        {
          input_type: selectedMode.inputType,
          input_content: launchPrompt,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );

      const project = response.data;

      if (!project?.project_id) {
        throw new Error('El backend no devolvió project_id.');
      }

      toast.success('Proyecto creado. Abriendo Builder.');

      navigate(`/dashboard/builder?project_id=${project.project_id}`, {
        state: {
          projectId: project.project_id,
          initialPrompt: launchPrompt,
          initialMode: activeMode,
          launchContext: {
            mode: selectedMode?.label || '',
            context: selectedContext?.label || '',
            goal: selectedGoal?.label || '',
            assistant: selectedAssistant?.label || '',
          },
          source: 'dashboard-launch-console',
        },
      });
    } catch (requestError) {
      const message = getErrorMessage(requestError);

      setError(message);
      toast.error('Error al abrir Builder');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !creating) {
      event.preventDefault();
      submitToBuilder();
    }
  };

  const applyStarter = () => {
    setPrompt(selectedMode.starter);
    setError('');
  };

  return (
    <section className="relative isolate overflow-hidden px-4 py-2 md:px-6 md:py-3">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 rounded-full bg-cyan-300/5 blur-3xl" />
        <div className="absolute bottom-5 left-1/2 h-40 w-40 -translate-x-[125%] rounded-full bg-amber-300/7 blur-3xl" />
        <div className="absolute bottom-5 left-1/2 h-40 w-40 translate-x-[45%] rounded-full bg-pink-400/6 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-[960px] flex-col items-center text-center">
        <button
          type="button"
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold text-zinc-300 shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition hover:border-cyan-300/25 hover:text-white"
          title={projectLabel}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.65)]" />
          <span className="truncate">{projectLabel}</span>
          <span className="text-zinc-600">▾</span>
        </button>

        <div className="mt-3 max-w-[760px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100/70">
            Launch Console
          </p>

          <p className="mt-2 text-sm font-medium text-zinc-400 md:text-base">
            {firstName ? `Qué tal, ${firstName}.` : 'Bienvenido a Sistema Maestro.'}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.055em] text-white md:text-4xl">
            ¿Qué tienes en mente hoy?
          </h1>
        </div>

        <div className="mt-4 w-full max-w-[880px]">
          <div className="relative z-10 -mb-px flex max-w-full items-end gap-1 overflow-x-auto px-3">
            {MODES.map((mode) => {
              const isActive = mode.id === activeMode;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setActiveMode(mode.id);
                    setError('');
                    setOpenMenu(null);
                  }}
                  className={`shrink-0 rounded-t-2xl border border-b-0 px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'border-amber-100/65 bg-gradient-to-r from-[#FFE4A3] via-[#FFD2A1] to-[#F28BA5] text-black shadow-[0_-8px_24px_rgba(251,191,36,0.10)]'
                      : 'border-white/[0.075] bg-[#0B0C0E]/90 text-zinc-500 hover:border-amber-100/25 hover:bg-[#111214] hover:text-amber-100'
                  }`}
                  title={mode.label}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-[30px] border border-amber-100/35 bg-gradient-to-br from-[#FFE4A3] via-[#FFD2A1] to-[#F28BA5] p-3 text-left text-black shadow-[0_26px_90px_rgba(0,0,0,0.30)]">
            <textarea
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (error) setError('');
              }}
              onFocus={() => setOpenMenu(null)}
              onKeyDown={handleKeyDown}
              placeholder={selectedMode.placeholder}
              rows={3}
              disabled={creating}
              className="min-h-[104px] w-full resize-none rounded-[24px] border border-white/10 bg-[#060708] px-5 py-4 text-left text-base leading-7 text-white placeholder:text-zinc-600 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition focus:border-amber-100/25 focus:bg-[#070809] disabled:opacity-60 md:min-h-[112px] md:text-lg"
            />

            <div className="mt-3 flex flex-col gap-3 border-t border-black/10 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenMenu(null)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/35 text-sm font-semibold text-black/70 transition hover:bg-white/50 hover:text-black"
                    title="Adjuntar contexto"
                  >
                    ＋
                  </button>

                  <CompactDropUp
                    id="service"
                    value={selectedContextId}
                    options={PROJECT_CONTEXTS}
                    onChange={(value) => {
                      setSelectedContextId(value);
                      setError('');
                    }}
                    ariaLabel="Seleccionar servicio"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                  />

                  <CompactDropUp
                    id="goal"
                    value={selectedGoalId}
                    options={PROJECT_GOALS}
                    onChange={(value) => {
                      setSelectedGoalId(value);
                      setError('');
                    }}
                    ariaLabel="Seleccionar objetivo"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                  />

                  <CompactDropUp
                    id="assistant"
                    value={selectedAssistantId}
                    options={ASSISTANTS}
                    onChange={(value) => {
                      setSelectedAssistantId(value);
                      setError('');
                    }}
                    ariaLabel="Seleccionar asistente"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                  />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={applyStarter}
                    disabled={creating}
                    className="inline-flex h-8 items-center justify-center rounded-full border border-black/10 bg-black/10 px-3 text-xs font-semibold text-black transition hover:bg-black/15 disabled:opacity-50"
                  >
                    Inspirarme
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenMenu(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-black/10 text-xs text-black transition hover:bg-black/15"
                    title="Voz"
                  >
                    ◌
                  </button>

                  <button
                    type="button"
                    onClick={submitToBuilder}
                    disabled={creating}
                    className="inline-flex h-8 items-center justify-center rounded-full border border-black/15 bg-black px-4 text-xs font-semibold text-white transition hover:scale-[1.01] hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating ? 'Creando...' : 'Crear →'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-center text-sm font-semibold text-red-950">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/billing')}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/[0.05] px-4 py-2 text-xs font-semibold text-amber-100 transition hover:border-amber-200/35 hover:bg-amber-200/[0.08]"
        >
          Gema Maestra · bonus de créditos →
        </button>
      </div>
    </section>
  );
};

export default DashboardBuilderLauncher;
import { PACE_COST, gemNoticeState } from '../builder/studio/model';

// Same key the builder writes when a project is open.
export const ACTIVE_PROJECT_STORAGE_KEY = 'sistema_maestro.active_builder_project_id';

export const LAUNCHER_MODES = [
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
];

// Visible tabs. Web/App and Automatización stay in LAUNCHER_MODES and are not tabs.
export const DASHBOARD_TABS = [
  {
    id: 'landing',
    modeId: 'landing',
    label: 'Crear mi web',
    placeholder: 'Describe tu negocio, a quién vendes y qué quieres que hagan tus clientes…',
  },
  {
    id: 'url',
    modeId: 'url',
    label: 'Mejorar mi web',
    placeholder: 'Pega la URL de tu web y dime qué quieres mejorar…',
  },
  {
    id: 'install',
    modeId: null,
    label: 'Instalar agente',
    placeholder: 'tunegocio.com',
  },
];

export const PROJECT_CONTEXTS = [
  { id: '', label: 'Servicio', context: '' },
  { id: 'restaurant', label: 'Restaurante', context: 'restaurante u hostelería: carta, fotos, reseñas y ubicación' },
  { id: 'clinic', label: 'Clínica', context: 'clínica o salud: servicios, confianza, reseñas y contacto' },
  { id: 'agency', label: 'Agencia', context: 'agencia o consultoría: servicios, autoridad, casos, llamada comercial y captación' },
  { id: 'realestate', label: 'Inmobiliaria', context: 'inmobiliaria: propiedades, valoración, leads, visitas y confianza' },
  { id: 'architecture', label: 'Arquitectura', context: 'arquitectura o estudio creativo: portfolio, proyectos, método, autoridad y contacto' },
  { id: 'ecommerce', label: 'Ecommerce', context: 'ecommerce: producto, oferta, reseñas, garantías, envíos y compra' },
  { id: 'saas', label: 'SaaS', context: 'SaaS o herramienta digital: demo, features, onboarding, prueba social y activación' },
  { id: 'local', label: 'Servicio local', context: 'servicio local: zona, confianza, reseñas y contacto' },
  { id: 'education', label: 'Educación', context: 'educación o formación: alumnos, programa, autoridad, prueba social y matrícula' },
  { id: 'foodshop', label: 'Frutería / tienda', context: 'tienda local o alimentación: productos, pedidos, reparto, confianza y contacto directo' },
  { id: 'other', label: 'Otro servicio', context: 'servicio personalizado: definir cliente objetivo, oferta, confianza y acción principal' },
];

export const PROJECT_GOALS = [
  { id: '', label: 'Objetivo', context: '' },
  { id: 'reservations', label: 'Reservas', context: 'conseguir reservas o solicitudes directas' },
  { id: 'leads', label: 'Leads', context: 'captar leads cualificados' },
  { id: 'sales', label: 'Ventas', context: 'aumentar ventas y reducir fricción de compra' },
  { id: 'automation', label: 'Menos trabajo manual', context: 'reducir trabajo manual en el borrador' },
  { id: 'redesign', label: 'Rediseño', context: 'rediseñar una experiencia existente para hacerla más premium y efectiva' },
  { id: 'budget', label: 'Presupuestos', context: 'conseguir solicitudes de presupuesto con más calidad' },
  { id: 'calls', label: 'Llamadas', context: 'conseguir llamadas comerciales o diagnósticos cualificados' },
];

const QUICK_START_IDS = ['restaurant', 'clinic', 'realestate', 'ecommerce', 'local', 'education'];

export const SECTOR_QUICK_STARTS = QUICK_START_IDS.map((id) =>
  PROJECT_CONTEXTS.find((item) => item.id === id)
).filter(Boolean);

const MODE_BY_INCOMING = {
  landing: 'landing',
  sell: 'landing',
  sell_and_charge: 'landing',
  idea: 'landing',
  idea_to_project: 'landing',
  text: 'landing',
  web: 'webapp',
  app: 'webapp',
  webapp: 'webapp',
  dashboard: 'webapp',
  automate: 'automation',
  automation: 'automation',
  automate_operation: 'automation',
  url: 'url',
  improve: 'url',
  improve_existing: 'url',
};

export function launcherModeById(id) {
  return LAUNCHER_MODES.find((mode) => mode.id === id) || LAUNCHER_MODES[0];
}

export function dashboardTabById(id) {
  return DASHBOARD_TABS.find((tab) => tab.id === id) || DASHBOARD_TABS[0];
}

export function dashboardTabForMode(modeId) {
  if (modeId === 'url') return dashboardTabById('url');
  if (modeId === 'install') return dashboardTabById('install');
  return dashboardTabById('landing');
}

export function embedOriginFromHost(raw) {
  const host = String(raw || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .trim();
  if (!host) return '';
  return `https://${host}`;
}

export function resolveLauncherMode(launcherState = null) {
  const raw = String(
    launcherState?.initialMode ||
      launcherState?.launchContext?.route ||
      launcherState?.inputType ||
      ''
  ).toLowerCase();

  return MODE_BY_INCOMING[raw] || 'landing';
}

export function buildLaunchPrompt({
  prompt,
  selectedMode,
  selectedContext,
  selectedGoal,
}) {
  const cleanPrompt = prompt.trim();
  const contextText = selectedContext?.context || '';
  const contextLines = [
    selectedMode?.label ? `Tipo de proyecto: ${selectedMode.label}.` : '',
    contextText && !cleanPrompt.includes(contextText)
      ? `Contexto de negocio: ${contextText}.`
      : '',
    selectedGoal?.context ? `Objetivo principal: ${selectedGoal.context}.` : '',
  ].filter(Boolean);

  if (!contextLines.length) return cleanPrompt;

  return [
    cleanPrompt,
    '',
    'Contexto seleccionado en Resumen:',
    ...contextLines.map((line) => `- ${line}`),
  ].join('\n');
}

export function dashboardSendLabel(tabId = 'landing', freeTestMode = false) {
  if (tabId === 'install') return 'Instalar agente';
  if (freeTestMode) return gemNoticeState({ freeTestMode: true }).text;
  const label = tabId === 'url' ? 'Mejorar mi web' : 'Crear mi web';
  return `${label} ◆ ${PACE_COST.rapido}`;
}

export function readStoredActiveProjectId() {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function resolveActiveProject(projects = []) {
  const stored = readStoredActiveProjectId();
  if (stored) {
    const match = projects.find((project) => project.project_id === stored);
    if (match) return match;
  }
  return projects[0] || null;
}

function finiteGemCount(value) {
  if (value == null || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.trunc(amount);
}

// /api/user/billing returns balance, not available_credits.
export function gemBalanceFromBilling(payload) {
  const summary =
    payload?.credit_summary && typeof payload.credit_summary === 'object'
      ? payload.credit_summary
      : payload;

  if (!summary || typeof summary !== 'object') return null;

  if (Object.prototype.hasOwnProperty.call(summary, 'balance')) {
    return finiteGemCount(summary.balance);
  }

  return finiteGemCount(summary.available_credits);
}

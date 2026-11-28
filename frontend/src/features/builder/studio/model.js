// Display costs from backend/config/credits/tier_amounts.json standard T1 and T2.
// The preview request sends a pace. The ledger is not asked to change.
export const PACE_COST = {
  rapido: 1,
  profundo: 3,
};

export const PACE_OPTIONS = [
  { id: 'rapido', label: 'Modo rápido', cost: PACE_COST.rapido },
  { id: 'profundo', label: 'Modo profundo', cost: PACE_COST.profundo },
];

export const EVAL_THRESHOLD = 12;
export const EVAL_MAX = 20;
export const EVALUATION_MISS = 'La versión no ha superado la evaluación (12/20). No se ha publicado.';
export const PUBLISH_SCORE_REASON = 'Necesita 12/20 en Evaluación';

export function paceOption(pace) {
  return PACE_OPTIONS.find((item) => item.id === pace) || PACE_OPTIONS[0];
}

export function paceLabel(pace) {
  const option = paceOption(pace);
  const unit = option.cost === 1 ? 'gema' : 'gemas';
  return `${option.label} · ${option.cost} ${unit}`;
}

export function readEvaluation(preview) {
  const raw = preview?.evaluation;
  if (!raw || !Number.isInteger(raw.total)) return null;
  return {
    total: raw.total,
    max: EVAL_MAX,
    threshold: EVAL_THRESHOLD,
    passed: raw.passed === true && raw.total >= EVAL_THRESHOLD,
    scores: raw.scores && typeof raw.scores === 'object' ? raw.scores : null,
  };
}

export function publishGate(evaluation, { publishEnabled = false, busy = false } = {}) {
  if (!publishEnabled) return { enabled: false, reason: 'La publicación no está disponible.' };
  if (busy) return { enabled: false, reason: 'Espera a que termine la versión en curso.' };
  if (!evaluation?.passed) return { enabled: false, reason: EVALUATION_MISS };
  return { enabled: true, reason: '' };
}

export function livePublishState({ allowed = false, evaluation = null, busy = false } = {}) {
  if (!allowed) return { visible: false, enabled: false, reason: '' };
  if (!evaluation?.passed || evaluation.total < EVAL_THRESHOLD) {
    return { visible: true, enabled: false, reason: PUBLISH_SCORE_REASON };
  }
  if (busy) return { visible: true, enabled: false, reason: 'Espera a que termine la versión en curso.' };
  return { visible: true, enabled: true, reason: '' };
}

export function gemNoticeState({ balance = 0, freeTestMode = false, pace = 'rapido' } = {}) {
  if (freeTestMode) return { tone: 'test', text: 'Modo prueba · sin gemas' };
  const amount = Number.isFinite(Number(balance)) ? Math.trunc(Number(balance)) : 0;
  if (amount <= 0) return { tone: 'exhausted', text: 'Has agotado tus gemas' };
  const cost = paceOption(pace).cost;
  if (amount < cost || amount < PACE_COST.profundo) return { tone: 'low', text: `Te quedan ${amount} gemas` };
  return { tone: 'normal', text: `Te quedan ${amount} gemas` };
}

function analysisDone(project) {
  const summary = String(project?.diagnosis?.summary || '').trim();
  return Boolean(summary && summary !== 'Sin resumen disponible.');
}

export function mapBuilderSteps({
  project = null,
  preview = null,
  evaluation = null,
  publication = null,
} = {}) {
  const idea = Boolean(project?.project_id && (project.input_content || project.title || project.project_id));
  const analysis = analysisDone(project);
  const built = Boolean(preview?.html);
  const scored = Boolean(evaluation && Number.isInteger(evaluation.total));
  const evalLabel = scored ? `Evaluación ${evaluation.total}/${EVAL_MAX}` : 'Evaluación';
  const published = publication?.status === 'published';
  const domain = Boolean(publication?.customDomain?.status === 'verified' || publication?.customDomain?.host);
  const steps = [
    { id: 'idea', label: 'Idea', done: idea },
    { id: 'analisis', label: 'Análisis', done: analysis },
    { id: 'construccion', label: 'Construcción', done: built },
    { id: 'evaluacion', label: evalLabel, done: Boolean(evaluation?.passed) && evaluation.total >= EVAL_THRESHOLD },
    { id: 'publicar', label: 'Publicar', done: published },
    { id: 'dominio', label: 'Dominio', done: domain },
    { id: 'envivo', label: 'En vivo', done: published },
  ];
  const current = steps.find((step) => !step.done)?.id || '';
  return steps.map((step) => ({
    ...step,
    current: step.id === current,
    pending: !step.done && step.id !== current,
  }));
}

export function derivePreviewPhase({
  resuming = false,
  failed = false,
  busy = false,
  html = '',
} = {}) {
  if (resuming) return 'resuming';
  if (failed) return 'error';
  if (busy) return 'live';
  if (html) return 'static';
  return 'idle';
}

const STEP_ICON = 16;

export function estimateStepRow(labels, fontSize) {
  return labels.reduce(
    (sum, label) => sum + STEP_ICON + String(label).length * fontSize * 0.48,
    24,
  );
}

export function fitStepLabels(steps, width) {
  const labels = steps.map((step) => step.label);
  if (!width) return { font: 11 };
  for (const font of [11, 10, 9, 8, 7]) {
    if (estimateStepRow(labels, font) <= width) return { font };
  }
  return { font: 7 };
}

export function narrateSteps(steps) {
  return (steps || []).map((step, index) => {
    const summary = step.summary ? ` — ${step.summary}` : '';
    const mark = step.status === 'in_progress' ? '…' : step.status === 'error' ? ' (error)' : '';
    return `${index + 1}. **${step.label || step.id || 'Paso'}**${mark}${summary}`;
  }).join('\n');
}

export function finishedStamp(iso) {
  const date = new Date(iso || '');
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

export function versionRows(versions, htmlByVersion) {
  return (versions || []).map((item) => ({
    version: item.version,
    instruction: item.instruction || '',
    createdAt: item.createdAt || '',
    canRestore: Boolean(htmlByVersion && htmlByVersion[item.version]),
  }));
}

const PHASE_LABEL = {
  idle: 'Listo',
  construyendo: 'Construyendo',
  iterando: 'Iterando',
  error: 'Error',
  completado: 'Completado',
};

export function executorStatusText(phase, message) {
  const label = PHASE_LABEL[phase] || phase || 'Listo';
  const detail = message || 'El ejecutor está listo.';
  return `${label}. ${detail}`;
}

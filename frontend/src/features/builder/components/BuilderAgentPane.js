import React, { useMemo, useState } from 'react';

import {
  BUILDER_CODE_TABS,
  getBuilderCodeLines,
  getVisibleCodeLines,
} from '../utils/builderCodeTemplates';

const getBuilderIntelligenceParts = (builderIntelligence = {}) => {
  const hubSummary = builderIntelligence?.hubSummary || {};
  const lastDelta = builderIntelligence?.lastDelta || {};
  const lastOperation = builderIntelligence?.lastOperation || {};
  const lifecycle =
    builderIntelligence?.lifecycle ||
    hubSummary?.lifecycle ||
    lastOperation?.lifecycle ||
    {};

  return {
    hubSummary,
    lastDelta,
    lastOperation,
    lifecycle,
  };
};

const normalizeActionLabel = (value = '') =>
  String(value || '')
    .replace(/^\s*[A-D][).:-]\s*/i, '')
    .trim();

const isLifecycleDecisionMessage = (message = {}) =>
  message?.role === 'decision' &&
  Array.isArray(message.options) &&
  (
    message?.meta?.source === 'builder_lifecycle' ||
    message.options.some((option) =>
      option?.source === 'builder_lifecycle' ||
      option?.lifecycleActionId
    )
  );

const normalizeDecisionOption = (option, index, decisionMessage = {}) => {
  if (!option) return null;

  if (typeof option === 'string') {
    const value = normalizeActionLabel(option);

    return {
      id: `lifecycle-decision-${index}`,
      label: value,
      prompt: value,
      source: 'builder_lifecycle',
      lifecycleActionId: '',
      lifecycleStageId: decisionMessage?.meta?.targetStageId || '',
      creditTier: 'none',
      expectedPreviewDelta: [],
      expectedCodeDelta: [],
      expectedStructureDelta: [],
      onDecision: decisionMessage?.onDecision,
    };
  }

  const label = normalizeActionLabel(
    option.label ||
      option.title ||
      option.prompt
  );

  const prompt = normalizeActionLabel(
    option.prompt ||
      option.label ||
      option.title
  );

  if (!label && !prompt) return null;

  return {
    id: option.id || option.lifecycleActionId || `lifecycle-decision-${index}`,
    label: label || prompt,
    prompt: prompt || label,
    source: option.source || 'builder_lifecycle',
    lifecycleActionId: option.lifecycleActionId || option.id || '',
    lifecycleStageId:
      option.lifecycleStageId ||
      decisionMessage?.meta?.targetStageId ||
      '',
    creditTier: option.creditTier || 'none',
    scoreGain: option.scoreGain || 0,
    expectedPreviewDelta: option.expectedPreviewDelta || [],
    expectedCodeDelta: option.expectedCodeDelta || [],
    expectedStructureDelta: option.expectedStructureDelta || [],
    onDecision: option.onDecision || decisionMessage?.onDecision,
  };
};

const getStatusTone = (status = '') => {
  const normalized = String(status || '').toLowerCase();

  if (
    normalized.includes('error') ||
    normalized.includes('fall') ||
    normalized.includes('necesito')
  ) {
    return 'error';
  }

  if (
    normalized.includes('constru') ||
    normalized.includes('aplic') ||
    normalized.includes('gener') ||
    normalized.includes('sincron')
  ) {
    return 'working';
  }

  if (
    normalized.includes('esperando') ||
    normalized.includes('respuesta') ||
    normalized.includes('listo')
  ) {
    return 'waiting';
  }

  return 'active';
};

const buildSuggestedActions = ({
  messages = [],
} = {}) => {
  const decisionMessage = [...messages]
    .reverse()
    .find(isLifecycleDecisionMessage);

  if (!decisionMessage?.options?.length) {
    return [];
  }

  return decisionMessage.options
    .slice(0, 3)
    .map((option, index) =>
      normalizeDecisionOption(option, index, decisionMessage)
    )
    .filter(Boolean)
    .filter((item) =>
      item.source === 'builder_lifecycle' ||
      item.lifecycleActionId
    );
};

const formatCreditTier = (creditTier = 'none') => {
  const normalized = String(creditTier || 'none').toLowerCase();

  const labels = {
    none: 'sin coste',
    low: 'bajo',
    medium: 'medio',
    high: 'alto',
    premium: 'premium',
  };

  return labels[normalized] || normalized;
};

const AGENT_ACTIONS = [
  {
    id: 'cro',
    label: 'CRO',
    title: 'Optimizar conversion',
    prompt:
      'Mejora la conversion visible del proyecto manteniendo el recorrido actual del Builder.',
    dotClassName: 'bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.65)]',
    ringClassName:
      'border-emerald-300/25 hover:border-emerald-300/50 hover:bg-emerald-300/[0.08]',
  },
  {
    id: 'copy',
    label: 'COPY',
    title: 'Mejorar copy',
    prompt:
      'Mejora promesa, claridad, tono y textos accionables dentro del recorrido actual del Builder.',
    dotClassName: 'bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.65)]',
    ringClassName:
      'border-cyan-300/25 hover:border-cyan-300/50 hover:bg-cyan-300/[0.08]',
  },
  {
    id: 'visual',
    label: 'VISUAL',
    title: 'Elevar diseno',
    prompt:
      'Eleva la interfaz con mas jerarquia, contraste, aire y sensacion premium sin romper el recorrido actual.',
    dotClassName: 'bg-fuchsia-300 shadow-[0_0_14px_rgba(240,171,252,0.65)]',
    ringClassName:
      'border-fuchsia-300/25 hover:border-fuchsia-300/50 hover:bg-fuchsia-300/[0.08]',
  },
  {
    id: 'trust',
    label: 'TRUST',
    title: 'Reforzar confianza',
    prompt:
      'Refuerza confianza, autoridad, prueba social y objeciones resueltas dentro del recorrido actual.',
    dotClassName: 'bg-orange-300 shadow-[0_0_14px_rgba(253,186,116,0.65)]',
    ringClassName:
      'border-orange-300/25 hover:border-orange-300/50 hover:bg-orange-300/[0.08]',
  },
  {
    id: 'seo',
    label: 'SEO',
    title: 'Mejorar SEO',
    prompt:
      'Mejora estructura, titulos, semantica y texto para busqueda organica sin salir del recorrido actual.',
    dotClassName: 'bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.65)]',
    ringClassName:
      'border-sky-300/25 hover:border-sky-300/50 hover:bg-sky-300/[0.08]',
  },
];

const AgentRail = ({ onSelectPrompt }) => (
  <div className="pointer-events-auto absolute left-2 top-[58px] z-20 flex flex-col items-center gap-2">
    {AGENT_ACTIONS.map((agent) => (
      <button
        key={agent.id}
        type="button"
        onClick={() => onSelectPrompt?.(agent.prompt)}
        className={`group grid h-7 w-7 place-items-center rounded-full border bg-black/60 backdrop-blur transition ${agent.ringClassName}`}
        title={`${agent.label} - ${agent.title}`}
        aria-label={`${agent.label} - ${agent.title}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${agent.dotClassName}`} />
      </button>
    ))}
  </div>
);

const AgentCapsule = ({
  status,
  progress,
}) => {
  const safeStatus = status || 'Agente preparado';
  const tone = getStatusTone(safeStatus);
  const progressLabel =
    typeof progress === 'number'
      ? `${Math.max(0, Math.min(100, Math.round(progress)))}%`
      : 'Activo';

  const toneClasses = {
    active: 'border-cyan-300/18 bg-cyan-300/[0.045] text-cyan-100',
    working: 'border-emerald-300/20 bg-emerald-300/[0.055] text-emerald-100',
    waiting: 'border-emerald-300/20 bg-emerald-300/[0.055] text-emerald-100',
    error: 'border-red-300/20 bg-red-300/[0.055] text-red-100',
  };

  const dotClasses = {
    active: 'bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.65)]',
    working: 'bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.65)]',
    waiting: 'bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.65)]',
    error: 'bg-red-300 shadow-[0_0_14px_rgba(252,165,165,0.65)]',
  };

  return (
    <div className={`flex h-[40px] shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] px-4 ${toneClasses[tone]}`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full animate-pulse ${dotClasses[tone]}`} />

        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em]">
          {safeStatus}
        </p>
      </div>

      <span className="shrink-0 rounded-full border border-white/[0.08] bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
        {progressLabel}
      </span>
    </div>
  );
};

const InlineSuggestionRows = ({
  actions = [],
  onSelectAction,
}) => {
  if (!actions.length) return null;

  return (
    <div className="mt-5 border-t border-white/[0.08] pt-4">
      <div className="grid grid-cols-[38px_1fr] gap-3">
        <span className="select-none text-right text-zinc-700">
          //
        </span>

        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-100">
          Siguientes mejoras
        </span>
      </div>

      {actions.slice(0, 3).map((action, index) => (
        <button
          key={action.id || `${action.label}-${index}`}
          type="button"
          onClick={() => onSelectAction?.(action)}
          className="group mt-1 grid w-full grid-cols-[38px_1fr] gap-3 rounded-lg py-0.5 text-left transition hover:bg-cyan-300/[0.045]"
        >
          <span className="select-none text-right text-zinc-700">
            {index + 1}.
          </span>

          <span className="min-w-0">
            <span className="block truncate text-[13px] leading-7 text-cyan-100 transition group-hover:text-white">
              {action.label}
            </span>

            {action.creditTier && action.creditTier !== 'none' && (
              <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                Coste {formatCreditTier(action.creditTier)}
                {action.scoreGain ? ` · +${action.scoreGain} madurez` : ''}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

const CodeTopBar = ({
  activeCodeTab,
  onCodeTabChange,
}) => (
  <div className="flex h-[46px] shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-[#020405] px-4">
    <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
      Codigo en construccion
    </p>

    <div className="flex flex-wrap justify-end gap-1.5">
      {BUILDER_CODE_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onCodeTabChange?.(tab.id)}
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
            activeCodeTab === tab.id
              ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100'
              : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

const CodeWorkbench = ({
  copy,
  project,
  progress,
  activeCodeTab,
  onCodeTabChange,
  intent = {},
  visualState = {},
  suggestedActions = [],
  onSelectAction,
}) => {
  const lines = useMemo(
    () =>
      getBuilderCodeLines({
        tab: activeCodeTab,
        copy,
        project,
        intent,
        visualState,
      }),
    [
      activeCodeTab,
      copy,
      project,
      intent,
      visualState,
    ]
  );

  const visibleLines = useMemo(
    () => getVisibleCodeLines(lines, progress),
    [
      lines,
      progress,
    ]
  );

  const showSuggestions = progress >= 96 && suggestedActions.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#020405] font-mono">
      <CodeTopBar
        activeCodeTab={activeCodeTab}
        onCodeTabChange={onCodeTabChange}
      />

      <div className="min-h-0 flex-1 overflow-auto p-4 pl-5 text-[13px] leading-7 text-zinc-300">
        {visibleLines.map((line, index) => {
          const normalizedLine = String(line || '');

          return (
            <div
              key={`${normalizedLine}-${index}`}
              className="grid grid-cols-[38px_1fr] gap-3"
            >
              <span className="select-none text-right text-zinc-700">
                {index + 1}
              </span>

              <span
                className={
                  normalizedLine.includes('button') ||
                  normalizedLine.includes('h1') ||
                  normalizedLine.includes('CTA') ||
                  normalizedLine.includes('primary')
                    ? 'text-cyan-200'
                    : normalizedLine.includes('const') ||
                        normalizedLine.includes('export') ||
                        normalizedLine.includes('def ') ||
                        normalizedLine.includes('class ')
                      ? 'text-emerald-200'
                      : normalizedLine.includes('{') ||
                          normalizedLine.includes('}') ||
                          normalizedLine.includes('<') ||
                          normalizedLine.includes('/>')
                        ? 'text-amber-100'
                        : normalizedLine.includes('"') ||
                            normalizedLine.includes("'")
                          ? 'text-zinc-100'
                          : 'text-zinc-300'
                }
              >
                {normalizedLine || ' '}
              </span>
            </div>
          );
        })}

        {progress < 100 && (
          <div className="grid grid-cols-[38px_1fr] gap-3">
            <span className="select-none text-right text-zinc-700">
              {visibleLines.length + 1}
            </span>

            <span className="text-cyan-300">
              <span className="inline-block h-4 w-[7px] translate-y-[2px] bg-cyan-300 animate-pulse" />
            </span>
          </div>
        )}

        {showSuggestions && (
          <InlineSuggestionRows
            actions={suggestedActions}
            onSelectAction={onSelectAction}
          />
        )}
      </div>
    </div>
  );
};

const ControlDock = ({
  draft,
  setDraft,
  onSubmit,
  onStartBuild,
  onKeyDown,
  canSubmit,
  canStartBuild,
  progress,
}) => (
  <div className="shrink-0 border-t border-white/[0.08] bg-black/45 p-3">
    <div className="rounded-[20px] border border-white/10 bg-[#020405] p-3 shadow-[0_-18px_45px_rgba(0,0,0,0.20)]">
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe un cambio: CTA, color, seccion, fotos, tono, version..."
          className="min-h-[52px] flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm leading-5 text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-300/30 focus:bg-cyan-300/[0.035]"
        />

        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className={`inline-flex h-[52px] min-w-[132px] shrink-0 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition ${
            canSubmit
              ? 'border-emerald-200/70 bg-gradient-to-r from-emerald-200 via-cyan-100 to-amber-100 text-black shadow-[0_0_28px_rgba(52,211,153,0.12)] hover:scale-[1.01]'
              : 'border-emerald-200/15 bg-emerald-200/[0.045] text-emerald-100/45'
          }`}
        >
          Aplicar cambio
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-2">
        <p className="min-w-0 truncate text-[11px] text-zinc-500">
          Iteracion estimada <span className="font-semibold text-zinc-300">8-18 creditos</span>
        </p>

        <button
          type="button"
          disabled={!canStartBuild}
          onClick={() => onStartBuild?.()}
          className={`inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${
            canStartBuild
              ? 'border-white/12 bg-white/[0.045] text-zinc-200 hover:bg-white/[0.08]'
              : 'cursor-not-allowed border-white/10 bg-white/[0.02] text-zinc-600'
          }`}
        >
          {progress >= 100 ? 'Regenerar' : 'Construir'}
        </button>
      </div>
    </div>
  </div>
);

export default function BuilderAgentPane({
  project,
  copy,
  progress,
  activeCodeTab,
  onCodeTabChange,
  messages = [],
  agentStatus = 'Agente preparado',
  onSubmitMessage,
  onStartBuild,
  builderIntelligence = null,
}) {
  const [draft, setDraft] = useState('');

  const {
    hubSummary,
    lastDelta,
  } = getBuilderIntelligenceParts(builderIntelligence);

  const suggestedActions = useMemo(
    () =>
      buildSuggestedActions({
        messages,
      }),
    [
      messages,
    ]
  );

  const canSubmit =
    draft.trim().length > 0 &&
    typeof onSubmitMessage === 'function';

  const canStartBuild = typeof onStartBuild === 'function';

  const submitPrompt = (prompt) => {
    const value = normalizeActionLabel(prompt);

    if (!value || typeof onSubmitMessage !== 'function') return;

    onSubmitMessage(value);
  };

  const submit = () => {
    const value = draft.trim();

    if (!value || typeof onSubmitMessage !== 'function') return;

    onSubmitMessage(value);
    setDraft('');
  };

  const submitSuggestedAction = (action) => {
    const prompt = normalizeActionLabel(action?.prompt || action?.label);

    if (!prompt) return;

    if (typeof action?.onDecision === 'function') {
      action.onDecision(prompt);
      return;
    }

    submitPrompt(prompt);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#050709]">
      <AgentRail onSelectPrompt={submitPrompt} />

      <div className="min-h-0 flex-1 pl-8">
        <CodeWorkbench
          copy={copy}
          project={project}
          progress={progress}
          activeCodeTab={activeCodeTab}
          onCodeTabChange={onCodeTabChange}
          intent={hubSummary}
          visualState={lastDelta?.visual || {}}
          suggestedActions={suggestedActions}
          onSelectAction={submitSuggestedAction}
        />
      </div>

      <AgentCapsule
        status={agentStatus}
        progress={progress}
      />

      <ControlDock
        draft={draft}
        setDraft={setDraft}
        onSubmit={submit}
        onStartBuild={onStartBuild}
        onKeyDown={handleKeyDown}
        canSubmit={canSubmit}
        canStartBuild={canStartBuild}
        progress={progress}
      />
    </div>
  );
}
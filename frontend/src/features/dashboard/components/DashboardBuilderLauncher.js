import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppWindow, Globe, LinkSimple, Microphone, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { api } from '../../../lib/apiClient';
import { economicPost } from '../../../lib/economicRequest';
import { useVoice } from '../../../hooks/useVoice';
import { builderEntryIsOpen } from '../../builder/builderAccess';
import { DASHBOARD_HEADLINE, DASHBOARD_SUBTITLE } from '../dashboardCopy';
import {
  DASHBOARD_TABS,
  PROJECT_CONTEXTS,
  SECTOR_QUICK_STARTS,
  buildLaunchPrompt,
  dashboardSendLabel,
  dashboardTabForMode,
  launcherModeById,
  resolveLauncherMode,
} from '../dashboardModel';
import DashboardProjectMenu from './DashboardProjectMenu';

const TAB_ICONS = {
  landing: Globe,
  webapp: AppWindow,
  url: LinkSimple,
};

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

const DashboardBuilderLauncher = ({ launcherState = null, user = null }) => {
  const navigate = useNavigate();
  const promptRef = useRef(null);
  const voice = useVoice();

  const [activeModeId, setActiveModeId] = useState(() => resolveLauncherMode(launcherState));
  const [selectedContextId, setSelectedContextId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const launcherHydrationKey = useMemo(() => {
    if (!launcherState || launcherState.focus !== 'builder-launcher') return '';

    return [
      launcherState.source || '',
      launcherState.initialPrompt || '',
      launcherState.initialMode || '',
      launcherState.inputType || '',
      launcherState.resetPrompt ? 'reset' : '',
      launcherState.launchContext?.opportunityId || '',
      launcherState.launchContext?.route || '',
    ].join('|');
  }, [launcherState]);

  useEffect(() => {
    if (!launcherState || launcherState.focus !== 'builder-launcher') return;

    if (launcherState.resetPrompt) {
      setPrompt('');
      setSelectedContextId('');
      setError('');
    }

    const incomingPrompt =
      typeof launcherState.initialPrompt === 'string'
        ? launcherState.initialPrompt.trim()
        : '';

    if (incomingPrompt) {
      setPrompt(incomingPrompt);
      setError('');
    }

    setActiveModeId(resolveLauncherMode(launcherState));
    promptRef.current?.focus({ preventScroll: true });
  }, [launcherState, launcherHydrationKey]);

  const activeMode = launcherModeById(activeModeId);
  const visibleTab = dashboardTabForMode(activeMode.id);
  const selectedContext = PROJECT_CONTEXTS.find((item) => item.id === selectedContextId) || null;
  const placeholder = visibleTab?.placeholder || activeMode.placeholder;
  const sendLabel = dashboardSendLabel();

  useEffect(() => {
    if (!voice.transcript) return;
    setPrompt(voice.transcript);
    setError('');
  }, [voice.transcript]);

  const startNewProject = () => {
    setPrompt('');
    setSelectedContextId('');
    setError('');
    setActiveModeId('landing');
    promptRef.current?.focus({ preventScroll: true });
  };

  const applySector = (sector) => {
    setSelectedContextId(sector.id);
    setPrompt(sector.context);
    setError('');
    promptRef.current?.focus({ preventScroll: true });
  };

  const submitToBuilder = async () => {
    setCreating(true);
    try {
      if (!(await builderEntryIsOpen(user))) {
        navigate('/dashboard/builder');
        return;
      }
    } catch {
      navigate('/dashboard/builder');
      return;
    } finally {
      setCreating(false);
    }

    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      setError('Describe una idea, pega una URL o escribe qué quieres construir.');
      return;
    }

    const launchPrompt = buildLaunchPrompt({
      prompt: cleanPrompt,
      selectedMode: activeMode,
      selectedContext,
      selectedGoal: null,
    });

    setError('');
    setCreating(true);

    try {
      const response = await economicPost(api, '/projects', {
        input_type: activeMode.inputType,
        input_content: launchPrompt,
      });

      const project = response.data;

      if (!project?.project_id) {
        throw new Error('El backend no devolvió project_id.');
      }

      toast.success('Proyecto creado. Abriendo Builder.');

      navigate(`/dashboard/builder?project_id=${project.project_id}`, {
        state: {
          projectId: project.project_id,
          initialPrompt: launchPrompt,
          initialMode: activeMode.id,
          launchContext: {
            mode: activeMode.label,
            context: selectedContext?.label || '',
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

  return (
    <section className="flex h-full min-h-0 w-full flex-col items-center justify-center">
      <DashboardProjectMenu onNewProject={startNewProject} />

      <div className="mt-4 max-w-[760px] px-2 text-center">
        <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.04em] text-white md:text-[2rem]">
          {DASHBOARD_HEADLINE}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[40rem] text-sm leading-5 text-zinc-400">
          {DASHBOARD_SUBTITLE}
        </p>
      </div>

      <div className="mt-3 flex flex-nowrap items-center justify-center gap-1">
        {DASHBOARD_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.modeId] || Globe;
          const isActive = tab.modeId === activeMode.id;

          return (
            <button
              key={tab.modeId}
              type="button"
              data-testid={`dashboard-tab-${tab.modeId}`}
              aria-pressed={isActive}
              onClick={() => {
                setActiveModeId(tab.modeId);
                setError('');
              }}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 w-full max-w-[760px]">
        <div className="relative rounded-[28px] border border-white/10 bg-[#0e0f12]">
          <textarea
            ref={promptRef}
            data-testid="dashboard-prompt"
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            disabled={creating}
            className="h-[120px] w-full resize-none rounded-[28px] bg-transparent px-5 pb-12 pt-4 text-[15px] leading-6 text-white outline-none placeholder:text-zinc-500 disabled:opacity-60"
          />

          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
            <button
              type="button"
              data-testid="dashboard-attach"
              aria-label="Adjuntar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="dashboard-mic"
                aria-label={voice.isListening ? 'Detener dictado' : 'Dictar'}
                aria-pressed={voice.isListening}
                disabled={!voice.isSupported || creating}
                onClick={() => (voice.isListening ? voice.stopListening() : voice.startListening())}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Microphone size={18} weight={voice.isListening ? 'fill' : 'regular'} aria-hidden="true" />
              </button>
              <button
                type="button"
                data-testid="dashboard-send"
                aria-label="Enviar"
                onClick={submitToBuilder}
                disabled={creating}
                className="inline-flex h-9 items-center rounded-full bg-white px-3 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendLabel}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-2 text-center text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-[10px] font-semibold tracking-[0.16em] text-zinc-500">
        EMPIEZA CON UNA PLANTILLA
      </p>
      <div
        data-testid="dashboard-sectors"
        className="mt-2 flex w-full max-w-[760px] flex-nowrap items-center justify-center gap-1.5"
      >
        {SECTOR_QUICK_STARTS.map((sector) => {
          const selected = sector.id === selectedContextId;
          return (
            <button
              key={sector.id}
              type="button"
              data-testid={`dashboard-sector-${sector.id}`}
              aria-pressed={selected}
              onClick={() => applySector(sector)}
              className={`inline-flex h-8 shrink-0 items-center rounded-full border px-2.5 text-xs font-medium transition ${
                selected
                  ? 'border-white bg-white text-black'
                  : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {sector.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default DashboardBuilderLauncher;

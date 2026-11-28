import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Microphone, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { api } from '../../../lib/apiClient';
import { economicPost } from '../../../lib/economicRequest';
import { useVoice } from '../../../hooks/useVoice';
import { builderEntryIsOpen } from '../../builder/builderAccess';
import { loadOwnerProjects } from '../../builder/components/BuilderProjectSelect';
import { DASHBOARD_HEADLINE, DASHBOARD_SUBTITLE } from '../dashboardCopy';
import {
  DASHBOARD_TABS,
  PROJECT_CONTEXTS,
  buildLaunchPrompt,
  dashboardSendLabel,
  dashboardTabById,
  dashboardTabForMode,
  embedOriginFromHost,
  launcherModeById,
  resolveActiveProject,
  resolveLauncherMode,
} from '../dashboardModel';
import DashboardProjectMenu from './DashboardProjectMenu';

const detailMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail && typeof detail.message === 'string' && detail.message.trim()) return detail.message;
  return fallback;
};

const getErrorMessage = (error) => detailMessage(error, 'No se pudo crear el proyecto.');

const DashboardBuilderLauncher = ({ launcherState = null, user = null, freeTestMode = false }) => {
  const navigate = useNavigate();
  const promptRef = useRef(null);
  const voice = useVoice();

  const [activeTabId, setActiveTabId] = useState(() => dashboardTabForMode(resolveLauncherMode(launcherState)).id);
  const [selectedContextId, setSelectedContextId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [host, setHost] = useState('');
  const [agentChannel, setAgentChannel] = useState('voz');
  const [snippet, setSnippet] = useState('');
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
      setHost('');
      setSnippet('');
      setSelectedContextId('');
      setError('');
      setActiveTabId('landing');
    }

    const incomingPrompt =
      typeof launcherState.initialPrompt === 'string'
        ? launcherState.initialPrompt.trim()
        : '';

    if (incomingPrompt) {
      setPrompt(incomingPrompt);
      setError('');
    }

    if (!launcherState.resetPrompt) {
      setActiveTabId(dashboardTabForMode(resolveLauncherMode(launcherState)).id);
    }
    promptRef.current?.focus({ preventScroll: true });
  }, [launcherState, launcherHydrationKey]);

  useEffect(() => {
    if (!voice.transcript) return;
    setPrompt(voice.transcript);
    setError('');
  }, [voice.transcript]);

  const activeTab = dashboardTabById(activeTabId);
  const activeMode = launcherModeById(activeTab.modeId || 'landing');
  const selectedContext = PROJECT_CONTEXTS.find((item) => item.id === selectedContextId) || null;
  const sendLabel = dashboardSendLabel(activeTab.id, freeTestMode);
  const installing = activeTab.id === 'install';

  const startNewProject = () => {
    setPrompt('');
    setHost('');
    setSnippet('');
    setSelectedContextId('');
    setError('');
    setActiveTabId('landing');
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
      setError(getErrorMessage(requestError));
      toast.error('Error al abrir Builder');
    } finally {
      setCreating(false);
    }
  };

  const installVoiceAgent = async () => {
    const origin = embedOriginFromHost(host);
    if (!origin) {
      setError('Escribe el dominio completo, por ejemplo https://tuempresa.com.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const projects = await loadOwnerProjects().catch(() => []);
      const project = resolveActiveProject(projects);
      if (!project?.project_id) {
        navigate('/dashboard/agente-voz', { state: { embedOrigin: origin } });
        return;
      }
      const response = await api.post('/embed/agents', {
        project_id: project.project_id,
        allowed_origins: [origin],
      });
      setSnippet(typeof response?.data?.snippet === 'string' ? response.data.snippet : '');
      if (!response?.data?.snippet) {
        setError('El agente no devolvió el fragmento de instalación.');
      }
    } catch (requestError) {
      setSnippet('');
      setError(detailMessage(requestError, 'No se ha podido crear el agente.'));
    } finally {
      setCreating(false);
    }
  };

  const onPrimary = () => {
    if (installing) {
      installVoiceAgent();
      return;
    }
    submitToBuilder();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !creating) {
      event.preventDefault();
      onPrimary();
    }
  };

  return (
    <section className="relative flex h-full min-h-0 w-full flex-col items-center justify-center">
      <DashboardProjectMenu onNewProject={startNewProject} />

      <div className="mt-5 flex max-w-[760px] flex-col items-center px-2 text-center">
        <p className="dash-kicker text-[11px] font-semibold">SISTEMA MAESTRO</p>
        <h2 className="dash-headline mt-3">{DASHBOARD_HEADLINE}</h2>
        <p className="mx-auto mt-3 max-w-[40rem] text-[18px] leading-7 text-[#b4bec8]">
          {DASHBOARD_SUBTITLE}
        </p>
      </div>

      <div className="dash-tabs mt-5 inline-flex items-center gap-1 p-1">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`dashboard-tab-${tab.id}`}
              aria-pressed={isActive}
              onClick={() => {
                setActiveTabId(tab.id);
                setError('');
                setSnippet('');
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                isActive ? 'dash-tab-active' : 'text-zinc-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="dash-composer mt-5 w-full max-w-[760px]">
        <div className="dash-composer-inner relative">
          {installing ? (
            <div className="px-5 pb-16 pt-4">
              <label className="block text-sm text-zinc-300" htmlFor="dashboard-embed-host">
                <span className="sr-only">Dominio</span>
                <span className="flex h-11 items-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <span className="border-r border-white/10 px-3 text-sm text-zinc-400">https://</span>
                  <input
                    id="dashboard-embed-host"
                    data-testid="dashboard-embed-host"
                    value={host}
                    placeholder="tunegocio.com"
                    autoComplete="off"
                    spellCheck="false"
                    onChange={(event) => {
                      setHost(event.target.value.replace(/^https?:\/\//i, ''));
                      if (error) setError('');
                    }}
                    onKeyDown={handleKeyDown}
                    className="h-full w-full bg-transparent px-3 text-[15px] text-white outline-none placeholder:text-zinc-500"
                  />
                </span>
              </label>
              <div className="mt-3 inline-flex rounded-full border border-white/10 p-1" role="group" aria-label="Canal del agente">
                <button
                  type="button"
                  data-testid="dashboard-agent-voz"
                  aria-pressed={agentChannel === 'voz'}
                  onClick={() => setAgentChannel('voz')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    agentChannel === 'voz'
                      ? 'bg-amber-200/15 text-[#fde68a] shadow-[0_0_16px_rgba(251,191,36,0.45)]'
                      : 'text-zinc-400'
                  }`}
                >
                  Voz
                </button>
                <button
                  type="button"
                  data-testid="dashboard-agent-chat"
                  disabled
                  className="cursor-not-allowed rounded-full px-3 py-1 text-xs text-zinc-500"
                >
                  Chat · Próximamente
                </button>
              </div>
              {snippet ? (
                <pre className="mt-3 max-h-24 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-left text-[11px] leading-5 text-cyan-50">
                  <code data-testid="dashboard-embed-snippet">{snippet}</code>
                </pre>
              ) : null}
            </div>
          ) : (
            <textarea
              ref={promptRef}
              data-testid="dashboard-prompt"
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={activeTab.placeholder}
              rows={3}
              disabled={creating}
              className="h-[148px] w-full resize-none rounded-[20px] bg-transparent px-5 pb-16 pt-4 text-[15px] leading-6 text-white outline-none placeholder:text-zinc-500 disabled:opacity-60"
            />
          )}

          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
            <button
              type="button"
              data-testid="dashboard-attach"
              aria-label="Adjuntar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-zinc-300"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="dashboard-mic"
                aria-label={voice.isListening ? 'Detener dictado' : 'Dictar'}
                aria-pressed={voice.isListening}
                disabled={!voice.isSupported || creating || installing}
                onClick={() => (voice.isListening ? voice.stopListening() : voice.startListening())}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/15 text-[#67e8f9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Microphone size={18} weight={voice.isListening ? 'fill' : 'regular'} aria-hidden="true" />
              </button>
              <button
                type="button"
                data-testid="dashboard-send"
                aria-label={installing ? 'Instalar agente' : 'Enviar'}
                onClick={onPrimary}
                disabled={creating || (installing && agentChannel !== 'voz')}
                className="inline-flex h-10 items-center rounded-full bg-[linear-gradient(95deg,#fde68a,#fbbf24,#f9a8d4,#67e8f9)] px-4 text-sm font-extrabold text-[#04141a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-center text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
};

export default DashboardBuilderLauncher;

import React, { useEffect, useRef, useState } from 'react';

import BuilderCanvasPane from '../components/BuilderCanvasPane';
import BuilderPublishDock from '../publish/BuilderPublishDock';
import { loadPublication, publishErrorMessage } from '../publish/builderPublishClient';
import AgentPanel from '../studio/components/AgentPanel';
import PreviewFrame from '../studio/components/PreviewFrame';
import ResumeStrip from '../studio/components/ResumeStrip';
import { useStudioControls } from '../studio/BuilderStudioContext';
import LivePublish from '../studio/components/LivePublish';
import { gemNoticeState, livePublishState, mapBuilderSteps, publishGate, readEvaluation } from '../studio/model';
import { previewPhaseOf } from '../studio/store';
import useBuilderWorkspaceRuntime from './hooks/useBuilderWorkspaceRuntime';
import EmbedInstallStep from '../embed/EmbedInstallStep';
import '../studio/studio.css';

const LoadingState = () => (
  <div className="flex h-full items-center justify-center p-6">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-white">Cargando proyecto</h2>
      <p className="mt-3 text-sm text-[#9a9a9a]">Leyendo el diagnóstico y la preview.</p>
    </div>
  </div>
);

const ErrorState = ({ projectError }) => (
  <div className="flex h-full items-center justify-center p-6" role="alert">
    <div className="max-w-xl text-center">
      <h2 className="text-2xl font-semibold text-white">No se pudo cargar el proyecto</h2>
      <p className="mt-3 text-sm leading-6 text-red-200">{projectError}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex h-full items-center justify-center p-6">
    <div className="max-w-xl text-center">
      <h2 className="text-2xl font-semibold text-white">Builder sin proyecto</h2>
      <p className="mt-3 text-sm leading-6 text-[#9a9a9a]">
        Vuelve al dashboard, escribe una idea o URL y abre el Builder.
      </p>
    </div>
  </div>
);

function PreparingPreview() {
  return (
    <div className="flex h-full items-center justify-center p-6" role="status">
      <div>
        <h2 className="text-2xl font-semibold text-[#111113]">Preparando tu página…</h2>
        <p className="mt-3 text-sm text-[#9a9a9a]">Estamos escribiendo la primera versión.</p>
      </div>
    </div>
  );
}

function PreviewFailed({ message, onRetry }) {
  return (
    <div className="flex h-full items-center justify-center p-6" role="alert">
      <div className="max-w-xl text-center">
        <h2 className="text-2xl font-semibold text-[#111113]">No se ha podido preparar la página</h2>
        <p className="mt-3 text-sm leading-6 text-[#111113]">{message}</p>
        <button type="button" onClick={onRetry} className="mt-5 rounded-full bg-[#111113] px-4 py-2 text-sm font-semibold text-white">
          Reintentar
        </button>
      </div>
    </div>
  );
}

async function copyText(text) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('No se ha podido copiar el mensaje.');
  }
  await navigator.clipboard.writeText(String(text || ''));
}

export default function BuilderWorkspaceLayout({
  ownerId = null,
  activeWorkspaceTab = 'preview',
  initialPrompt = '',
  project = null,
  loadingProject = false,
  projectError = '',
  autoStart = false,
  publishLanding = false,
  customDomain = false,
  embedInstall = false,
}) {
  const studio = useStudioControls();
  const { state, dispatch } = studio;
  const runtime = useBuilderWorkspaceRuntime({
    project,
    ownerId,
    initialPrompt,
    autoStart,
    loadingProject,
    projectError,
  });
  const frameRef = useRef(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const preview = runtime.generatedPreview;
  const evaluation = readEvaluation(preview);
  const phase = previewPhaseOf(state, runtime);
  const executorPhase = runtime.executor?.phase || '';
  const failed = phase === 'error';
  const busy = phase === 'live';
  const versions = Array.isArray(preview?.versions) ? preview.versions : [];
  const latest = versions[versions.length - 1];

  useEffect(() => {
    if (!latest || !preview?.html) return;
    dispatch({ type: 'remember-html', version: latest.version, html: preview.html });
  }, [dispatch, latest?.version, preview?.html]);

  useEffect(() => {
    if (!publishLanding || !project?.project_id) return undefined;
    let live = true;
    loadPublication(project.project_id)
      .then((data) => { if (live) dispatch({ type: 'publication', publication: data, note: '' }); })
      .catch((error) => {
        if (live) dispatch({ type: 'publication', publication: null, note: publishErrorMessage(error) });
      });
    return () => { live = false; };
  }, [dispatch, publishLanding, project?.project_id]);

  const visibleVersion = state.ui.visibleVersion;
  const cachedHtml = visibleVersion != null ? state.htmlByVersion[visibleVersion] : '';
  const savedHtml = (state.ui.surface === 'preview' && cachedHtml) || preview?.html || '';
  const liveHtml = (busy && runtime.executor?.partialHtml) || savedHtml;
  const shownHtml = state.ui.codeOpen ? '' : liveHtml;
  const gate = publishGate(evaluation, { publishEnabled: publishLanding, busy });
  const livePublish = livePublishState({ allowed: publishLanding, evaluation, busy });
  const published = state.publication?.status === 'published';
  const publicUrl = published ? String(state.publication?.url || '').trim() : '';
  const notice = state.ui.noticeDismissed ? null : gemNoticeState({
    balance: studio.credits,
    freeTestMode: studio.freeTestMode,
    pace: state.composer.pace,
  });
  const steps = mapBuilderSteps({
    project,
    preview,
    evaluation,
    publication: state.publication,
  });
  const thinking = executorPhase === 'construyendo' || executorPhase === 'iterando';
  const exhausted = notice?.tone === 'exhausted';
  const canSend = state.composer.draft.trim().length > 0 && !thinking && !exhausted;

  const send = (text) => {
    const value = String(text ?? state.composer.draft).trim();
    if (!value || thinking || exhausted) return;
    dispatch({ type: 'clear-draft' });
    runtime.submitMessage(value, state.composer.pace);
  };

  const resume = async () => {
    dispatch({ type: 'resume-start' });
    try {
      await runtime.reloadPreview();
    } finally {
      dispatch({ type: 'resume-end' });
    }
  };

  const visibleTab = activeWorkspaceTab === 'extract' ? 'extract' : 'preview';
  const installOpen = Boolean(embedInstall && activeWorkspaceTab === 'install' && project);
  let frameBody = <EmptyState />;
  if (loadingProject) frameBody = <LoadingState />;
  else if (projectError) frameBody = <ErrorState projectError={projectError} />;
  else if (installOpen) frameBody = <EmbedInstallStep projectId={project.project_id} />;
  else if (state.ui.codeOpen && (liveHtml || preview?.html)) {
    frameBody = <pre className="h-full overflow-auto bg-[#0b0b0c] p-4 text-xs text-[#f2f2f2]">{liveHtml || preview.html}</pre>;
  } else if (project && visibleTab !== 'extract' && shownHtml) {
    frameBody = (
      <iframe title="Preview de la landing" sandbox="" srcDoc={shownHtml} key={state.ui.frameKey} className="h-full min-h-[320px] w-full border-0 bg-white" />
    );
  } else if (project && visibleTab !== 'extract' && busy) frameBody = <PreparingPreview />;
  else if (project && visibleTab !== 'extract' && failed) {
    frameBody = (
      <PreviewFailed
        message={runtime.previewNotice || runtime.executor?.message || 'No se ha podido preparar la preview. No se ha publicado nada.'}
        onRetry={runtime.retryPreview}
      />
    );
  } else if (project) {
    frameBody = (
      <BuilderCanvasPane
        activeWorkspaceTab={visibleTab}
        copy={runtime.copy}
        project={project}
        progress={100}
        activeCodeTab={runtime.activeCodeTab}
        onCodeTabChange={runtime.setActiveCodeTab}
        builderIntelligence={runtime.builderIntelligence}
      />
    );
  }

  const showStrip = !state.ui.codeOpen && (phase === 'static' || phase === 'resuming') && Boolean(shownHtml);

  return (
    <section className="studio">
      <div className={`studio-body ${state.ui.chatOpen ? '' : 'is-preview-only'}`}>
        {state.ui.chatOpen ? (
          <AgentPanel
            log={runtime.executor?.log || []}
            steps={runtime.executor?.steps || []}
            phase={executorPhase}
            message={runtime.executor?.message || ''}
            slow={Boolean(runtime.executor?.slow)}
            preview={preview}
            reactions={state.ui.reactions}
            suggestionDisabled={exhausted}
            onSuggest={send}
            onReact={(id, value) => dispatch({ type: 'reaction', id, value })}
            onCopy={async (text) => {
              try {
                await copyText(text);
                dispatch({ type: 'note', key: 'copyNote', text: '' });
              } catch (error) {
                dispatch({ type: 'note', key: 'copyNote', text: error.message || 'No se ha podido copiar el mensaje.' });
              }
            }}
            stepItems={steps}
            notice={notice}
            onDismissNotice={() => dispatch({ type: 'dismiss-notice' })}
            draft={state.composer.draft}
            pace={state.composer.pace}
            canSend={canSend}
            attachmentNote={state.ui.attachmentNote}
            micNote={state.ui.micNote}
            onDraft={(draft) => dispatch({ type: 'draft', draft })}
            onPace={(pace) => dispatch({ type: 'pace', pace })}
            onSubmit={() => send()}
            onAttach={() => dispatch({ type: 'note', key: 'attachmentNote', text: 'Este ejecutor no admite archivos.' })}
            onMic={() => dispatch({ type: 'note', key: 'micNote', text: 'El micrófono no está conectado a este ejecutor.' })}
            livePublish={livePublish.visible ? (
              <LivePublish
                enabled={livePublish.enabled}
                reason={livePublish.reason}
                url={publicUrl}
                onOpen={() => setPublishOpen(true)}
              />
            ) : null}
            publishFlow={publishOpen && livePublish.visible ? (
              <div className="publish-flow" data-testid="builder-publish-flow">
                <BuilderPublishDock
                  projectId={project?.project_id || ''}
                  publishLanding={publishLanding}
                  customDomain={customDomain}
                  hasPreview={Boolean(preview?.html)}
                  busy={busy}
                  scoreAllowed={gate.enabled}
                  onPublication={(publication) => dispatch({ type: 'publication', publication, note: '' })}
                />
              </div>
            ) : null}
          />
        ) : null}
        <div className="studio-right">
          <PreviewFrame frameRef={frameRef} strip={showStrip ? <ResumeStrip phase={phase} onResume={resume} /> : null}>
            {frameBody}
          </PreviewFrame>
          {state.ui.copyNote ? <p role="status" className="px-4 pb-2 text-xs text-[#9a9a9a]">{state.ui.copyNote}</p> : null}
          {state.publicationNote && publishLanding ? (
            <p role="status" className="px-4 pb-2 text-xs text-[#9a9a9a]">{state.publicationNote}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

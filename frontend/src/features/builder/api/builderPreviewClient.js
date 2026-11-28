import { api, API_BASE } from '../../../lib/apiClient';
import { economicPost, runEconomicRequest } from '../../../lib/economicRequest';

// Dark defaults. The live switch is the builder session (flag or admin), not these constants.
export const PUBLISH_LANDING_ENABLED = false;
export const CUSTOM_DOMAIN_ENABLED = false;

export const PREVIEW_STREAM_COPY = {
  pending: 'Cobro pendiente de confirmar',
  insufficient: 'No tienes gemas suficientes',
  plansUrl: '/dashboard/billing',
  duplicate: 'Esta generación ya está en curso o esta clave ya se usó.',
  timeout: 'La generación no responde. No se ha publicado nada.',
  done: 'Página guardada.',
};

// Heartbeats do not move this clock. A model step can sit quiet for the
// provider timeout (120s); 150s leaves that room and still ends a stream
// that only beats.
export const streamWatchdog = { ms: 150000 };

export function previewStreamStalled(lastProgressAt, now = Date.now(), limit = streamWatchdog.ms) {
  return Number.isFinite(lastProgressAt) && now - lastProgressAt >= limit;
}

export function notePreviewProgress(event, lastProgressAt, now = Date.now()) {
  if (!event || event.type === 'heartbeat') return lastProgressAt;
  return now;
}

function insufficientCopy(event) {
  const plans = event?.plansUrl || PREVIEW_STREAM_COPY.plansUrl;
  return `${PREVIEW_STREAM_COPY.insufficient} Planes: ${plans}`;
}

export function streamTerminalState(event) {
  if (!event || event.type === 'heartbeat') return null;
  if (event.type === 'notice') {
    const notice = event.code === 'insufficient_gems'
      ? insufficientCopy(event)
      : (event.message || PREVIEW_STREAM_COPY.pending);
    return { terminal: false, notice, message: notice };
  }
  if (event.type === 'timeout') {
    return {
      terminal: true,
      phase: 'error',
      message: PREVIEW_STREAM_COPY.timeout,
      notice: PREVIEW_STREAM_COPY.timeout,
    };
  }
  if (event.type === 'error') {
    let message = event.message || 'No se ha podido preparar la preview. No se ha publicado nada.';
    if (event.code === 'insufficient_gems') message = insufficientCopy(event);
    else if (event.code === 'duplicate_run') message = event.message || PREVIEW_STREAM_COPY.duplicate;
    return { terminal: true, phase: 'error', message, notice: message };
  }
  if (event.type === 'done') {
    const message = event.summary || PREVIEW_STREAM_COPY.done;
    return { terminal: true, phase: 'completado', message, preview: event };
  }
  return null;
}

function armStreamWatchdog(controller, lastProgressAt) {
  const wait = Math.max(0, streamWatchdog.ms - (Date.now() - lastProgressAt));
  return setTimeout(() => controller.abort(), wait);
}

export function previewErrorMessage(error) {
  const message = error?.response?.data?.detail?.message;
  if (typeof message === 'string' && message.trim() && !/^[A-Z0-9_]+$/.test(message.trim())) {
    return message.trim();
  }
  return 'No se ha podido preparar la preview. No se ha publicado nada.';
}

export async function loadBuilderSession() {
  try {
    const response = await api.get('/builder/session');
    return {
      freeTestMode: Boolean(response?.data?.freeTestMode),
      publishLanding: Boolean(response?.data?.publishLanding),
      customDomain: Boolean(response?.data?.customDomain),
    };
  } catch {
    return { freeTestMode: false, publishLanding: false, customDomain: false };
  }
}

export async function loadLandingPreview(projectId) {
  try {
    const response = await api.get(`/builder/preview/${encodeURIComponent(projectId)}`);
    const data = response?.data;
    if (!data || typeof data.html !== 'string') return null;
    return data;
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export function parseSseBuffer(buffer) {
  const chunks = String(buffer || '').split('\n\n');
  const rest = chunks.pop() || '';
  const events = [];
  for (const chunk of chunks) {
    const lines = chunk.split('\n').filter((line) => line && !line.startsWith(':'));
    if (!lines.length) continue;
    let name = 'message';
    const data = [];
    for (const line of lines) {
      if (line.startsWith('event:')) name = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trim());
    }
    if (!data.length) continue;
    let payload = {};
    try { payload = JSON.parse(data.join('\n')); } catch { payload = {}; }
    events.push({ type: name, ...payload });
  }
  return { events, rest };
}

export function stepNeedsPatience(startedAt, now = Date.now(), limit = 20000) {
  return Number.isFinite(startedAt) && now - startedAt >= limit;
}

function previewStreamError(message) {
  const error = new Error(message);
  error.response = { data: { detail: { message } } };
  return error;
}

export async function streamLandingPreview(project, instruction, onEvent) {
  const url = `${String(API_BASE || '').replace(/\/$/, '')}/builder/preview/stream`;
  const body = { projectId: project.project_id, instruction };
  let preview = null;
  await runEconomicRequest(url, { body, expectedRevision: project.updated_at || '0' }, async (key) => {
    const controller = new AbortController();
    let lastProgress = Date.now();
    let watchdog = armStreamWatchdog(controller, lastProgress);
    const failTimedOut = () => {
      onEvent?.({ type: 'timeout', message: PREVIEW_STREAM_COPY.timeout });
      const error = previewStreamError(PREVIEW_STREAM_COPY.timeout);
      error.code = 'preview_timeout';
      throw error;
    };
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
          'If-Match': project.updated_at || '0',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok || !response.body) {
        let parsed = null;
        try { parsed = JSON.parse(await response.text()); } catch { /* keep the fallback */ }
        const message = parsed?.detail?.message || 'No se ha podido preparar la preview. No se ha publicado nada.';
        const error = new Error(message);
        error.response = { status: response.status, data: parsed || { detail: { message } } };
        throw error;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const readChunk = () => new Promise((resolve, reject) => {
        const onAbort = () => {
          reader.cancel().catch(() => {});
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        };
        if (controller.signal.aborted) {
          onAbort();
          return;
        }
        controller.signal.addEventListener('abort', onAbort, { once: true });
        reader.read().then((chunk) => {
          controller.signal.removeEventListener('abort', onAbort);
          resolve(chunk);
        }, (error) => {
          controller.signal.removeEventListener('abort', onAbort);
          reject(error);
        });
      });
      while (true) {
        if (previewStreamStalled(lastProgress, Date.now())) failTimedOut();
        const chunk = await readChunk();
        buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
        const parsed = parseSseBuffer(buffer);
        buffer = parsed.rest;
        for (const event of parsed.events) {
          onEvent?.(event);
          lastProgress = notePreviewProgress(event, lastProgress);
          if (event.type !== 'heartbeat') {
            clearTimeout(watchdog);
            watchdog = armStreamWatchdog(controller, lastProgress);
          }
          const terminal = streamTerminalState(event);
          if (terminal?.terminal && terminal.phase === 'error') throw previewStreamError(terminal.message);
          if (event.type === 'done') preview = event;
        }
        if (chunk.done) break;
      }
    } catch (error) {
      if (controller.signal.aborted) failTimedOut();
      throw error;
    } finally {
      clearTimeout(watchdog);
    }
    return preview;
  });
  if (!preview?.html) {
    const error = new Error('No se ha podido preparar la preview. No se ha publicado nada.');
    error.response = { data: { detail: { message: error.message } } };
    throw error;
  }
  return preview;
}

export async function generateLandingPreview(project, instruction) {
  const response = await economicPost(api, '/builder/preview', {
    projectId: project.project_id,
    instruction,
  }, { headers: { 'If-Match': project.updated_at || '0' } });
  return response.data;
}

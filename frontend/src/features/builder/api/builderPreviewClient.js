import { api, API_BASE } from '../../../lib/apiClient';
import { economicPost, runEconomicRequest } from '../../../lib/economicRequest';

// Dark defaults. The live switch is the builder session (flag or admin), not these constants.
export const PUBLISH_LANDING_ENABLED = false;
export const CUSTOM_DOMAIN_ENABLED = false;

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

export async function streamLandingPreview(project, instruction, onEvent) {
  const url = `${String(API_BASE || '').replace(/\/$/, '')}/builder/preview/stream`;
  const body = { projectId: project.project_id, instruction };
  let preview = null;
  await runEconomicRequest(url, { body, expectedRevision: project.updated_at || '0' }, async (key) => {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
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
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest;
      for (const event of parsed.events) {
        onEvent?.(event);
        if (event.type === 'error') {
          const error = new Error(event.message || 'No se ha podido preparar la preview. No se ha publicado nada.');
          error.response = { data: { detail: { message: error.message } } };
          throw error;
        }
        if (event.type === 'done') preview = event;
      }
      if (chunk.done) break;
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

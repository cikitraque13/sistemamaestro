const BUILDER_AI_ENDPOINT = "/api/builder/build";

import { runEconomicRequest } from '../../../lib/economicRequest';

function normalizeBaseUrl(baseUrl = "") {
  return String(baseUrl || "").replace(/\/$/, "");
}

export async function buildWithBuilderAI({
  userInput,
  currentBuildState = null,
  projectId = null,
  userId = null,
  mode = "build",
  apiBaseUrl = "",
  serverRevision,
  contextUse = "formatting_only",
} = {}) {
  if (!userInput || !String(userInput).trim()) {
    throw new Error("Falta userInput para Builder AI.");
  }

  const baseUrl = normalizeBaseUrl(apiBaseUrl);
  const body = {
    userInput: String(userInput).trim(), currentBuildState, projectId, userId, mode, contextUse,
  };
  return runEconomicRequest(`${baseUrl}${BUILDER_AI_ENDPOINT}`, {body, serverRevision}, async (key) => {
  const response = await fetch(`${baseUrl}${BUILDER_AI_ENDPOINT}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
      ...(projectId ? { "If-Match": serverRevision } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Builder AI falló: ${response.status} ${detail}`);
    try { error.response = { status: response.status, data: JSON.parse(detail) }; } catch (_) { /* retain key */ }
    throw error;
  }

  return response.json();
  });
}

export { BUILDER_AI_ENDPOINT };

// Intent requests deliberately bypass economicRequest and BuilderAIOutput.
export async function submitIntentOperation(body, revision, apiBaseUrl = '') {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}${BUILDER_AI_ENDPOINT}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'If-Match': revision },
    body: JSON.stringify({ ...body, kind: 'intent' }),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result?.detail?.code || 'PERSISTENCE_UNAVAILABLE');
    error.code = result?.detail?.code || 'PERSISTENCE_UNAVAILABLE';
    throw error;
  }
  return result;
}

// Plan lifecycle requests bypass construction and commercial-credit handling.
export async function submitPlanOperation(body, revision, apiBaseUrl = '') {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}${BUILDER_AI_ENDPOINT}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'If-Match': revision },
    body: JSON.stringify({ ...body, kind: 'plan' }),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result?.code || result?.detail?.code || 'PERSISTENCE_UNAVAILABLE');
    error.code = result?.code || result?.detail?.code || 'PERSISTENCE_UNAVAILABLE';
    throw error;
  }
  return result;
}

export async function recoverProjectPlan(projectId, apiBaseUrl = '') {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/projects/${encodeURIComponent(projectId)}`, { credentials: 'include' });
  const project = await response.json();
  if (!response.ok) {
    const error = new Error(project?.code || project?.detail?.code || 'PERSISTENCE_UNAVAILABLE');
    error.code = project?.code || project?.detail?.code || 'PERSISTENCE_UNAVAILABLE';
    throw error;
  }
  return { project_id: project.project_id, user_id: project.user_id, updated_at: project.updated_at || '0', plan: project.j06_2_plan || null };
}

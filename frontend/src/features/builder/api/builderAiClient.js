import { BACKEND_URL } from '../../../lib/apiClient';
import { runEconomicRequest } from '../../../lib/economicRequest';

const BUILDER_AI_ENDPOINT = "/api/builder/build";

function apiUrl(path) {
  const base = String(BACKEND_URL || "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function failedResponse(status, detail) {
  let parsed = null;
  try { parsed = JSON.parse(detail); } catch (_) { /* keep the raw body */ }
  const message = parsed?.detail?.message;
  const error = new Error(typeof message === "string" && message
    ? message
    : `Builder AI falló: ${status} ${detail}`);
  if (parsed) error.response = { status, data: parsed };
  const code = parsed?.detail?.code || parsed?.code;
  if (typeof code === "string") error.code = code;
  return error;
}

export async function buildWithBuilderAI({
  userInput,
  currentBuildState = null,
  projectId = null,
  userId = null,
  mode = "build",
  serverRevision,
  contextUse = "formatting_only",
} = {}) {
  if (!userInput || !String(userInput).trim()) {
    throw new Error("Falta userInput para Builder AI.");
  }

  const url = apiUrl(BUILDER_AI_ENDPOINT);
  const body = {
    userInput: String(userInput).trim(), currentBuildState, projectId, userId, mode, contextUse,
  };
  return runEconomicRequest(url, {body, serverRevision}, async (key) => {
  const response = await fetch(url, {
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
    throw failedResponse(response.status, await response.text());
  }

  return response.json();
  });
}

export { BUILDER_AI_ENDPOINT };

// Intent requests deliberately bypass economicRequest and BuilderAIOutput.
export async function submitIntentOperation(body, revision) {
  const response = await fetch(apiUrl(BUILDER_AI_ENDPOINT), {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'If-Match': revision },
    body: JSON.stringify({ ...body, kind: 'intent' }),
  });
  const result = await response.json();
  if (!response.ok) throw failedResponse(response.status, JSON.stringify(result));
  return result;
}

// Plan lifecycle requests bypass construction and commercial-credit handling.
export async function submitPlanOperation(body, revision) {
  const response = await fetch(apiUrl(BUILDER_AI_ENDPOINT), {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'If-Match': revision },
    body: JSON.stringify({ ...body, kind: 'plan' }),
  });
  const result = await response.json();
  if (!response.ok) throw failedResponse(response.status, JSON.stringify(result));
  return result;
}

export async function recoverProjectPlan(projectId) {
  const response = await fetch(apiUrl(`/api/projects/${encodeURIComponent(projectId)}`), { credentials: 'include' });
  const project = await response.json();
  if (!response.ok) throw failedResponse(response.status, JSON.stringify(project));
  return { project_id: project.project_id, user_id: project.user_id, updated_at: project.updated_at || '0', plan: project.j06_2_plan || null };
}

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
} = {}) {
  if (!userInput || !String(userInput).trim()) {
    throw new Error("Falta userInput para Builder AI.");
  }

  const baseUrl = normalizeBaseUrl(apiBaseUrl);
  const body = {
    userInput: String(userInput).trim(), currentBuildState, projectId, userId, mode,
  };
  return runEconomicRequest(`${baseUrl}${BUILDER_AI_ENDPOINT}`, body, async (key) => {
  const response = await fetch(`${baseUrl}${BUILDER_AI_ENDPOINT}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
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

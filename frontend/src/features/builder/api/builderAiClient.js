const BUILDER_AI_ENDPOINT = "/api/builder/build";

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
  const response = await fetch(`${baseUrl}${BUILDER_AI_ENDPOINT}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userInput: String(userInput).trim(),
      currentBuildState,
      projectId,
      userId,
      mode,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Builder AI falló: ${response.status} ${detail}`);
  }

  return response.json();
}

export { BUILDER_AI_ENDPOINT };

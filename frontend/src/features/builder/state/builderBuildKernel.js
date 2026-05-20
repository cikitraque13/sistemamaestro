import {
  applyBuildMutation,
  createBuildStateFailure,
  createInitialBuildState,
  getBuildStateSummary,
  normalizeBuildState,
} from "./builderBuildState";

import {
  buildMutationFromType,
  buildMutationsFromKnowledge,
  buildMutationsFromInput,
} from "./builderMutationRegistry";

import {
  createBuilderOutputMap,
} from "./builderOutputMap";

import {
  normalizeBuilderStructure,
} from "./builderStructureRegistry";

import {
  createBuilderDecisionMessage,
} from "./builderQuestionFlowRegistry";

import {
  createBuilderKnowledgeIndex,
  getBuilderKnowledgeSummary,
} from "./builderKnowledgeIndex";

export const BUILDER_BUILD_KERNEL_VERSION = "builder-build-kernel-v1";

const getProjectId = (project) =>
  project?.project_id || project?.id || "local-builder-project";

const getInput = ({
  input = "",
  message = "",
  project = null,
  initialPrompt = "",
} = {}) =>
  [
    input,
    message,
    project?.input_content,
    project?.prompt,
    initialPrompt,
  ]
    .filter(Boolean)
    .join(" ");

export function createBuilderKernelInitialState({
  project = null,
  input = "",
  initialPrompt = "",
  sourceType = "idea",
} = {}) {
  return createInitialBuildState({
    projectId: getProjectId(project),
    sourceType,
    userIntent: getInput({
      input,
      project,
      initialPrompt,
    }),
  });
}

export function runBuilderBuildKernel({
  input = "",
  message = "",
  project = null,
  initialPrompt = "",
  currentState = null,
  currentSelection = null,
  explicitUserLevel = "",
  source = "user",
} = {}) {
  try {
    const previousState = currentState
      ? normalizeBuildState(currentState)
      : createBuilderKernelInitialState({
          project,
          input,
          initialPrompt,
        });

    const rawInput = getInput({
      input,
      message,
      project,
      initialPrompt,
    });

    const knowledge = createBuilderKnowledgeIndex({
      input,
      message,
      project,
      initialPrompt,
      currentSelection,
      explicitUserLevel,
    });

    const mutations = knowledge
      ? buildMutationsFromKnowledge(knowledge, { source })
      : buildMutationsFromInput(rawInput, { source });

    const nextState = mutations.reduce(
      (state, mutation) => applyBuildMutation(state, mutation),
      previousState
    );

    const structure = normalizeBuilderStructure(nextState);
    const output = createBuilderOutputMap(nextState, { knowledge, structure });
    const decisionMessage = createBuilderDecisionMessage(nextState, { knowledge, structure });

    return {
      version: BUILDER_BUILD_KERNEL_VERSION,
      ok: true,
      input: rawInput,
      previousState,
      state: nextState,
      mutations,
      mutationTypes: mutations.map((mutation) => mutation.type),
      knowledge,
      knowledgeSummary: getBuilderKnowledgeSummary(knowledge),
      output,
      structure,
      decisionMessage,
      summary: getBuildStateSummary(nextState),
    };
  } catch (error) {
    const failedState = createBuildStateFailure(currentState || {}, {
      type: "builder_kernel_error",
      message: error?.message || "Builder kernel failed.",
      meta: {
        input,
        message,
      },
    });

    return {
      version: BUILDER_BUILD_KERNEL_VERSION,
      ok: false,
      error,
      state: failedState,
      output: createBuilderOutputMap(failedState),
      summary: getBuildStateSummary(failedState),
    };
  }
}

export function runBuilderDecisionMutation({
  action = null,
  currentState = null,
  project = null,
  initialPrompt = "",
  source = "builder_decision_loop",
} = {}) {
  const actionType = action?.type || action?.mutationType || action?.id || "";
  const previousState = currentState
    ? normalizeBuildState(currentState)
    : createBuilderKernelInitialState({ project, initialPrompt });
  const mutation = buildMutationFromType(actionType, {
    source,
    decisionId: action?.id || "",
  });

  if (!mutation) {
    return runBuilderBuildKernel({
      input: action?.prompt || action?.label || "",
      message: action?.prompt || action?.label || "",
      project,
      initialPrompt,
      currentState: previousState,
      source,
    });
  }

  const nextState = applyBuildMutation(previousState, {
    ...mutation,
    source,
    meta: {
      ...(mutation.meta || {}),
      decisionId: action?.id || "",
      phase: action?.phase || action?.lifecycleStageId || "builder_decision",
    },
  });
  const structure = normalizeBuilderStructure(nextState);
  const output = createBuilderOutputMap(nextState, { structure });
  const decisionMessage = createBuilderDecisionMessage(nextState, { structure });

  return {
    version: BUILDER_BUILD_KERNEL_VERSION,
    ok: true,
    input: action?.prompt || action?.label || actionType,
    previousState,
    state: nextState,
    mutations: [mutation],
    mutationTypes: [mutation.type],
    output,
    structure,
    decisionMessage,
    summary: getBuildStateSummary(nextState),
  };
}

export function previewBuilderBuildKernel(args = {}) {
  const result = runBuilderBuildKernel(args);

  return {
    ok: result.ok,
    state: result.state,
    output: result.output,
    decisionMessage: result.decisionMessage,
    summary: result.summary,
  };
}

export default runBuilderBuildKernel;
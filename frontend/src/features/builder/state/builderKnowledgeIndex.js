import {
  interpretBuilderIntent,
  summarizeBuilderIntent,
} from "../intelligence/builderIntentInterpreter";

import {
  orchestrateBuilderHub,
  getBuilderHubSummary,
} from "../intelligence/builderHubOrchestrator";

import {
  interpretBuilderIteration,
  getBuilderIterationSummary,
} from "../intelligence/builderIterationInterpreter";

import {
  classifyBuilderProject,
  getBuilderClassificationSummary,
} from "../intelligence/builderProjectClassifier";

import {
  buildInlineQuestionMessage,
  shouldAskBuilderQuestion,
} from "../presets/builderQuestionPresets";

import {
  buildLandingCopy,
  resolveDirection,
} from "../utils/builderLandingCopy";

export const BUILDER_KNOWLEDGE_INDEX_VERSION = "builder-knowledge-index-v1";

const compact = (items = []) => items.filter(Boolean);

const safeCall = (fn, fallback, ...args) => {
  try {
    return fn(...args);
  } catch (error) {
    return {
      ...fallback,
      error: {
        message: error?.message || "Unknown builder knowledge error.",
      },
    };
  }
};

const getRawInput = ({
  input = "",
  message = "",
  project = null,
  initialPrompt = "",
} = {}) =>
  compact([
    input,
    message,
    project?.input_content,
    project?.prompt,
    project?.title,
    project?.summary,
    initialPrompt,
  ]).join(" ");

export function createBuilderKnowledgeIndex({
  input = "",
  message = "",
  project = null,
  initialPrompt = "",
  currentSelection = null,
  explicitUserLevel = "",
} = {}) {
  const rawInput = getRawInput({
    input,
    message,
    project,
    initialPrompt,
  });

  const intent = safeCall(
    interpretBuilderIntent,
    {},
    rawInput,
    {
      projectId: project?.project_id || project?.id,
      route: project?.route,
      projectStatus: project?.status,
    }
  );

  const intentSummary = safeCall(
    summarizeBuilderIntent,
    "",
    intent
  );

  const classification = safeCall(
    classifyBuilderProject,
    {},
    {
      text: rawInput,
      project,
      explicitUserLevel,
    }
  );

  const classificationSummary = safeCall(
    getBuilderClassificationSummary,
    {},
    classification
  );

  const hubResult = safeCall(
    orchestrateBuilderHub,
    {},
    {
      input: rawInput,
      message,
      project,
      explicitUserLevel,
      currentSelection,
    }
  );

  const hubSummary = safeCall(
    getBuilderHubSummary,
    {},
    hubResult
  );

  const iteration = message
    ? safeCall(
        interpretBuilderIteration,
        {},
        {
          message,
          project,
          currentSelection,
          explicitUserLevel,
        }
      )
    : null;

  const iterationSummary = iteration
    ? safeCall(getBuilderIterationSummary, {}, iteration)
    : null;

  const direction = resolveDirection(rawInput);
  const landingCopy = safeCall(
    buildLandingCopy,
    {},
    project,
    initialPrompt || rawInput,
    direction
  );

  const question = shouldAskBuilderQuestion(intent)
    ? buildInlineQuestionMessage(intent)
    : null;

  return {
    version: BUILDER_KNOWLEDGE_INDEX_VERSION,
    rawInput,
    message,
    intent,
    intentSummary,
    classification,
    classificationSummary,
    hubResult,
    hubSummary,
    iteration,
    iterationSummary,
    direction,
    landingCopy,
    question,
    createdAt: new Date().toISOString(),
  };
}

export function getBuilderKnowledgeSummary(knowledge = {}) {
  return {
    input: knowledge.rawInput,
    mode: knowledge.intent?.mode,
    templateType: knowledge.intent?.templateType,
    visualDirection: knowledge.intent?.visualDirection,
    conversionGoal: knowledge.intent?.conversionGoal,
    projectType: knowledge.classificationSummary?.projectType || knowledge.hubSummary?.projectType,
    category: knowledge.classificationSummary?.category || knowledge.hubSummary?.category,
    businessModel: knowledge.classificationSummary?.businessModel || knowledge.hubSummary?.businessModel,
    primaryGoal: knowledge.classificationSummary?.primaryGoal,
    conversionTarget: knowledge.hubSummary?.conversionTarget,
    primaryCTA: knowledge.hubSummary?.primaryCTA || knowledge.landingCopy?.primaryCta,
    iterationIntent: knowledge.iterationSummary?.primaryIntent || null,
    affectedLayers: knowledge.iterationSummary?.affectedLayers || knowledge.hubSummary?.affectedLayers || [],
  };
}

export default createBuilderKnowledgeIndex;
export * from './builderProjectClassifier';
export * from './builderPlaybookSelector';
export * from './builderIterationInterpreter';
export * from './builderHubOrchestrator';
export * from '../playbooks';

import {
  classifyBuilderProject,
  getBuilderClassificationSummary,
} from './builderProjectClassifier';

import {
  selectBuilderPlaybooks,
  getBuilderPlaybookSelectionSummary,
} from './builderPlaybookSelector';

import {
  interpretBuilderIteration,
  getBuilderIterationSummary,
} from './builderIterationInterpreter';

import {
  orchestrateBuilderHub,
  orchestrateInitialBuilderHub,
  orchestrateBuilderIterationHub,
  getBuilderHubSummary,
} from './builderHubOrchestrator';

export const BUILDER_INTELLIGENCE_VERSION = 'builder-hub-v1';

export const runBuilderInitialIntelligence = ({
  input = '',
  project = null,
  explicitUserLevel = '',
} = {}) => {
  const hub = orchestrateInitialBuilderHub({
    input,
    project,
    explicitUserLevel,
  });

  return {
    version: BUILDER_INTELLIGENCE_VERSION,
    hub,
    summary: getBuilderHubSummary(hub),
  };
};

export const runBuilderIterationIntelligence = ({
  message = '',
  project = null,
  currentSelection = null,
  explicitUserLevel = '',
} = {}) => {
  const hub = orchestrateBuilderIterationHub({
    message,
    project,
    currentSelection,
    explicitUserLevel,
  });

  return {
    version: BUILDER_INTELLIGENCE_VERSION,
    hub,
    summary: getBuilderHubSummary(hub),
  };
};

export const runBuilderFullIntelligence = ({
  input = '',
  message = '',
  project = null,
  currentSelection = null,
  explicitUserLevel = '',
} = {}) => {
  const hub = orchestrateBuilderHub({
    input,
    message,
    project,
    currentSelection,
    explicitUserLevel,
  });

  return {
    version: BUILDER_INTELLIGENCE_VERSION,
    hub,
    summary: getBuilderHubSummary(hub),
  };
};

export const runBuilderClassificationOnly = ({
  text = '',
  project = null,
  explicitUserLevel = '',
} = {}) => {
  const classification = classifyBuilderProject({
    text,
    project,
    explicitUserLevel,
  });

  return {
    version: BUILDER_INTELLIGENCE_VERSION,
    classification,
    summary: getBuilderClassificationSummary(classification),
  };
};

export const runBuilderPlaybookSelectionOnly = ({
  text = '',
  project = null,
  explicitUserLevel = '',
  classificationResult = null,
} = {}) => {
  const selection = selectBuilderPlaybooks({
    text,
    project,
    explicitUserLevel,
    classificationResult,
  });

  return {
    version: BUILDER_INTELLIGENCE_VERSION,
    selection,
    summary: getBuilderPlaybookSelectionSummary(selection),
  };
};

export const runBuilderIterationOnly = ({
  message = '',
  project = null,
  currentSelection = null,
  explicitUserLevel = '',
} = {}) => {
  const iteration = interpretBuilderIteration({
    message,
    project,
    currentSelection,
    explicitUserLevel,
  });

  return {
    version: BUILDER_INTELLIGENCE_VERSION,
    iteration,
    summary: getBuilderIterationSummary(iteration),
  };
};
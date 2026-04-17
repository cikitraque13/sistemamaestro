import { MATRIX_CHARS } from './flow.constants';

export const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const formatApiErrorDetail = (detail) => {
  if (detail == null) return 'Algo salió mal. Intenta de nuevo.';
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((entry) =>
        entry && typeof entry.msg === 'string' ? entry.msg : JSON.stringify(entry)
      )
      .filter(Boolean)
      .join(' ');
  }

  if (detail && typeof detail.msg === 'string') return detail.msg;

  return String(detail);
};

export const buildFlowUrl = (step, projectId) => {
  if (!projectId) return `/flow/${step}`;
  return `/flow/${step}?project=${encodeURIComponent(projectId)}`;
};

export const resolveStepFromProject = (projectData) => {
  if (!projectData) return 'input';
  if (projectData.blueprint || projectData.status === 'blueprint_generated') {
    return 'blueprint';
  }
  return 'result';
};

export const resolveRestoredStep = (requestedStep, projectData) => {
  const fallbackStep = resolveStepFromProject(projectData);

  if (!requestedStep) return fallbackStep;
  if (requestedStep === 'blueprint' && !projectData?.blueprint) return fallbackStep;
  if (requestedStep === 'refine' && !(projectData?.refine_questions?.length > 0)) {
    return fallbackStep;
  }

  return requestedStep;
};

export const buildMatrixColumn = (length = 28) =>
  Array.from({ length }, (_, index) => ({
    id: index,
    char: MATRIX_CHARS[(index * 7 + length) % MATRIX_CHARS.length]
  }));

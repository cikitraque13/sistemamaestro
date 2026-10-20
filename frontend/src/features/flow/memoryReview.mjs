const REVIEW_CODES = new Set([
  'project_memory_conflict',
  'project_memory_uncertain',
  'memory_review_legacy_unmapped',
  'stale_project_revision'
]);

export const parseMemoryReviewError = (detail) => {
  if (!detail || typeof detail !== 'object' || !REVIEW_CODES.has(detail.code)) return null;
  if (detail.code === 'project_memory_conflict' || detail.code === 'project_memory_uncertain') {
    return {
      code: detail.code,
      groups: Array.isArray(detail.groups)
        ? detail.groups.map((group) => ({
            kind: group?.kind === 'uncertain' ? 'uncertain' : 'conflict',
            questionIds: Array.isArray(group?.question_ids)
              ? group.question_ids.filter((id) => typeof id === 'string')
              : []
          }))
        : []
    };
  }
  if (detail.code === 'memory_review_legacy_unmapped') {
    return {
      code: detail.code,
      questionIds: Array.isArray(detail.question_ids)
        ? detail.question_ids.filter((id) => typeof id === 'string')
        : []
    };
  }
  return { code: detail.code };
};

export const mapMemoryReviewGroups = (groups, authorizedQuestions) => {
  const questions = Array.isArray(authorizedQuestions) ? authorizedQuestions : [];
  return (Array.isArray(groups) ? groups : []).map((group) => {
    const questionIds = Array.isArray(group?.questionIds) ? group.questionIds : [];
    const mappedQuestions = questionIds
      .map((id) => questions.find((question) => question?.id === id))
      .filter(Boolean);
    const unmappedIds = questionIds.filter(
      (id) => !questions.some((question) => question?.id === id)
    );
    return { kind: group?.kind === 'uncertain' ? 'uncertain' : 'conflict', mappedQuestions, unmappedIds };
  });
};

export const questionHasMemoryReview = (groups, questionId) =>
  (Array.isArray(groups) ? groups : []).some((group) => group?.questionIds?.includes(questionId));

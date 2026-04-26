export * from './userLevelPlaybooks';
export * from './basicPlaybooks';
export * from './expertPlaybooks';
export * from './sectorPlaybooks';
export * from './assistantCapabilityPlaybooks';

import {
  DEFAULT_USER_LEVEL,
  getUserLevelPlaybook,
  normalizeBuilderText,
  resolveUserLevel,
} from './userLevelPlaybooks';

import {
  BASIC_PLAYBOOK_ALIASES,
  BASIC_PLAYBOOK_IDS,
  BASIC_PLAYBOOKS,
  DEFAULT_BASIC_PLAYBOOK_ID,
  getBasicPlaybook,
} from './basicPlaybooks';

import {
  EXPERT_PLAYBOOK_ALIASES,
  EXPERT_PLAYBOOK_PRIORITY,
  DEFAULT_EXPERT_PLAYBOOK_ID,
  getExpertPlaybook,
} from './expertPlaybooks';

import {
  SECTOR_PLAYBOOK_ALIASES,
  SECTOR_PRIORITY,
  DEFAULT_SECTOR_PLAYBOOK_ID,
  getSectorPlaybook,
} from './sectorPlaybooks';

import {
  ASSISTANT_CAPABILITY_ALIASES,
  ASSISTANT_CAPABILITY_PRIORITY,
  DEFAULT_ASSISTANT_CAPABILITY_ID,
  getAssistantCapabilityPlaybook,
} from './assistantCapabilityPlaybooks';

export const BUILDER_PLAYBOOK_CONTEXT_TYPES = Object.freeze({
  USER_LEVEL: 'user_level',
  BASIC: 'basic',
  EXPERT: 'expert',
  SECTOR: 'sector',
  ASSISTANT_CAPABILITY: 'assistant_capability',
});

const getPriorityIndex = (priority = [], id = '') => {
  const index = priority.indexOf(id);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const scoreAliases = ({
  normalizedText = '',
  aliases = [],
} = {}) => {
  if (!normalizedText) return 0;

  return aliases.reduce((total, alias) => {
    const candidate = normalizeBuilderText(alias);

    if (!candidate) return total;

    return normalizedText.includes(candidate) ? total + 1 : total;
  }, 0);
};

const resolvePlaybookMatch = ({
  normalizedText = '',
  aliasesMap = {},
  defaultId = '',
  priority = [],
} = {}) => {
  if (!normalizedText) {
    return {
      id: defaultId,
      matched: false,
      score: 0,
    };
  }

  const matches = Object.entries(aliasesMap)
    .map(([id, aliases]) => ({
      id,
      score: scoreAliases({
        normalizedText,
        aliases,
      }),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return getPriorityIndex(priority, a.id) - getPriorityIndex(priority, b.id);
    });

  if (!matches.length) {
    return {
      id: defaultId,
      matched: false,
      score: 0,
    };
  }

  return {
    id: matches[0].id,
    matched: true,
    score: matches[0].score,
  };
};

const resolveBasicPlaybookMatch = (normalizedText = '') =>
  resolvePlaybookMatch({
    normalizedText,
    aliasesMap: BASIC_PLAYBOOK_ALIASES,
    defaultId: DEFAULT_BASIC_PLAYBOOK_ID,
    priority: [
      BASIC_PLAYBOOK_IDS.LOCAL_BUSINESS,
      BASIC_PLAYBOOK_IDS.PROFESSIONAL_SERVICE,
      BASIC_PLAYBOOK_IDS.CONVERSION_LANDING,
      BASIC_PLAYBOOK_IDS.COMMERCE,
      BASIC_PLAYBOOK_IDS.EDUCATION,
      BASIC_PLAYBOOK_IDS.SAAS_AI_TOOL,
      BASIC_PLAYBOOK_IDS.AUTOMATION_WORKFLOW,
      BASIC_PLAYBOOK_IDS.GPT_HUB_LANDING,
    ],
  });

const resolveExpertPlaybookMatch = (normalizedText = '') =>
  resolvePlaybookMatch({
    normalizedText,
    aliasesMap: EXPERT_PLAYBOOK_ALIASES,
    defaultId: DEFAULT_EXPERT_PLAYBOOK_ID,
    priority: EXPERT_PLAYBOOK_PRIORITY,
  });

const resolveSectorPlaybookMatch = (normalizedText = '') =>
  resolvePlaybookMatch({
    normalizedText,
    aliasesMap: SECTOR_PLAYBOOK_ALIASES,
    defaultId: DEFAULT_SECTOR_PLAYBOOK_ID,
    priority: SECTOR_PRIORITY,
  });

const resolveAssistantCapabilityMatch = (normalizedText = '') =>
  resolvePlaybookMatch({
    normalizedText,
    aliasesMap: ASSISTANT_CAPABILITY_ALIASES,
    defaultId: DEFAULT_ASSISTANT_CAPABILITY_ID,
    priority: ASSISTANT_CAPABILITY_PRIORITY,
  });

const getPrimarySmartQuestions = ({
  userLevelPlaybook,
  basicPlaybook,
  expertPlaybook,
  sectorPlaybook,
  assistantCapability,
} = {}) => {
  const questions = [
    ...(sectorPlaybook?.smartQuestions || []),
    ...(expertPlaybook?.smartQuestions || []),
    ...(assistantCapability?.smartQuestions || []),
    ...(basicPlaybook?.smartQuestions || []),
    ...(userLevelPlaybook?.questionStrategy?.examples || []),
  ];

  return Array.from(new Set(questions)).slice(0, 6);
};

const getPrimaryConversionRules = ({
  basicPlaybook,
  expertPlaybook,
  sectorPlaybook,
  assistantCapability,
} = {}) => {
  const rules = [
    ...(expertPlaybook?.conversionRules || []),
    ...(sectorPlaybook?.conversionRules || []),
    ...(assistantCapability?.conversionRules || []),
    ...(basicPlaybook?.conversionRules || []),
  ];

  return Array.from(new Set(rules)).slice(0, 10);
};

const getPrimaryCtas = ({
  basicPlaybook,
  sectorPlaybook,
} = {}) => {
  const ctas = [
    ...(sectorPlaybook?.primaryCtas || []),
    ...(basicPlaybook?.primaryCtas || []),
  ];

  return Array.from(new Set(ctas)).slice(0, 6);
};

export const resolveBuilderPlaybookContext = ({
  text = '',
  explicitUserLevel = '',
} = {}) => {
  const normalizedText = normalizeBuilderText(text);

  const userLevelId = resolveUserLevel({
    text,
    explicitLevel: explicitUserLevel,
  });

  const basicMatch = resolveBasicPlaybookMatch(normalizedText);
  const expertMatch = resolveExpertPlaybookMatch(normalizedText);
  const sectorMatch = resolveSectorPlaybookMatch(normalizedText);
  const assistantCapabilityMatch = resolveAssistantCapabilityMatch(normalizedText);

  const userLevelPlaybook = getUserLevelPlaybook(userLevelId);
  const basicPlaybook = getBasicPlaybook(basicMatch.id);
  const expertPlaybook = getExpertPlaybook(expertMatch.id);
  const sectorPlaybook = getSectorPlaybook(sectorMatch.id);
  const assistantCapability = getAssistantCapabilityPlaybook(
    assistantCapabilityMatch.id
  );

  return {
    originalText: text,
    normalizedText,

    userLevel: {
      id: userLevelId || DEFAULT_USER_LEVEL,
      playbook: userLevelPlaybook,
    },

    matches: {
      basic: {
        ...basicMatch,
        type: BUILDER_PLAYBOOK_CONTEXT_TYPES.BASIC,
        playbook: basicPlaybook,
      },
      expert: {
        ...expertMatch,
        type: BUILDER_PLAYBOOK_CONTEXT_TYPES.EXPERT,
        playbook: expertPlaybook,
      },
      sector: {
        ...sectorMatch,
        type: BUILDER_PLAYBOOK_CONTEXT_TYPES.SECTOR,
        playbook: sectorPlaybook,
      },
      assistantCapability: {
        ...assistantCapabilityMatch,
        type: BUILDER_PLAYBOOK_CONTEXT_TYPES.ASSISTANT_CAPABILITY,
        playbook: assistantCapability,
      },
    },

    selected: {
      userLevelPlaybook,
      basicPlaybook,
      expertPlaybook,
      sectorPlaybook,
      assistantCapability,
    },

    guidance: {
      communicationStyle: userLevelPlaybook.communicationStyle,
      responsePattern: userLevelPlaybook.responsePattern,
      primaryCtas: getPrimaryCtas({
        basicPlaybook,
        sectorPlaybook,
      }),
      smartQuestions: getPrimarySmartQuestions({
        userLevelPlaybook,
        basicPlaybook,
        expertPlaybook,
        sectorPlaybook,
        assistantCapability,
      }),
      conversionRules: getPrimaryConversionRules({
        basicPlaybook,
        expertPlaybook,
        sectorPlaybook,
        assistantCapability,
      }),
      visualDirection: {
        basic: basicPlaybook.visualDirection,
        sector: sectorPlaybook.visualDirection,
      },
      agentCues: [
        sectorPlaybook.agentCue,
        expertPlaybook.agentResponsePattern,
        assistantCapability.agentCue,
        basicPlaybook.defaultAgentMessage,
      ].filter(Boolean),
    },
  };
};

export const getDefaultBuilderPlaybookContext = () =>
  resolveBuilderPlaybookContext({
    text: '',
  });

export const getBuilderPlaybookCatalog = () => ({
  basic: Object.values(BASIC_PLAYBOOKS),
});
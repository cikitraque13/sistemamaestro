import {
  DEFAULT_SECTOR_PROFILE_ID,
  getAllBuilderSectorProfiles,
  getBuilderSectorProfile,
} from './builderSectorProfiles';

const normalizeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const includesAny = (text = '', terms = []) => {
  const normalized = normalizeText(text);

  return terms.some((term) => normalized.includes(normalizeText(term)));
};

const getArray = (value) => (Array.isArray(value) ? value : []);

export const collectBuilderSectorContext = ({
  copy = {},
  project = null,
  builderIntelligence = null,
} = {}) => {
  const hubSummary = builderIntelligence?.hubSummary || {};
  const lastDelta = builderIntelligence?.lastDelta || {};
  const lastOperation = builderIntelligence?.lastOperation || {};
  const builderKernelOutput =
    builderIntelligence?.builderKernelOutput ||
    builderIntelligence?.builderKernelResult?.output ||
    {};

  const previewSnapshot = builderKernelOutput?.preview || {};
  const builderAI =
    builderIntelligence?.builderKernelResult?.meta?.builderAI ||
    builderIntelligence?.builderKernelResult?.builderAI ||
    {};

  return [
    project?.input_content,
    project?.prompt,
    project?.title,
    project?.summary,
    copy?.eyebrow,
    copy?.headline,
    copy?.subheadline,
    copy?.sectionTitle,
    copy?.sectionText,
    hubSummary?.projectType,
    hubSummary?.category,
    hubSummary?.businessModel,
    hubSummary?.primaryPlaybook,
    hubSummary?.operationalFocus,
    hubSummary?.conversionTarget,
    hubSummary?.primaryCTA,
    lastDelta?.copy?.headline,
    lastDelta?.copy?.subheadline,
    lastDelta?.cta?.primaryCTA,
    lastOperation?.label,
    lastOperation?.description,
    builderAI?.projectKind,
    builderAI?.sector,
    builderAI?.objective,
    builderAI?.tone,
    previewSnapshot?.layout,
    ...getArray(previewSnapshot?.sections).flatMap((section) => [
      section?.id,
      section?.type,
      section?.label,
      section?.title,
      section?.subtitle,
      section?.cta,
      section?.props?.title,
      section?.props?.subtitle,
      section?.props?.buttonLabel,
      ...getArray(section?.items),
      ...getArray(section?.props?.items),
      ...getArray(section?.props?.points),
    ]),
  ]
    .filter(Boolean)
    .join(' ');
};

export const extractCityFromContext = (contextText = '') => {
  const normalized = normalizeText(contextText);

  const cities = [
    'Madrid',
    'Barcelona',
    'Valencia',
    'Sevilla',
    'Málaga',
    'Zaragoza',
    'Bilbao',
    'Alicante',
    'Murcia',
    'Valladolid',
    'Granada',
    'Córdoba',
    'Santander',
    'Vigo',
    'Gijón',
  ];

  return cities.find((city) => normalized.includes(normalizeText(city))) || '';
};

export const extractBusinessNameFromContext = ({
  contextText = '',
  fallback = '',
} = {}) => {
  const raw = String(contextText || '');

  const namedMatch =
    raw.match(/(?:llamad[ao]|nombre|marca)\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s&.-]{2,64})/i) ||
    raw.match(/para\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s&.-]{2,64})/);

  if (!namedMatch?.[1]) return fallback;

  const name = namedMatch[1]
    .replace(/\s+(debe|con|que|en|para|de)\s+.*$/i, '')
    .replace(/[.,;:]+$/g, '')
    .trim();

  return name || fallback;
};

export const resolveBuilderSectorProfile = ({
  copy = {},
  project = null,
  builderIntelligence = null,
} = {}) => {
  const contextText = collectBuilderSectorContext({
    copy,
    project,
    builderIntelligence,
  });

  const profiles = getAllBuilderSectorProfiles();

  const scoredProfiles = profiles.map((profile) => {
    const score = profile.matchers.reduce(
      (total, matcher) =>
        includesAny(contextText, [matcher]) ? total + 1 : total,
      0
    );

    return {
      profile,
      score,
    };
  });

  const bestMatch = scoredProfiles
    .filter(({ profile }) => profile.id !== DEFAULT_SECTOR_PROFILE_ID)
    .sort((a, b) => b.score - a.score)[0];

  const profile =
    bestMatch?.score > 0
      ? bestMatch.profile
      : getBuilderSectorProfile(DEFAULT_SECTOR_PROFILE_ID);

  const city = extractCityFromContext(contextText);

  const businessName = extractBusinessNameFromContext({
    contextText,
    fallback: city
      ? `${profile.defaultBusinessName} ${city}`
      : profile.defaultBusinessName,
  });

  return {
    profile,
    profileId: profile.id,
    contextText,
    city,
    businessName,
    confidence: bestMatch?.score || 0,
  };
};

export const buildSectorLandingModel = ({
  copy = {},
  project = null,
  builderIntelligence = null,
} = {}) => {
  const resolved = resolveBuilderSectorProfile({
    copy,
    project,
    builderIntelligence,
  });

  const {
    profile,
    businessName,
    city,
  } = resolved;

  return {
    ...profile,
    city,
    businessName,
    resolvedProfileId: profile.id,

    tone: profile.tone || 'contextual',
    eyebrow: profile.heroEyebrow,
    headline: profile.headline,
    subheadline: profile.subheadline,
    primaryCTA: profile.primaryCTA,
    secondaryCTA: profile.secondaryCTA,

    sectionTitle: profile.servicesTitle,
    sectionText: profile.servicesIntro,
    services: profile.services || [],

    trustLabel: 'Confianza',
    trustTitle: profile.trustTitle,
    trust: profile.trustPoints || [],

    processTitle: profile.processTitle,
    processSteps: profile.processSteps || [],

    testimonialTitle: profile.testimonialTitle,
    testimonialLabel: profile.testimonialLabel || 'Prueba social',
    testimonials: profile.testimonials || [],

    offerLabel: profile.offerLabel || 'servicios',
    audienceLabel: profile.audienceLabel || 'clientes',

    booking: {
      title: profile.formTitle,
      text: profile.formText,
      fields: profile.formFields || ['Nombre', 'Email', 'Teléfono', 'Mensaje'],
      buttonLabel: profile.formButtonLabel || profile.primaryCTA,
    },

    automationLabel: 'Seguimiento',
    automation: {
      title: profile.automationTitle,
      text: profile.automationText,
      items: profile.automationItems || [],
    },

    finalCTA: profile.finalCTA || profile.primaryCTA,
  };
};
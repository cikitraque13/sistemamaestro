import { derivePreviewPhase } from './model';

export const initialStudioState = {
  composer: { draft: '', pace: 'rapido' },
  ui: {
    chatOpen: true,
    noticeDismissed: false,
    codeOpen: false,
    surface: 'preview',
    resuming: false,
    attachmentNote: '',
    micNote: '',
    copyNote: '',
    frameKey: 0,
    visibleVersion: null,
    reactions: {},
  },
  htmlByVersion: {},
  publication: null,
  publicationNote: '',
};

export function builderStudioReducer(state, action) {
  switch (action.type) {
    case 'draft':
      return { ...state, composer: { ...state.composer, draft: action.draft } };
    case 'pace':
      if (action.pace !== 'rapido' && action.pace !== 'profundo') return state;
      return { ...state, composer: { ...state.composer, pace: action.pace } };
    case 'clear-draft':
      return { ...state, composer: { ...state.composer, draft: '' } };
    case 'toggle-chat':
      return { ...state, ui: { ...state.ui, chatOpen: !state.ui.chatOpen } };
    case 'dismiss-notice':
      return { ...state, ui: { ...state.ui, noticeDismissed: true } };
    case 'surface':
      return { ...state, ui: { ...state.ui, surface: action.surface === 'live' ? 'live' : 'preview' } };
    case 'toggle-code':
      return { ...state, ui: { ...state.ui, codeOpen: !state.ui.codeOpen } };
    case 'resume-start':
      return { ...state, ui: { ...state.ui, resuming: true } };
    case 'resume-end':
      return { ...state, ui: { ...state.ui, resuming: false, frameKey: state.ui.frameKey + 1 } };
    case 'refresh-frame':
      return { ...state, ui: { ...state.ui, frameKey: state.ui.frameKey + 1 } };
    case 'note':
      return { ...state, ui: { ...state.ui, [action.key]: action.text } };
    case 'reaction':
      return {
        ...state,
        ui: { ...state.ui, reactions: { ...state.ui.reactions, [action.id]: action.value } },
      };
    case 'visible-version':
      return { ...state, ui: { ...state.ui, visibleVersion: action.version } };
    case 'publication':
      return { ...state, publication: action.publication, publicationNote: action.note || '' };
    case 'remember-html': {
      if (!action.version || !action.html) return state;
      if (state.htmlByVersion[action.version] === action.html) return state;
      return {
        ...state,
        htmlByVersion: { ...state.htmlByVersion, [action.version]: action.html },
        ui: state.ui.visibleVersion == null
          ? { ...state.ui, visibleVersion: action.version }
          : state.ui,
      };
    }
    default:
      return state;
  }
}

export function previewPhaseOf(studio, runtime) {
  const html = runtime?.generatedPreview?.html || '';
  const phase = runtime?.executor?.phase || runtime?.previewPhase || '';
  const failed = phase === 'error' || runtime?.previewPhase === 'error';
  const busy = !failed && (phase === 'construyendo' || phase === 'iterando' || runtime?.previewPhase === 'working');
  return derivePreviewPhase({
    resuming: Boolean(studio?.ui?.resuming),
    failed,
    busy,
    html,
  });
}

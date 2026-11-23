// Traspaso de la idea escrita en la portada pública hacia el lanzador del Builder.
// Si el usuario no ha iniciado sesión, la idea se guarda en sessionStorage y se
// recupera en /dashboard tras el registro o el login (email o Google).

export const HOME_IDEA_STORAGE_KEY = 'sm_home_idea';
export const HOME_IDEA_MAX_LENGTH = 4000;

export const saveHomeIdea = (idea) => {
  try {
    window.sessionStorage.setItem(HOME_IDEA_STORAGE_KEY, idea);
  } catch (error) {
    // sessionStorage no disponible: la idea no se conserva, el flujo sigue.
  }
};

export const readHomeIdea = () => {
  try {
    const raw = window.sessionStorage.getItem(HOME_IDEA_STORAGE_KEY);
    const idea = typeof raw === 'string' ? raw.trim() : '';
    return idea ? idea.slice(0, HOME_IDEA_MAX_LENGTH) : '';
  } catch (error) {
    return '';
  }
};

export const clearHomeIdea = () => {
  try {
    window.sessionStorage.removeItem(HOME_IDEA_STORAGE_KEY);
  } catch (error) {
    // Sin acción.
  }
};

export const buildHomeIdeaLauncherState = (idea) => ({
  focus: 'builder-launcher',
  source: 'home-idea',
  initialPrompt: idea,
});

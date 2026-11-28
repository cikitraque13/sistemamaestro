import React, { useMemo, useReducer } from 'react';

import { builderStudioReducer, initialStudioState } from './store';

const BuilderStudioContext = React.createContext(null);

export function BuilderStudioProvider({ credits = 0, freeTestMode = false, children }) {
  const [state, dispatch] = useReducer(builderStudioReducer, initialStudioState);
  const value = useMemo(() => ({
    state,
    dispatch,
    credits: Number.isFinite(Number(credits)) ? Math.trunc(Number(credits)) : 0,
    freeTestMode: Boolean(freeTestMode),
  }), [state, credits, freeTestMode]);
  return (
    <BuilderStudioContext.Provider value={value}>
      {children}
    </BuilderStudioContext.Provider>
  );
}

export function useBuilderStudio() {
  return React.useContext(BuilderStudioContext);
}

export function useStudioControls() {
  const shared = useBuilderStudio();
  const [local, localDispatch] = useReducer(builderStudioReducer, initialStudioState);
  if (shared) return shared;
  return {
    state: local,
    dispatch: localDispatch,
    credits: 0,
    freeTestMode: false,
  };
}

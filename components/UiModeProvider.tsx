"use client";

import React, { createContext, useContext } from 'react';

export type UiMode = 'classic' | 'v2';
const UiModeContext = createContext<UiMode>('classic');

export function UiModeProvider({ mode, children }: { mode: UiMode; children: React.ReactNode }) {
  return <UiModeContext.Provider value={mode}>{children}</UiModeContext.Provider>;
}

export const useUiMode = () => useContext(UiModeContext);

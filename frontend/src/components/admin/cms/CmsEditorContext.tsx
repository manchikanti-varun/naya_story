"use client";

import { createContext, useContext, type ReactNode } from "react";

type CmsEditorContextValue = {
  /** Drawer / inline panel — hides duplicate shell chrome. */
  compact: boolean;
};

const CmsEditorContext = createContext<CmsEditorContextValue>({ compact: false });

export function CmsEditorProvider({
  compact = false,
  children,
}: {
  compact?: boolean;
  children: ReactNode;
}) {
  return <CmsEditorContext.Provider value={{ compact }}>{children}</CmsEditorContext.Provider>;
}

export function useCmsEditorContext() {
  return useContext(CmsEditorContext);
}

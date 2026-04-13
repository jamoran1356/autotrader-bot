"use client";

import { AppStateProvider } from "@/lib/app-state";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}

"use client";

import { createContext, useCallback, useContext, useMemo } from "react";

export interface ChallengeOption {
  slug: string;
  title: string;
}

const ChallengeOptionsContext = createContext<ChallengeOption[]>([]);

/** Gives every component below it the list of challenges (loaded from the database). */
export function ChallengeOptionsProvider({
  options,
  children,
}: {
  options: ChallengeOption[];
  children: React.ReactNode;
}) {
  return (
    <ChallengeOptionsContext.Provider value={options}>{children}</ChallengeOptionsContext.Provider>
  );
}

export function useChallengeOptions() {
  const options = useContext(ChallengeOptionsContext);
  const label = useCallback(
    (slug: string) => options.find((o) => o.slug === slug)?.title ?? slug,
    [options]
  );
  return useMemo(() => ({ options, label }), [options, label]);
}

"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Vrai uniquement après l'hydratation : évite les écarts serveur/client (thème, session, dates) */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

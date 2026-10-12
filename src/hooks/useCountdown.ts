"use client";

import { useEffect, useState } from "react";

export interface Countdown {
  jours: number;
  heures: number;
  minutes: number;
  secondes: number;
  isPast: boolean;
}

/** Renvoie `null` jusqu'au premier tick côté client (l'heure du serveur ferait diverger l'hydratation) */
export function useCountdown(targetIso: string): Countdown | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  if (now === null) return null;
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  return {
    jours: Math.floor(diff / 86_400_000),
    heures: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    secondes: Math.floor(diff / 1000) % 60,
    isPast: diff === 0,
  };
}

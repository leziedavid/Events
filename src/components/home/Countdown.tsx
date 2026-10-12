"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";
import { useEventInfo } from "@/hooks/useWedding";

function Unit({ value, label }: { value: number | null; label: string }) {
  const text = value === null ? "--" : String(value).padStart(2, "0");
  return (
    <div className="glass flex w-[4.4rem] flex-col items-center rounded-2xl py-3 sm:w-24 sm:py-4">
      <span className="relative block h-9 overflow-hidden font-display text-3xl font-semibold tabular-nums sm:h-11 sm:text-4xl">
        {/* Chaque changement de valeur glisse vers le haut, comme un compteur mécanique */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            className="block"
            initial={{ y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -22, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">{label}</span>
    </div>
  );
}

export function Countdown() {
  const c = useCountdown(useEventInfo().date);

  if (c?.isPast) {
    return <p className="font-display text-2xl italic text-gold">C&apos;est le grand jour !</p>;
  }
  return (
    <div className="flex gap-2 sm:gap-3" role="timer" aria-label="Compte à rebours jusqu'au mariage">
      <Unit value={c?.jours ?? null} label="Jours" />
      <Unit value={c?.heures ?? null} label="Heures" />
      <Unit value={c?.minutes ?? null} label="Minutes" />
      <Unit value={c?.secondes ?? null} label="Secondes" />
    </div>
  );
}

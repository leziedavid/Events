"use client";

import { motion } from "framer-motion";
import { Armchair } from "lucide-react";
import { wedding } from "@/config/wedding";
import { useCapacity } from "@/hooks/useWedding";
import { cn } from "@/lib/utils";

/** « Places restantes : 72 / 150 », mis à jour à chaque confirmation */
export function CapacityMeter({ className }: { className?: string }) {
  const { data } = useCapacity();
  const capacity = data?.capacity ?? wedding.capacity;
  const remaining = data?.remaining;
  const filled = data ? (data.confirmed / capacity) * 100 : 0;

  return (
    <div className={cn("w-full", className)} aria-live="polite">
      <div className="flex items-end justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Armchair className="size-4 text-gold" />
          Places restantes
        </span>
        <span className="font-display text-2xl font-semibold tabular-nums">
          {remaining ?? "…"} <span className="text-base font-normal text-muted-foreground">/ {capacity}</span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full", data?.isFull ? "bg-destructive" : "bg-gradient-to-r from-gold-soft to-gold")}
          initial={{ width: 0 }}
          animate={{ width: `${filled}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

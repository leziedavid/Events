"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
  color?: string;
}

export function KpiCard({ icon: Icon, label, value, hint, color = "var(--muted-foreground)" }: KpiCardProps) {
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  // Le chiffre « compte » jusqu'à sa valeur, puis suit les mises à jour en direct
  useEffect(() => {
    if (reduce) return count.set(value);
    const controls = animate(count, value, { duration: 0.7, ease: "easeOut" });
    return () => controls.stop();
  }, [value, count, reduce]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0" style={{ color }} />
      </div>
      <motion.p className="mt-1.5 text-3xl font-semibold tabular-nums">{rounded}</motion.p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

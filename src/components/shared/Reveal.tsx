"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Décalage de départ en pixels (vertical par défaut) */
  y?: number;
  x?: number;
  scale?: number;
}

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Apparition progressive au défilement, jouée une seule fois */
export function Reveal({ children, className, delay = 0, y = 28, x = 0, scale = 1 }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

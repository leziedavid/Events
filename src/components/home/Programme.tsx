"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Camera, Church, GlassWater, Music, Utensils, type LucideIcon } from "lucide-react";
import { useRef } from "react";
import { SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { wedding, type ProgrammeItem } from "@/config/wedding";
import { cn } from "@/lib/utils";

// Deux anneaux entrelacés : lucide n'a pas d'icône d'alliances
function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="15" cy="14" r="5.5" />
      <path d="M12 4.5 10.5 3h3L12 4.5Z" fill="currentColor" />
    </svg>
  );
}

const ICONS: Record<ProgrammeItem["icon"], LucideIcon | typeof Rings> = {
  rings: Rings,
  church: Church,
  camera: Camera,
  glass: GlassWater,
  utensils: Utensils,
  music: Music,
};

export function Programme() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  // Le filet doré se trace au fil du défilement
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="programme" className="ambient-bg px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="Le déroulement" title="Programme de la journée">
        Chaque moment a été pensé pour vous. Voici le fil de cette journée que nous avons hâte de vivre à vos côtés.
      </SectionTitle>

      <ol ref={ref} className="relative mx-auto mt-16 max-w-4xl">
        <span aria-hidden className="absolute bottom-0 left-6 top-0 w-px bg-border md:left-1/2" />
        <motion.span
          aria-hidden
          style={{ scaleY: reduce ? 1 : progress }}
          className="absolute bottom-0 left-6 top-0 w-px origin-top bg-gold md:left-1/2"
        />

        {wedding.programme.map((step, i) => {
          const Icon = ICONS[step.icon];
          const left = i % 2 === 0;
          return (
            <li key={step.titre} className="relative mb-8 pl-16 last:mb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
              <span className="absolute left-6 top-6 z-10 grid size-11 -translate-x-1/2 place-items-center rounded-full border border-gold bg-card text-gold shadow-lg md:left-1/2">
                <Icon className="size-5" />
              </span>
              <Reveal x={left ? -36 : 36} y={0} className={cn(left ? "md:col-start-1 md:text-right" : "md:col-start-2")}>
                <div className="glass lift rounded-3xl p-6">
                  <p className="font-display text-3xl font-semibold text-gold">{step.heure}</p>
                  <h3 className="mt-1 font-display text-2xl">{step.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { GoldFrame, SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { defaultStory, wedding } from "@/config/wedding";
import { useEventInfo, useSettings } from "@/hooks/useWedding";

function Person({ prenom, role, parents, delay }: { prenom: string; role: string; parents: string; delay: number }) {
  return (
    <Reveal delay={delay} className="glass lift rounded-3xl p-6 text-center sm:p-8">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{role}</p>
      <p className="mt-2 font-script text-6xl leading-tight">{prenom}</p>
      {/* Les parents ne s'affichent que s'ils sont renseignés dans /admin?tab=accueil */}
      {parents && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="block text-xs uppercase tracking-widest">Enfant de</span>
          <span className="mt-1 block font-display text-lg text-foreground">{parents}</span>
        </p>
      )}
    </Reveal>
  );
}

export function Couple() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const event = useEventInfo();
  const story = useSettings().data?.story ?? defaultStory;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [50, -50]);

  return (
    <section id="maries" className="relative overflow-hidden px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="Notre histoire" title="Les mariés" />

      <div ref={ref} className="mx-auto mt-20 grid max-w-6xl items-center gap-20 lg:grid-cols-2 lg:gap-16">
        <motion.div style={{ y }} className="mx-auto w-[min(72vw,20rem)] lg:w-[23rem]">
          <Reveal scale={0.92}>
            <GoldFrame src={wedding.images.traditionnel} alt="Les mariés en tenue traditionnelle" />
          </Reveal>
        </motion.div>

        <div>
          <Reveal>
            <blockquote className="text-center font-display text-2xl italic leading-relaxed sm:text-3xl lg:text-left">
              «&nbsp;{story.text}&nbsp;»
            </blockquote>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <Person prenom={event.groomName} role="Le marié" parents={story.groomParents} delay={0.1} />
            <Person prenom={event.brideName} role="La mariée" parents={story.brideParents} delay={0.22} />
          </div>
        </div>
      </div>
    </section>
  );
}

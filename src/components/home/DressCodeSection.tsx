"use client";

import { Info } from "lucide-react";
import { SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { defaultDressCode } from "@/config/wedding";
import { useSettings } from "@/hooks/useWedding";

/** Rubrique « Dress code » : consigne de tenue et couleurs du mariage, gérées dans /admin?tab=accueil */
export function DressCodeSection() {
  const dressCode = useSettings().data?.dressCode ?? defaultDressCode;

  return (
    <section id="dress-code" className="px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="Dress code" title={dressCode.title}>
        {dressCode.description}
      </SectionTitle>

      {dressCode.colors.length > 0 && (
        <ul className="mx-auto mt-14 flex max-w-4xl flex-wrap justify-center gap-x-8 gap-y-10 sm:gap-x-12">
          {dressCode.colors.map((color, i) => (
            <li key={`${color.hex}-${i}`} className="w-24 text-center sm:w-28">
              <Reveal delay={Math.min(i * 0.08, 0.4)} scale={0.8}>
                {/* Bordure fine : les couleurs claires (ivoire, blanc) restent visibles sur le fond */}
                <span className="mx-auto block size-20 rounded-full border border-border sm:size-24" style={{ backgroundColor: color.hex }} aria-hidden />
                <p className="mt-3 font-display text-xl leading-tight">{color.name}</p>
                <p className="mt-0.5 font-mono text-xs uppercase text-muted-foreground">{color.hex}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      )}

      {dressCode.note && (
        <Reveal className="mx-auto mt-12 flex max-w-xl items-start justify-center gap-2 text-center text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-gold" />
          <p>{dressCode.note}</p>
        </Reveal>
      )}
    </section>
  );
}

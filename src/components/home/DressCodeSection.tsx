"use client";

import { Info } from "lucide-react";
import { SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { defaultDressCode } from "@/config/wedding";
import { useSettings } from "@/hooks/useWedding";

/** Nuances d'une couleur, de la plus foncée à la plus claire (calculées par le navigateur) */
const nuances = (hex: string) => [
  `color-mix(in oklab, ${hex} 70%, black)`,
  hex,
  `color-mix(in oklab, ${hex} 55%, white)`,
];

/**
 * Rubrique « Dress code » : consigne de tenue et couleurs du mariage, gérées dans
 * /admin?tab=accueil. Chaque couleur est présentée « nuancée » : toutes ses teintes, de la plus
 * profonde à la plus claire, conviennent.
 */
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
            <li key={`${color.hex}-${i}`} className="w-32 text-center sm:w-36">
              <Reveal delay={Math.min(i * 0.08, 0.4)} scale={0.8}>
                {/* Pastille en dégradé des nuances ; bordure fine pour les teintes claires sur fond beige */}
                <span
                  className="mx-auto block size-24 rounded-full border border-border sm:size-28"
                  style={{ backgroundImage: `linear-gradient(135deg, ${nuances(color.hex).join(", ")})` }}
                  aria-hidden
                />
                <span className="mx-auto mt-3 flex w-fit gap-1.5" aria-hidden>
                  {nuances(color.hex).map((shade) => (
                    <span key={shade} className="size-4 rounded-full border border-border" style={{ backgroundColor: shade }} />
                  ))}
                </span>
                <p className="mt-3 font-display text-xl leading-tight">{color.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">et ses nuances</p>
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

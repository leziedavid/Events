"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Camera, Church, GlassWater, MapPin, Music, Utensils, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { defaultCeremony, defaultSettings, defaultTownHall, hasPlace, mapsDirectionsUrl, wedding } from "@/config/wedding";
import { useEventInfo, useHomeSections, useSettings } from "@/hooks/useWedding";
import { cn } from "@/lib/utils";
import type { ProgrammeIcon, ProgrammeStep } from "@/types/interface";

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

export const PROGRAMME_ICONS: Record<ProgrammeIcon, LucideIcon | typeof Rings> = {
  rings: Rings,
  church: Church,
  camera: Camera,
  glass: GlassWater,
  utensils: Utensils,
  music: Music,
};

const PHOTOS = { traditionnel: wedding.images.traditionnel, portrait: wedding.images.portrait } as const;

export function Programme() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { programmePhoto, programmePhotoUrl } = useHomeSections();
  const event = useEventInfo();
  const settings = useSettings().data;
  const ceremony = settings?.ceremony ?? defaultCeremony;
  const townHall = settings?.townHall ?? defaultTownHall;
  const steps = settings?.programme ?? defaultSettings.programme;

  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 60%"] });
  // Le filet doré se trace au fil du défilement
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  // La photo envoyée défile plus lentement que le contenu (parallaxe)
  const { scrollYProgress: sectionProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const photoY = useTransform(sectionProgress, [0, 1], reduce ? ["0%", "0%"] : ["-6%", "6%"]);

  // Les deux photos fournies ne font que 590 px : étirées en plein écran elles deviennent floues.
  // Elles restent donc à leur taille réelle, au centre de l'écran ; une photo envoyée par
  // l'organisateur (1920 px) peut, elle, couvrir toute la section.
  const builtinPhoto = programmePhoto === "traditionnel" || programmePhoto === "portrait" ? PHOTOS[programmePhoto] : null;
  const customPhoto = programmePhoto === "personnalisee" && programmePhotoUrl ? programmePhotoUrl : null;
  const hasPhoto = !!(builtinPhoto || customPhoto);
  // Lieu d'une étape (lien « Itinéraire ») ; une mairie non renseignée n'affiche pas de lien
  const placeOf = (step: ProgrammeStep) => {
    if (step.place === "townHall") return hasPlace(townHall) ? townHall : null;
    if (step.place === "ceremony") return ceremony;
    if (step.place === "reception") return { name: event.venueName, address: event.venueAddress };
    // Lieu saisi à la main dans /admin?tab=programme
    if (step.place === "custom") {
      const custom = { name: step.placeName ?? "", address: step.placeAddress ?? "" };
      return hasPlace(custom) ? custom : null;
    }
    return null;
  };

  return (
    <section
      ref={sectionRef}
      id="programme"
      // Avec photo, la section passe en palette nuit (classe `dark`) : le bleu nuit prolonge le
      // fond de studio des photos et le texte reste lisible par-dessus.
      // `overflow-clip` et non `overflow-hidden` : ce dernier empêcherait la photo de rester fixe.
      className={cn("relative overflow-clip px-6 py-24 sm:py-32", hasPhoto ? "dark bg-background text-foreground" : "ambient-bg")}
    >
      {builtinPhoto && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* La photo reste au centre de l'écran pendant qu'on fait défiler le programme */}
          <div className="sticky top-0 flex h-[100svh] items-center justify-center">
            <div className="relative aspect-square w-full max-w-[590px] [mask-image:radial-gradient(closest-side,black_72%,transparent)]">
              <Image src={builtinPhoto} alt="" fill sizes="590px" className="object-cover" />
            </div>
          </div>
        </div>
      )}
      {customPhoto && (
        <motion.div aria-hidden style={{ y: photoY }} className="pointer-events-none absolute -inset-y-[8%] inset-x-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- image envoyée (data URL), hors optimiseur */}
          <img src={customPhoto} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-background/45" />
        </motion.div>
      )}

      <div className="relative">
        <div className={cn(hasPhoto && "glass mx-auto max-w-2xl rounded-3xl px-6 py-8")}>
          <SectionTitle eyebrow="Le déroulement" title="Programme de la journée">
            Chaque moment a été pensé pour vous. Voici le fil de cette journée que nous avons hâte de vivre à vos côtés.
          </SectionTitle>
        </div>

        <ol ref={listRef} className="relative mx-auto mt-16 max-w-4xl">
          <span aria-hidden className="absolute bottom-0 left-6 top-0 w-px bg-border md:left-1/2" />
          <motion.span
            aria-hidden
            style={{ scaleY: reduce ? 1 : progress }}
            className="absolute bottom-0 left-6 top-0 w-px origin-top bg-gold md:left-1/2"
          />

          {steps.map((step, i) => {
            const Icon = PROGRAMME_ICONS[step.icon];
            const left = i % 2 === 0;
            const place = placeOf(step);
            return (
              <li key={step.id} className="relative mb-8 pl-16 last:mb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
                <span className="absolute left-6 top-6 z-10 grid size-11 -translate-x-1/2 place-items-center rounded-full border border-gold bg-card text-gold md:left-1/2">
                  <Icon className="size-5" />
                </span>
                <Reveal x={left ? -36 : 36} y={0} className={cn(left ? "md:col-start-1 md:text-right" : "md:col-start-2")}>
                  <div className="glass lift rounded-3xl p-6">
                    <p className="font-display text-3xl font-semibold text-gold">{step.heure}</p>
                    <h3 className="mt-1 font-display text-2xl">{step.titre}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                    {place && (
                      <a
                        href={mapsDirectionsUrl(place.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold underline-offset-4 hover:underline"
                      >
                        <MapPin className="size-4" />
                        {place.name} · Itinéraire
                      </a>
                    )}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { wedding } from "@/config/wedding";
import { cn } from "@/lib/utils";

const photos = wedding.gallery;

export function Gallery() {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setActive((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  const step = (delta: number) => setActive((i) => (i === null ? i : (i + delta + photos.length) % photos.length));

  return (
    <section id="galerie" className="px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="Souvenirs" title="Galerie photo" />

      {/* Masonry en colonnes CSS : chaque vignette garde son propre ratio */}
      <div className="mx-auto mt-14 max-w-6xl columns-2 gap-3 sm:gap-4 lg:columns-3">
        {photos.map((photo, i) => (
          <Reveal key={i} delay={(i % 3) * 0.1} scale={0.94} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Agrandir : ${photo.alt}`}
              className={cn("group relative block w-full overflow-hidden rounded-2xl bg-navy", photo.ratio)}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 380px"
                className={cn("object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110", photo.position)}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="absolute inset-x-4 bottom-4 translate-y-3 text-left font-display text-lg italic text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                {photo.alt}
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={photos[active].alt}
          >
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="relative aspect-square w-full max-w-[min(90vw,80vh)] overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={photos[active].src} alt={photos[active].alt} fill sizes="90vw" className="object-contain" />
            </motion.div>
            <button type="button" onClick={() => setActive(null)} aria-label="Fermer" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <X />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Photo précédente" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <ChevronLeft />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Photo suivante" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <ChevronRight />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

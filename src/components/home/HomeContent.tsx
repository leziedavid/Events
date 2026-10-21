"use client";

import { Couple } from "@/components/home/Couple";
import { DressCodeSection } from "@/components/home/DressCodeSection";
import { Gallery } from "@/components/home/Gallery";
import { Guestbook } from "@/components/home/Guestbook";
import { Hero } from "@/components/home/Hero";
import { MenuSection } from "@/components/home/MenuSection";
import { Programme } from "@/components/home/Programme";
import { RsvpCta } from "@/components/home/RsvpCta";
import { Venue } from "@/components/home/Venue";
import { useHomeSections } from "@/hooks/useWedding";

/**
 * Sections de l'accueil, dans l'ordre de la page. Celles qui sont masquées dans
 * /admin?tab=accueil ne sont pas rendues du tout ; la bannière et le bloc RSVP restent toujours.
 */
export function HomeContent() {
  const sections = useHomeSections();

  return (
    <main>
      <Hero />
      {sections.programme && <Programme />}
      {sections.dressCode && <DressCodeSection />}
      {sections.menu && <MenuSection />}
      {sections.gallery && <Gallery />}
      {sections.venue && <Venue />}
      <RsvpCta />
      {sections.guestbook && <Guestbook />}
      {/* « Notre histoire » est placée en fin de page, à la demande des mariés */}
      {sections.story && <Couple />}
    </main>
  );
}

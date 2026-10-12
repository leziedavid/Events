import { Couple } from "@/components/home/Couple";
import { Gallery } from "@/components/home/Gallery";
import { Guestbook } from "@/components/home/Guestbook";
import { Hero } from "@/components/home/Hero";
import { MenuSection } from "@/components/home/MenuSection";
import { Programme } from "@/components/home/Programme";
import { RsvpCta } from "@/components/home/RsvpCta";
import { Venue } from "@/components/home/Venue";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Couple />
        <Programme />
        <MenuSection />
        <Gallery />
        <Venue />
        <RsvpCta />
        <Guestbook />
      </main>
      <SiteFooter />
    </>
  );
}

"use client";

import { CalendarDays, Clock, MapPin, Navigation } from "lucide-react";
import { SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { mapsDirectionsUrl, mapsEmbedUrl, weddingDateLabel, weddingTimeLabel } from "@/config/wedding";
import { useEventInfo } from "@/hooks/useWedding";
import { cn } from "@/lib/utils";

export function Venue() {
  const event = useEventInfo();
  const infos = [
    { icon: CalendarDays, label: "Date", value: weddingDateLabel(event.date) },
    { icon: Clock, label: "Accueil des invités", value: weddingTimeLabel(event.date) },
    { icon: MapPin, label: "Adresse", value: `${event.venueName}, ${event.venueAddress}` },
  ];

  return (
    <section id="lieu" className="ambient-bg px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="Nous rejoindre" title="Le lieu de la réception" />

      <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal x={-30} y={0} className="glass flex flex-col rounded-3xl p-7 sm:p-9">
          <ul className="space-y-6">
            {infos.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/40 text-gold">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className="mt-0.5 font-display text-xl">{value}</p>
                </div>
              </li>
            ))}
          </ul>
          <a href={mapsDirectionsUrl(event.venueAddress)} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg" }), "mt-9 w-full lg:mt-auto")}>
            <Navigation />
            Voir l&apos;itinéraire
          </a>
        </Reveal>

        <Reveal x={30} y={0} className="glass overflow-hidden rounded-3xl p-2">
          <iframe
            src={mapsEmbedUrl(event.venueAddress)}
            title={`Carte : ${event.venueAddress}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full rounded-[1.25rem] border-0 lg:h-full lg:min-h-[26rem] dark:[filter:invert(0.9)_hue-rotate(180deg)_saturate(0.8)]"
          />
        </Reveal>
      </div>
    </section>
  );
}

"use client";

import { Church, Clock, MapPin, Navigation, PartyPopper, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { defaultCeremony, defaultSettings, mapsDirectionsUrl, mapsEmbedUrl, weddingDateLabel, weddingTimeLabel } from "@/config/wedding";
import { useEventInfo, useSettings } from "@/hooks/useWedding";
import { cn } from "@/lib/utils";

type PlaceId = "ceremony" | "reception";

interface Place {
  id: PlaceId;
  label: string;
  icon: LucideIcon;
  name: string;
  address: string;
  time: string;
}

/** Les deux lieux du jour : la bénédiction nuptiale puis la réception, chacun avec son itinéraire */
export function Venue() {
  const event = useEventInfo();
  const settings = useSettings().data;
  const ceremony = settings?.ceremony ?? defaultCeremony;
  // Une seule source pour l'heure : l'étape du programme rattachée à la bénédiction
  const ceremonyTime = (settings?.programme ?? defaultSettings.programme).find((s) => s.place === "ceremony")?.heure ?? "";
  const [selected, setSelected] = useState<PlaceId>("ceremony");

  const places: Place[] = [
    { id: "ceremony", label: "Bénédiction nuptiale", icon: Church, name: ceremony.name, address: ceremony.address, time: ceremonyTime },
    { id: "reception", label: "Réception", icon: PartyPopper, name: event.venueName, address: event.venueAddress, time: weddingTimeLabel(event.date) },
  ];
  const shown = places.find((p) => p.id === selected) ?? places[0];

  return (
    <section id="lieu" className="ambient-bg px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="Nous rejoindre" title="Les lieux">
        {weddingDateLabel(event.date)}
      </SectionTitle>

      <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-4">
          {places.map((place, i) => (
            <Reveal key={place.id} x={-30} y={0} delay={i * 0.1}>
              {/* Toute la carte sélectionne le lieu affiché sur le plan ; le bouton ouvre l'itinéraire */}
              <div
                className={cn(
                  "glass rounded-3xl p-6 transition-colors sm:p-7",
                  selected === place.id ? "border-gold" : "cursor-pointer hover:border-gold/60",
                )}
                onClick={() => setSelected(place.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/40 text-gold">
                    <place.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{place.label}</p>
                    <p className="font-display text-2xl leading-tight">{place.name}</p>
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                  {place.address}
                </p>
                {place.time && (
                  <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4 shrink-0 text-gold" />
                    {place.time}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={mapsDirectionsUrl(place.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={buttonVariants({ size: "sm" })}
                  >
                    <Navigation />
                    Itinéraire
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(place.id);
                    }}
                    aria-pressed={selected === place.id}
                    className={buttonVariants({ size: "sm", variant: selected === place.id ? "secondary" : "outline" })}
                  >
                    <MapPin />
                    {selected === place.id ? "Affiché sur la carte" : "Voir sur la carte"}
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal x={30} y={0} className="glass overflow-hidden rounded-3xl p-2">
          <iframe
            key={shown.id}
            src={mapsEmbedUrl(shown.address)}
            title={`Carte : ${shown.label} — ${shown.address}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full rounded-[1.25rem] border-0 lg:h-full lg:min-h-[30rem] dark:[filter:invert(0.9)_hue-rotate(180deg)_saturate(0.8)]"
          />
        </Reveal>
      </div>
    </section>
  );
}

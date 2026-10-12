"use client";

import { Music, VolumeX } from "lucide-react";
import { wedding } from "@/config/wedding";
import { useAmbientMusic } from "@/hooks/useAmbientMusic";
import { cn } from "@/lib/utils";

export function MusicToggle({ className }: { className?: string }) {
  const { playing, toggle } = useAmbientMusic(wedding.music.src || undefined);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Couper la musique" : "Lancer la musique"}
      title={playing ? "Couper la musique" : "Musique d'ambiance"}
      className={cn(
        "glass relative grid size-10 shrink-0 place-items-center rounded-full text-gold transition-transform hover:scale-105 active:scale-95",
        className,
      )}
    >
      {playing ? (
        // Égaliseur animé : indique que le son est actif sans avoir à l'entendre
        <span className="flex h-4 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[3px] origin-bottom animate-pulse rounded-full bg-gold" style={{ height: `${[70, 100, 55][i]}%`, animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }} />
          ))}
        </span>
      ) : (
        <>
          <Music className="size-[18px]" />
          <VolumeX className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-card p-px text-muted-foreground" />
        </>
      )}
    </button>
  );
}

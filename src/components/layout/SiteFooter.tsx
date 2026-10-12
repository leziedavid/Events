"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { Divider } from "@/components/shared/Ornaments";
import { wedding, weddingDateLabel } from "@/config/wedding";
import { useEventInfo } from "@/hooks/useWedding";

export function SiteFooter() {
  const event = useEventInfo();
  return (
    <footer className="no-print border-t border-border px-6 py-14 text-center">
      <p className="font-script text-5xl text-gold-gradient">
        {event.groomName} <span className="text-3xl">&</span> {event.brideName}
      </p>
      <Divider className="mt-5" />
      <p className="mt-5 text-sm text-muted-foreground">{weddingDateLabel(event.date)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{wedding.hashtag}</p>
      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        Avec tout notre amour <Heart className="size-3 fill-[var(--blossom-deep)] text-[var(--blossom-deep)]" />
      </p>
      <Link href="/login" className="mt-4 inline-block text-xs text-muted-foreground/70 underline-offset-4 hover:text-gold hover:underline">
        Espace organisateurs
      </Link>
    </footer>
  );
}

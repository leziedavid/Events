"use client";

import { ScanLine } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CapacityMeter } from "@/components/shared/CapacityMeter";
import { Divider } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { useMounted } from "@/hooks/useMounted";
import { useCapacity } from "@/hooks/useWedding";
import { cn } from "@/lib/utils";

/** QR Code principal : il mène au formulaire RSVP, au même titre que le bouton */
export function RsvpCta() {
  const mounted = useMounted();
  const { data: capacity } = useCapacity();
  // L'adresse dépend de l'endroit où le site est servi : elle n'est connue que côté client
  const closed = !!capacity && (capacity.isFull || capacity.isClosed);
  const rsvpUrl = mounted ? `${window.location.origin}/rsvp` : "";

  return (
    <section id="rsvp" className="px-6 py-24 sm:py-32">
      <Reveal scale={0.96} className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-navy px-6 py-12 text-[#f5efe3] shadow-2xl sm:px-12 sm:py-16 dark:bg-card">
        <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-gold/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-[#2f5aa8]/40 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-gold/30" />

        <div className="relative grid items-center gap-12 md:grid-cols-[1fr_auto]">
          <div className="text-center md:text-left">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold-soft">Répondez s&apos;il vous plaît</p>
            <h2 className="mt-3 font-display text-4xl font-medium sm:text-5xl">Serez-vous des nôtres&nbsp;?</h2>
            <Divider className="mt-5 md:justify-start" />
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#f5efe3]/75 max-md:mx-auto">
              Scannez le QR Code avec votre téléphone ou cliquez sur le bouton : la confirmation prend moins d&apos;une minute et vous recevez
              aussitôt votre carte d&apos;invitation.
            </p>

            <div className="mx-auto mt-8 max-w-sm md:mx-0 [&_.text-muted-foreground]:text-[#f5efe3]/70 [&_.bg-muted]:bg-white/15">
              <CapacityMeter />
            </div>

            <Link
              href="/rsvp"
              aria-disabled={closed}
              className={cn(buttonVariants({ size: "lg" }), "mt-8 w-full sm:w-auto", closed && "pointer-events-none opacity-50")}
            >
              {closed ? "Réservations clôturées" : "Confirmer ma présence"}
            </Link>
            <p className="mt-4 text-sm text-[#f5efe3]/75">
              Déjà inscrit&nbsp;?{" "}
              <Link href="/ma-carte" className="font-medium text-gold-soft underline underline-offset-4 hover:text-white">
                Retrouver ma carte d&apos;invitation
              </Link>
            </p>
          </div>

          <div className="mx-auto flex flex-col items-center">
            <div className="relative rounded-3xl bg-white p-5 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:rotate-1 hover:scale-[1.03]">
              {/* Hauteur réservée avant l'hydratation pour éviter un saut de mise en page */}
              <div className="size-52 sm:size-60">
                {rsvpUrl && <QRCodeSVG value={rsvpUrl} size={240} level="M" fgColor="#14274a" className="size-full" />}
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-[#f5efe3]/75">
              <ScanLine className="size-4 text-gold-soft" />
              Scannez pour répondre
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

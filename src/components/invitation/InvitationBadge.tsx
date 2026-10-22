"use client";

import { Heart } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Ref } from "react";
import { deOrD, wedding } from "@/config/wedding";
import { useEventInfo } from "@/hooks/useWedding";
import { displayName, personnes } from "@/lib/utils";
import type { Rsvp } from "@/types/interface";

/**
 * Carte d'invitation. Toutes les tailles sont en `cqw` (pourcentage de la largeur de la
 * carte) : le rendu est identique à l'écran, dans une modale et dans l'image exportée.
 * Couleurs en dur : la carte ne suit pas le thème, elle doit s'imprimer toujours pareil.
 */
export function InvitationBadge({ guest, ref }: { guest: Rsvp; ref?: Ref<HTMLDivElement> }) {
  const event = useEventInfo();
  return (
    <div className="@container w-full">
      <div ref={ref} className="relative aspect-[16/10] w-full overflow-hidden rounded-[3cqw] bg-[#3a1c11] text-[#f6eadb]">
        {/* <img> natif : html-to-image capture mal les images optimisées de next/image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wedding.images.traditionnel} alt="" className="absolute inset-0 size-full object-cover object-top" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(58,28,17,0.9)_0%,rgba(58,28,17,0.74)_50%,rgba(58,28,17,0.5)_100%)]" />
        <div className="absolute inset-[2.2cqw] rounded-[2cqw] border border-[#d98c64]/60" />

        <div className="absolute inset-0 grid grid-cols-[1fr_auto] items-center gap-[3cqw] px-[6cqw] py-[5cqw]">
          <div className="text-center">
            <p className="text-[2.1cqw] uppercase tracking-[0.3em] text-[#e3c6a4]">Bienvenue au mariage {deOrD(event.groomName).trim()}</p>
            <p className="mt-[1cqw] flex items-center justify-center gap-[2cqw] font-script text-[8.6cqw] leading-none">
              {event.groomName}
              <Heart className="size-[4cqw] fill-[#e07a52] text-[#e07a52]" />
              {event.brideName}
            </p>

            <div className="mx-auto my-[2.6cqw] flex items-center justify-center gap-[1.4cqw]">
              <span className="h-px w-[9cqw] bg-[#d98c64]/70" />
              <span className="size-[1cqw] rotate-45 bg-[#d98c64]" />
              <span className="h-px w-[9cqw] bg-[#d98c64]/70" />
            </div>

            <p className="text-[2.1cqw] uppercase tracking-[0.3em] text-[#f6eadb]/75">Bienvenue à</p>
            <p className="mt-[0.6cqw] font-display text-[5.6cqw] font-semibold leading-tight text-[#f0c4a2]">{displayName(guest)}</p>
            <p className="mt-[0.8cqw] text-[2.3cqw] text-[#f6eadb]/85">
              {personnes(guest.nombrePersonnes)} · Table {guest.tableNumero}
            </p>

            <p className="mt-[3cqw] font-display text-[2.9cqw] italic">Votre présence nous honorera.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="rounded-[2cqw] bg-white p-[1.6cqw] shadow-[0_2cqw_5cqw_-1cqw_rgba(0,0,0,0.7)]">
              {/* Jeton signé par l'API (INV1…) ; à défaut, le code seul, accepté comme une saisie manuelle */}
              <QRCodeSVG value={guest.qrToken ?? guest.verificationCode} size={256} level="M" fgColor="#3a1c11" className="size-[23cqw]" />
            </div>
            <p className="mt-[1.4cqw] font-mono text-[2.3cqw] font-semibold tracking-[0.2em]">{guest.verificationCode}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

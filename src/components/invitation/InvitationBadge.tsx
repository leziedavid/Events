"use client";

import { Heart } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Ref } from "react";
import { deOrD, wedding } from "@/config/wedding";
import { useEventInfo } from "@/hooks/useWedding";
import { buildQrPayload } from "@/lib/security";
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
      <div ref={ref} className="relative aspect-[16/10] w-full overflow-hidden rounded-[3cqw] bg-[#0a1426] text-[#f8f1e4]">
        {/* <img> natif : html-to-image capture mal les images optimisées de next/image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wedding.images.traditionnel} alt="" className="absolute inset-0 size-full object-cover object-top" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(10,20,38,0.9)_0%,rgba(10,20,38,0.74)_50%,rgba(10,20,38,0.5)_100%)]" />
        <div className="absolute inset-[2.2cqw] rounded-[2cqw] border border-[#d6ae62]/60" />

        <div className="absolute inset-0 grid grid-cols-[1fr_auto] items-center gap-[3cqw] px-[6cqw] py-[5cqw]">
          <div className="text-center">
            <p className="text-[2.1cqw] uppercase tracking-[0.3em] text-[#d9b979]">Bienvenue au mariage {deOrD(event.groomName).trim()}</p>
            <p className="mt-[1cqw] flex items-center justify-center gap-[2cqw] font-script text-[8.6cqw] leading-none">
              {event.groomName}
              <Heart className="size-[4cqw] fill-[#e0525f] text-[#e0525f]" />
              {event.brideName}
            </p>

            <div className="mx-auto my-[2.6cqw] flex items-center justify-center gap-[1.4cqw]">
              <span className="h-px w-[9cqw] bg-[#d6ae62]/70" />
              <span className="size-[1cqw] rotate-45 bg-[#d6ae62]" />
              <span className="h-px w-[9cqw] bg-[#d6ae62]/70" />
            </div>

            <p className="text-[2.1cqw] uppercase tracking-[0.3em] text-[#f8f1e4]/75">Bienvenue à</p>
            <p className="mt-[0.6cqw] font-display text-[5.6cqw] font-semibold leading-tight text-[#e6c582]">{displayName(guest)}</p>
            <p className="mt-[0.8cqw] text-[2.3cqw] text-[#f8f1e4]/85">
              {personnes(guest.nombrePersonnes)} · Table {guest.tableNumero}
            </p>

            <p className="mt-[3cqw] font-display text-[2.9cqw] italic">Votre présence nous honorera.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="rounded-[2cqw] bg-white p-[1.6cqw] shadow-[0_2cqw_5cqw_-1cqw_rgba(0,0,0,0.7)]">
              <QRCodeSVG value={buildQrPayload(guest.verificationCode)} size={256} level="M" fgColor="#0a1426" className="size-[23cqw]" />
            </div>
            <p className="mt-[1.4cqw] font-mono text-[2.3cqw] font-semibold tracking-[0.2em]">{guest.verificationCode}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

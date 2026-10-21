"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Quote, ScanLine } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { GuestbookForm } from "@/components/guestbook/GuestbookForm";
import { SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { useMounted } from "@/hooks/useMounted";
import { useGuestbook, useQrUrl } from "@/hooks/useWedding";
import { formatDateTime } from "@/lib/utils";

export function Guestbook() {
  const { data: messages = [] } = useGuestbook();
  const mounted = useMounted();
  // L'adresse dépend de l'endroit où le site est servi : elle n'est connue que côté client
  const qrUrl = useQrUrl("livre-dor");
  const guestbookUrl = mounted ? qrUrl : "";

  return (
    <section id="livre-dor" className="ambient-bg px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="Vos mots doux" title="Livre d'or">
        Un vœu, un souvenir, un conseil pour la vie à deux : laissez quelques mots aux mariés.
      </SectionTitle>

      <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <Reveal x={-30} y={0}>
            <GuestbookForm className="glass rounded-3xl p-7 sm:p-8" />
          </Reveal>

          {/* QR Code du livre d'or : à scanner sur place (ou à imprimer sur les tables) pour
              écrire son message depuis son téléphone */}
          <Reveal x={-30} y={0} delay={0.1}>
            <div className="glass flex items-center gap-5 rounded-3xl p-5 sm:p-6">
              <Link href="/livre-dor" aria-label="Ouvrir le formulaire du livre d'or" className="shrink-0 rounded-2xl bg-white p-3 shadow-lg transition-transform duration-500 hover:rotate-1 hover:scale-105">
                {/* Hauteur réservée avant l'hydratation pour éviter un saut de mise en page */}
                <span className="block size-28 sm:size-32">
                  {guestbookUrl && <QRCodeSVG value={guestbookUrl} size={160} level="M" fgColor="#14274a" className="size-full" />}
                </span>
              </Link>
              <div>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-gold">
                  <ScanLine className="size-4" />
                  Scannez-moi
                </p>
                <p className="mt-2 font-display text-2xl leading-tight">Signez le livre d&apos;or depuis votre téléphone</p>
                <p className="mt-1 text-sm text-muted-foreground">Le QR Code ouvre directement le formulaire.</p>
              </div>
            </div>
          </Reveal>
        </div>

        <ul className="grid content-start gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {messages.slice(0, 6).map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 24, stiffness: 260 }}
                className="glass lift rounded-3xl p-6"
              >
                <Quote className="size-6 text-gold/70" />
                <p className="mt-3 font-display text-xl italic leading-snug">{m.message}</p>
                <p className="mt-4 text-sm font-medium">{m.auteur}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}

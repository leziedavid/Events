"use client";

import { motion } from "framer-motion";
import { BookHeart, Quote } from "lucide-react";
import { GuestbookForm } from "@/components/guestbook/GuestbookForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Divider, FloralCorner } from "@/components/shared/Ornaments";
import { EASE } from "@/components/shared/Reveal";
import { weddingTitle } from "@/config/wedding";
import { useEventInfo, useGuestbook } from "@/hooks/useWedding";
import { formatDateTime } from "@/lib/utils";

// Page ouverte par le QR Code du livre d'or : le formulaire d'abord, pensé pour le téléphone.
export default function GuestbookPage() {
  const { data: messages = [] } = useGuestbook();
  const title = weddingTitle(useEventInfo());

  return (
    <>
      <SiteHeader variant="page" />
      <main className="ambient-bg relative min-h-[100svh] overflow-hidden px-4 pb-16 pt-28 sm:px-6">
        <FloralCorner className="absolute -bottom-8 -left-10 w-48 opacity-60 sm:w-64" />

        <div className="relative mx-auto max-w-xl">
          <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="glass rounded-3xl p-6 sm:p-9">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold/15 text-gold">
              <BookHeart className="size-6" />
            </span>
            <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.35em] text-gold">{title}</p>
            <h1 className="mt-2 text-center font-display text-4xl font-medium sm:text-5xl">Livre d&apos;or</h1>
            <Divider className="mt-4" />
            <p className="mt-4 text-center text-[15px] text-muted-foreground">
              Un vœu, un souvenir, un conseil pour la vie à deux : laissez quelques mots aux mariés.
            </p>
            <GuestbookForm className="mt-7" />
          </motion.section>

          {messages.length > 0 && (
            <ul className="mt-6 space-y-4">
              {messages.map((m, i) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.4) }}
                  className="glass rounded-3xl p-6"
                >
                  <Quote className="size-5 text-gold/70" />
                  <p className="mt-2 font-display text-xl italic leading-snug">{m.message}</p>
                  <p className="mt-3 text-sm font-medium">{m.auteur}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

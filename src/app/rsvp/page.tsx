"use client";

import { motion } from "framer-motion";
import { CalendarHeart, Lock, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RsvpForm } from "@/components/rsvp/RsvpForm";
import { CapacityMeter } from "@/components/shared/CapacityMeter";
import { Divider, FloralCorner } from "@/components/shared/Ornaments";
import { EASE } from "@/components/shared/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { wedding, weddingDateLabel } from "@/config/wedding";
import { useCapacity, useCreateRsvp, useEventInfo } from "@/hooks/useWedding";

export default function RsvpPage() {
  const router = useRouter();
  const { data: capacity } = useCapacity();
  const create = useCreateRsvp();
  const event = useEventInfo();

  return (
    <>
      <SiteHeader variant="page" />
      <main className="ambient-bg relative min-h-[100svh] overflow-hidden px-4 pb-16 pt-28 sm:px-6">
        <FloralCorner className="absolute -bottom-8 -left-10 w-48 opacity-60 sm:w-64" />

        <div className="relative mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.aside initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: EASE }} className="text-center lg:sticky lg:top-28 lg:text-left">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-3xl bg-navy shadow-2xl lg:mx-0 lg:aspect-[4/5]">
              <Image src={wedding.images.portrait} alt="Les mariés" fill priority sizes="(max-width: 1024px) 90vw, 400px" className="object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
              <p className="absolute inset-x-0 bottom-5 text-center font-script text-5xl text-white">
                {event.groomName} <span className="text-3xl text-gold-soft">&</span> {event.brideName}
              </p>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center justify-center gap-2 lg:justify-start">
                <CalendarHeart className="size-4 text-gold" /> {weddingDateLabel(event.date)}
              </li>
              <li className="flex items-center justify-center gap-2 lg:justify-start">
                <MapPin className="size-4 text-gold" /> {event.venueAddress}
              </li>
            </ul>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="glass rounded-3xl p-6 sm:p-9"
          >
            <p className="text-center text-xs font-medium uppercase tracking-[0.35em] text-gold">Répondez s&apos;il vous plaît</p>
            <h1 className="mt-2 text-center font-display text-4xl font-medium sm:text-5xl">Confirmer ma présence</h1>
            <Divider className="mt-4" />
            <CapacityMeter className="mt-7" />

            {capacity?.isFull || capacity?.isClosed ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
                <Lock className="mx-auto size-9 text-destructive" />
                <p className="mt-4 font-display text-2xl font-semibold">Les réservations sont désormais clôturées.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {capacity.isFull ? "Toutes les places ont été attribuées. Merci pour votre enthousiasme !" : "Les mariés ont clôturé les confirmations. Merci pour votre enthousiasme !"}
                </p>
                <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
                  Retour à l&apos;accueil
                </Link>
              </motion.div>
            ) : (
              <div className="mt-8">
                <RsvpForm
                  submitLabel="Valider et recevoir mon invitation"
                  loading={create.isPending}
                  maxPersons={capacity?.remaining}
                  onSubmit={(values) =>
                    create.mutate(values, {
                      onSuccess: (guest) => {
                        // DÉMO : le SMS de confirmation est seulement annoncé, il partira du backend
                        toast.success("Présence confirmée !", { description: `Un SMS de confirmation est envoyé au ${guest.telephone} (simulation).` });
                        router.push(`/invitation/${guest.verificationCode}`);
                      },
                      onError: (e) => toast.error(e.message),
                    })
                  }
                />
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Vos informations ne servent qu&apos;à l&apos;organisation du mariage.
                </p>
              </div>
            )}
            <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
              Déjà inscrit&nbsp;?{" "}
              <Link href="/ma-carte" className="font-medium text-gold underline-offset-4 hover:underline">
                Retrouver ma carte d&apos;invitation
              </Link>
            </p>
          </motion.section>
        </div>
      </main>
    </>
  );
}

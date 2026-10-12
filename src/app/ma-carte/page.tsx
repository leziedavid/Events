"use client";

import { motion } from "framer-motion";
import { Download, Phone, QrCode, Search, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Divider, FloralCorner } from "@/components/shared/Ornaments";
import { EASE } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useFindRsvp } from "@/hooks/useWedding";

const STEPS = [
  { icon: Phone, text: "Saisissez le numéro de téléphone utilisé lors de votre inscription, ou le code inscrit sous votre QR Code." },
  { icon: QrCode, text: "Votre carte d'invitation s'affiche aussitôt : présentez son QR Code à l'accueil." },
  { icon: Download, text: "Téléchargez-la pour la garder sur votre téléphone, même sans connexion." },
];

// Pour l'invité qui a égaré sa carte, ou qui n'a pas pu la télécharger après avoir confirmé.
export default function FindCardPage() {
  const router = useRouter();
  const find = useFindRsvp();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!query.trim()) return setError("Saisissez votre numéro de téléphone ou votre code.");
    find.mutate(query, {
      // La page de la carte existe déjà (/invitation/[code]) : on y conduit simplement l'invité
      onSuccess: (guest) => router.push(`/invitation/${guest.verificationCode}`),
      onError: (err) => setError(err.message),
    });
  };

  return (
    <>
      <SiteHeader variant="page" />
      <main className="ambient-bg relative grid min-h-[100svh] place-items-center overflow-hidden px-4 pb-16 pt-28 sm:px-6">
        <FloralCorner className="absolute -bottom-8 -left-10 w-48 opacity-60 sm:w-64" />

        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="glass relative w-full max-w-xl rounded-3xl p-6 sm:p-9">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold/15 text-gold">
            <TicketCheck className="size-6" />
          </span>
          <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.35em] text-gold">Carte égarée&nbsp;?</p>
          <h1 className="mt-2 text-center font-display text-4xl font-medium sm:text-5xl">Retrouver ma carte</h1>
          <Divider className="mt-4" />

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            <Field label="Numéro de téléphone ou code de l'invitation" htmlFor="find-query" error={error ?? undefined} hint="Exemples : 07 00 00 00 00 ou K7P4-9XQ2">
              <Input
                id="find-query"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError(null);
                }}
                placeholder="07 00 00 00 00"
                autoComplete="tel"
                spellCheck={false}
                aria-invalid={!!error}
              />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={find.isPending}>
              {!find.isPending && <Search />}
              Retrouver ma carte
            </Button>
          </form>

          <ol className="mt-8 space-y-4 border-t border-border pt-6">
            {STEPS.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-gold/40 text-gold">
                  <Icon className="size-4" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore inscrit&nbsp;?{" "}
            <Link href="/rsvp" className="font-medium text-gold underline-offset-4 hover:underline">
              Confirmer ma présence
            </Link>
          </p>
        </motion.section>
      </main>
    </>
  );
}

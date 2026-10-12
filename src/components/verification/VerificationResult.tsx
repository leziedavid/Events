"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Armchair, Ban, CheckCircle2, Clock, ShieldX, Tag, Users } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { categoryMeta } from "@/config/categories";
import { wedding } from "@/config/wedding";
import { cn, displayName, formatHour, personnes } from "@/lib/utils";
import type { LookupResult } from "@/types/interface";

interface Props {
  result: LookupResult;
  /** Vrai juste après la validation : affiche la confirmation verte */
  justValidated: boolean;
  onValidate: () => void;
  validating: boolean;
  onNext: () => void;
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export function VerificationResult({ result, justValidated, onValidate, validating, onNext }: Props) {
  const { guest, status } = result;

  if (status === "INVALID" || !guest) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        // Secousse horizontale : le refus se remarque même sans regarder le texte
        animate={{ opacity: 1, scale: 1, x: [0, -10, 10, -6, 6, 0] }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border-2 border-destructive bg-destructive/10 p-8 text-center"
      >
        <ShieldX className="mx-auto size-14 text-destructive" />
        <h2 className="mt-4 font-display text-3xl font-semibold">Invitation invalide</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ce code ne correspond à aucune invitation. Vérifiez la carte ou saisissez le code à la main.</p>
        <Button variant="outline" className="mt-6" onClick={onNext}>
          Nouvelle vérification
        </Button>
      </motion.div>
    );
  }

  if (status === "REVOKED") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1, x: [0, -10, 10, -6, 6, 0] }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border-2 border-destructive bg-destructive/10 p-8 text-center"
      >
        <Ban className="mx-auto size-14 text-destructive" />
        <h2 className="mt-4 font-display text-3xl font-semibold">Invitation révoquée</h2>
        <p className="mt-2 font-medium">{displayName(guest)}</p>
        <p className="mt-1 text-sm text-muted-foreground">Cette invitation a été annulée par les organisateurs. L&apos;entrée ne peut pas être validée.</p>
        <Button variant="outline" className="mt-6" onClick={onNext}>
          Nouvelle vérification
        </Button>
      </motion.div>
    );
  }

  const used = status === "ALREADY_USED" && !justValidated;
  const category = categoryMeta(guest.categorie);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 240 }}
      className={cn("overflow-hidden rounded-3xl border-2 bg-card", justValidated ? "border-success" : used ? "border-warning" : "border-gold/50")}
    >
      <div className="relative h-36 bg-navy">
        <Image src={wedding.images.portrait} alt="Les mariés" fill sizes="480px" className="object-cover object-[50%_18%]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="-mt-8 px-6 pb-6">
        <h2 className="relative font-display text-3xl font-semibold">{displayName(guest)}</h2>

        {justValidated && (
          <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mt-3 flex items-center gap-2 rounded-xl bg-success/15 px-4 py-3 font-medium text-success">
            <CheckCircle2 className="size-5 shrink-0" />
            Entrée validée à {formatHour(guest.verifiedAt ?? new Date().toISOString())}. Bienvenue !
          </motion.p>
        )}
        {used && (
          <div className="mt-3 rounded-xl bg-warning/15 px-4 py-3 text-warning">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-5 shrink-0" />
              Cette invitation a déjà été utilisée.
            </p>
            {guest.verifiedAt && <p className="mt-1 pl-7 text-sm">Heure d&apos;entrée : {formatHour(guest.verifiedAt)}</p>}
          </div>
        )}

        <div className="mt-4">
          <Row icon={<Users className="size-4 text-gold" />} label="Nombre">{personnes(guest.nombrePersonnes)}</Row>
          <Row icon={<Tag className="size-4 text-gold" />} label="Catégorie">{category.label}</Row>
          <Row icon={<Armchair className="size-4 text-gold" />} label="Table">
            <span className="font-display text-2xl font-semibold text-gold">{guest.tableNumero}</span>
          </Row>
          <Row icon={<Clock className="size-4 text-gold" />} label="Statut">
            {justValidated || used ? (
              <span className={justValidated ? "text-success" : "text-warning"}>Arrivé</span>
            ) : (
              <span className="text-success">✅ Non encore arrivé</span>
            )}
          </Row>
        </div>

        {status === "FOUND" && !justValidated ? (
          <Button variant="success" size="lg" className="mt-5 w-full" onClick={onValidate} loading={validating}>
            {!validating && <CheckCircle2 />}
            Valider l&apos;entrée
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="mt-5 w-full" onClick={onNext}>
            Invité suivant
          </Button>
        )}
      </div>
    </motion.div>
  );
}

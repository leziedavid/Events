"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { CATEGORIES } from "@/config/categories";
import { wedding } from "@/config/wedding";
import { useSettings, useTableOptions } from "@/hooks/useWedding";
import { rsvpSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { GuestCategory, RsvpInput } from "@/types/interface";

interface RsvpFormProps {
  defaultValues?: Partial<RsvpInput>;
  onSubmit: (values: RsvpInput) => void;
  loading?: boolean;
  submitLabel: string;
  /** Places encore disponibles pour ce formulaire : borne le sélecteur « famille » */
  maxPersons?: number;
  /** Invité modifié (administration) : ses propres places comptent comme libres à sa table */
  guestId?: string;
  /** Administration : la liste des tables reste disponible même si le choix est fermé aux invités */
  forceTableChoice?: boolean;
  /**
   * Administration : demander le nombre de personnes d'une famille. Le formulaire public ne le
   * demande plus (demande des mariés) : une famille qui confirme compte pour une personne.
   */
  askPersons?: boolean;
}

/** Formulaire RSVP, partagé par la page publique et l'administration (ajout / modification) */
export function RsvpForm({ defaultValues, onSubmit, loading, submitLabel, maxPersons, guestId, forceTableChoice, askPersons }: RsvpFormProps) {
  const { data: settings } = useSettings();
  const familyMax = settings?.familyMax ?? wedding.familyMax;
  const tableSize = settings?.tableSize ?? wedding.tableSize;
  const showTables = forceTableChoice || (settings?.tableChoice ?? true);
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<RsvpInput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { nom: "", telephone: "", nombrePersonnes: 1, ...defaultValues },
  });
  const categorie = useWatch({ control, name: "categorie" });
  // Les tables proposées dépendent de la catégorie : VIP 1 et VIP 2 pour la Famille et les
  // Responsables de l'Église seulement (l'API refuse aussi une table VIP aux autres)
  const { data: tables } = useTableOptions(guestId, categorie);
  // Catégories du formulaire ; une invitation ancienne garde la sienne si elle n'est plus proposée
  const choices = CATEGORIES.filter((c) => c.selectable || c.value === defaultValues?.categorie);
  const nombre = useWatch({ control, name: "nombrePersonnes" });
  const tableNumero = useWatch({ control, name: "tableNumero" });
  const isFamily = categorie === "FAMILLE";
  const max = Math.max(1, Math.min(familyMax, maxPersons ?? familyMax));

  // Seules les tables qui peuvent accueillir tout le groupe sont proposées : une table complète
  // (ou trop remplie pour cette famille) disparaît de la liste
  const groupSize = isFamily ? nombre || 1 : 1;
  const available = useMemo(() => (tables ?? []).filter((t) => t.free >= groupSize), [tables, groupSize]);

  // La table choisie ne convient plus (famille agrandie, ou table prise entre-temps par un
  // autre invité) : on revient au placement automatique plutôt que d'échouer à l'envoi
  useEffect(() => {
    if (tableNumero !== undefined && tables && !available.some((t) => t.numero === tableNumero)) {
      setValue("tableNumero", undefined);
    }
  }, [available, tableNumero, tables, setValue]);

  const selectCategory = (value: GuestCategory) => {
    setValue("categorie", value, { shouldValidate: true });
    // Hors famille, l'invitation est strictement individuelle
    if (value !== "FAMILLE") setValue("nombrePersonnes", 1);
  };
  const setNombre = (n: number) => setValue("nombrePersonnes", Math.min(max, Math.max(1, n)), { shouldValidate: true });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground/90">Vous êtes…</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Catégorie">
          {choices.map(({ value, formLabel, icon: Icon }) => {
            const selected = categorie === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectCategory(value)}
                className={cn(
                  // Icône au-dessus du libellé : un libellé long (« Responsables de l'Église ») passe à la ligne
                  // entre ses mots et reste dans la carte, sur téléphone comme dans la modale de la gestion
                  "relative flex min-w-0 flex-col items-start gap-2 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300 active:scale-[0.97] sm:px-4",
                  selected ? "border-gold bg-gold/12 shadow-[0_10px_30px_-18px_var(--gold)]" : "border-input bg-card hover:border-gold/60",
                )}
              >
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full transition-colors", selected ? "bg-gold text-primary-foreground" : "bg-muted text-gold")}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 max-w-full break-words text-sm font-medium leading-tight">{formLabel}</span>
              </button>
            );
          })}
        </div>
        {errors.categorie && (
          <p role="alert" className="mt-1.5 text-sm text-destructive">
            {errors.categorie.message}
          </p>
        )}
      </fieldset>

      <Field label={isFamily ? "Nom de la famille" : "Nom complet"} htmlFor="rsvp-nom" error={errors.nom?.message}>
        <Input id="rsvp-nom" autoComplete="name" placeholder={isFamily ? "Ex. Kouassi" : "Ex. Jean Dupont"} aria-invalid={!!errors.nom} {...register("nom")} />
      </Field>

      <Field label="Numéro de téléphone" htmlFor="rsvp-tel" error={errors.telephone?.message} hint="Un seul numéro par invitation.">
        <Input id="rsvp-tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="07 00 00 00 00" aria-invalid={!!errors.telephone} {...register("telephone")} />
      </Field>

      <AnimatePresence initial={false}>
        {isFamily && askPersons && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <p className="mb-2 text-sm font-medium text-foreground/90">Combien de personnes seront présentes&nbsp;?</p>
            <div className="flex items-center justify-between rounded-2xl border border-input bg-card p-2">
              <button type="button" onClick={() => setNombre(nombre - 1)} disabled={nombre <= 1} aria-label="Une personne de moins" className="grid size-11 place-items-center rounded-xl bg-muted text-gold transition-transform active:scale-90 disabled:opacity-40">
                <Minus className="size-5" />
              </button>
              <div className="text-center" aria-live="polite">
                <motion.span key={nombre} initial={{ scale: 1.4, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="block font-display text-4xl font-semibold tabular-nums">
                  {nombre}
                </motion.span>
                <span className="text-xs text-muted-foreground">personne{nombre > 1 ? "s" : ""} · de 1 à {max}</span>
              </div>
              <button type="button" onClick={() => setNombre(nombre + 1)} disabled={nombre >= max} aria-label="Une personne de plus" className="grid size-11 place-items-center rounded-xl bg-muted text-gold transition-transform active:scale-90 disabled:opacity-40">
                <Plus className="size-5" />
              </button>
            </div>
            {errors.nombrePersonnes && (
              <p role="alert" className="mt-1.5 text-sm text-destructive">
                {errors.nombrePersonnes.message}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showTables && (
      <Field
        label="Choisir ma table"
        htmlFor="rsvp-table"
        error={errors.tableNumero?.message}
        hint={
          categorie
            ? `Tables de ${tableSize} places. Une table complète n'apparaît plus dans la liste.`
            : "Choisissez d'abord votre catégorie : les tables proposées en dépendent."
        }
      >
        <Select
          id="rsvp-table"
          className="h-12"
          value={tableNumero ?? ""}
          onChange={(e) => setValue("tableNumero", e.target.value ? Number(e.target.value) : undefined, { shouldValidate: true })}
        >
          <option value="">Placement automatique</option>
          {available.map((t) => (
            <option key={t.numero} value={t.numero}>
              {t.name}
              {t.isVip ? " (réservée)" : ""} — {t.free === t.seats ? "libre" : `${t.free} place${t.free > 1 ? "s" : ""} libre${t.free > 1 ? "s" : ""}`}
            </option>
          ))}
        </Select>
      </Field>
      )}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}

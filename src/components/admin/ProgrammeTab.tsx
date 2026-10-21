"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState, IconButton, Pill, Section } from "@/components/admin/ui";
import { PROGRAMME_ICONS } from "@/components/home/Programme";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Modal } from "@/components/ui/MotionModal";
import { useSettings, useUpdateSettings } from "@/hooks/useWedding";
import { programmeStepSchema, type ProgrammeStepInput } from "@/lib/schemas";
import type { ProgrammeIcon, ProgrammeStep } from "@/types/interface";

const ICON_LABELS: Record<ProgrammeIcon, string> = {
  rings: "Alliances",
  church: "Église",
  camera: "Appareil photo",
  glass: "Verre",
  utensils: "Couverts",
  music: "Musique",
};

const PLACE_LABELS: Record<ProgrammeStep["place"], string> = {
  none: "Aucun lieu",
  townHall: "Mairie",
  ceremony: "Lieu de la bénédiction",
  reception: "Lieu de la réception",
};

const PLACE_PILLS: Record<ProgrammeStep["place"], string> = { none: "", townHall: "Mairie", ceremony: "Bénédiction", reception: "Réception" };

type Dialog = { type: "create" } | { type: "edit" | "delete"; step: ProgrammeStep } | null;

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-ring/30 aria-invalid:border-destructive";

function StepForm({ step, onSubmit, loading }: { step?: ProgrammeStep; onSubmit: (values: ProgrammeStepInput) => void; loading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProgrammeStepInput>({
    resolver: zodResolver(programmeStepSchema),
    defaultValues: {
      heure: step?.heure ?? "",
      titre: step?.titre ?? "",
      description: step?.description ?? "",
      icon: step?.icon ?? "rings",
      place: step?.place ?? "none",
    },
  });
  const error = (message?: string) => message && <p role="alert" className="mt-1 text-xs text-destructive">{message}</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor="step-heure" className="text-sm font-medium">Heure</label>
          <input id="step-heure" placeholder="11h00" aria-invalid={!!errors.heure} className={`${fieldClass} h-10`} {...register("heure")} />
          {error(errors.heure?.message)}
        </div>
        <div>
          <label htmlFor="step-titre" className="text-sm font-medium">Titre</label>
          <input id="step-titre" placeholder="Ex. Bénédiction nuptiale" aria-invalid={!!errors.titre} className={`${fieldClass} h-10`} {...register("titre")} />
          {error(errors.titre?.message)}
        </div>
      </div>
      <div>
        <label htmlFor="step-description" className="text-sm font-medium">Description</label>
        <textarea id="step-description" aria-invalid={!!errors.description} className={`${fieldClass} min-h-20 resize-none py-2`} {...register("description")} />
        {error(errors.description?.message)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="step-icon" className="text-sm font-medium">Icône</label>
          <select id="step-icon" className={`${fieldClass} h-10 cursor-pointer`} {...register("icon")}>
            {(Object.keys(ICON_LABELS) as ProgrammeIcon[]).map((icon) => (
              <option key={icon} value={icon}>{ICON_LABELS[icon]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="step-place" className="text-sm font-medium">Lieu (lien Itinéraire)</label>
          <select id="step-place" className={`${fieldClass} h-10 cursor-pointer`} {...register("place")}>
            {(Object.keys(PLACE_LABELS) as ProgrammeStep["place"][]).map((place) => (
              <option key={place} value={place}>{PLACE_LABELS[place]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" loading={loading}>
          {step ? "Enregistrer" : "Ajouter l'étape"}
        </Button>
      </div>
    </form>
  );
}

/** Onglet « Programme » : étapes de la journée affichées sur l'accueil */
export function ProgrammeTab() {
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const [dialog, setDialog] = useState<Dialog>(null);

  if (!settings) return <p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>;
  const steps = settings.programme;

  const close = () => setDialog(null);
  const save = (programme: ProgrammeStep[], message: string, after?: () => void) =>
    update.mutate(
      { programme },
      {
        onSuccess: () => {
          toast.success(message);
          after?.();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  const move = (index: number, delta: number) => {
    const next = [...steps];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    save(next, "Ordre du programme enregistré");
  };

  return (
    <>
      <Section
        title="Étapes de la journée"
        description={`${steps.length} étape${steps.length > 1 ? "s" : ""}, affichées dans cet ordre sur l'accueil. Une étape rattachée à un lieu affiche un lien « Itinéraire ».`}
        action={
          <Button size="sm" onClick={() => setDialog({ type: "create" })} disabled={steps.length >= 15}>
            <Plus />
            Ajouter une étape
          </Button>
        }
      >
        {steps.map((step, i) => {
          const Icon = PROGRAMME_ICONS[step.icon];
          return (
            <div key={step.id} className="flex items-center gap-3 border-b border-border py-4 last:border-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
                  <span className="tabular-nums text-primary">{step.heure}</span>
                  <span className="truncate">{step.titre}</span>
                  {step.place !== "none" && (
                    <Pill>
                      <MapPin className="size-3" />
                      {PLACE_PILLS[step.place]}
                    </Pill>
                  )}
                </p>
                {step.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{step.description}</p>}
              </div>
              <div className="flex shrink-0 items-center">
                <IconButton label={`Monter ${step.titre}`} disabled={i === 0 || update.isPending} onClick={() => move(i, -1)}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton label={`Descendre ${step.titre}`} disabled={i === steps.length - 1 || update.isPending} onClick={() => move(i, 1)}>
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton label={`Modifier ${step.titre}`} onClick={() => setDialog({ type: "edit", step })}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton label={`Supprimer ${step.titre}`} tone="danger" onClick={() => setDialog({ type: "delete", step })}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </div>
          );
        })}
        {steps.length === 0 && <EmptyState>Aucune étape : la section Programme de l&apos;accueil sera vide.</EmptyState>}
      </Section>

      <Modal open={dialog?.type === "create"} onClose={close} title="Ajouter une étape" size="sm">
        <StepForm loading={update.isPending} onSubmit={(values) => save([...steps, { id: crypto.randomUUID(), ...values }], "Étape ajoutée", close)} />
      </Modal>

      <Modal open={dialog?.type === "edit"} onClose={close} title="Modifier l'étape" size="sm">
        {dialog?.type === "edit" && (
          <StepForm
            key={dialog.step.id}
            step={dialog.step}
            loading={update.isPending}
            onSubmit={(values) => save(steps.map((s) => (s.id === dialog.step.id ? { ...s, ...values } : s)), "Étape modifiée", close)}
          />
        )}
      </Modal>

      <ConfirmAction
        open={dialog?.type === "delete"}
        onClose={close}
        title="Supprimer cette étape ?"
        confirmLabel="Supprimer"
        destructive
        loading={update.isPending}
        onConfirm={() => dialog?.type === "delete" && save(steps.filter((s) => s.id !== dialog.step.id), "Étape supprimée", close)}
      >
        {dialog?.type === "delete" && (
          <>
            <strong className="text-foreground">{dialog.step.titre}</strong> ({dialog.step.heure}) sera retirée du programme.
          </>
        )}
      </ConfirmAction>
    </>
  );
}

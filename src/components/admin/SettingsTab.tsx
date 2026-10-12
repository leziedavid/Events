"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eraser, FileSpreadsheet, FileText, Lock, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { NumberField, Pill, Section, SettingRow, Switch, TextInput } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { coupleNamesOf, weddingDateLabel, weddingTimeLabel, weddingTitle } from "@/config/wedding";
import { useCapacity, useClearData, useEventInfo, useResetDemo, useRsvps, useSettings, useUpdateSettings } from "@/hooks/useWedding";
import { exportGuestsExcel, exportGuestsPdf } from "@/lib/export";
import { eventSchema, type EventInput } from "@/lib/schemas";
import type { EventInfo, EventSettings } from "@/types/interface";

/** Champ + message d'erreur, aligné à droite de la ligne */
function FieldCell({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="w-full sm:w-72">
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Le champ <input type="datetime-local"> manipule « AAAA-MM-JJTHH:mm » sans fuseau ; la date
// est stockée en UTC, qui est l'heure d'Abidjan.
const toLocalInput = (iso: string) => new Date(iso).toISOString().slice(0, 16);
const fromLocalInput = (value: string) => `${value}:00+00:00`;

/**
 * Noms, date et lieu. Modifiables seulement tant qu'aucun invité n'est inscrit : ils figurent
 * sur les cartes d'invitation, les changer ensuite fausserait celles déjà remises.
 */
function EventInfoSection({ event, guestCount }: { event: EventInfo; guestCount: number }) {
  const update = useUpdateSettings();
  const locked = guestCount > 0;
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    values: { ...event, date: toLocalInput(event.date) },
  });

  if (locked) {
    return (
      <Section
        title="Le mariage"
        description={`Ces informations figurent sur les cartes d'invitation. Elles sont verrouillées depuis la première inscription (${guestCount} invitation${guestCount > 1 ? "s" : ""} enregistrée${guestCount > 1 ? "s" : ""}).`}
        action={
          <Pill>
            <Lock className="size-3" />
            Verrouillé
          </Pill>
        }
      >
        <SettingRow title="Mariés">
          <span className="text-sm text-muted-foreground">{coupleNamesOf(event)}</span>
        </SettingRow>
        <SettingRow title="Date et heure">
          <span className="text-sm text-muted-foreground">
            {weddingDateLabel(event.date)} · {weddingTimeLabel(event.date)}
          </span>
        </SettingRow>
        <SettingRow title="Lieu">
          <span className="text-sm text-muted-foreground sm:text-right">
            {event.venueName}, {event.venueAddress}
          </span>
        </SettingRow>
      </Section>
    );
  }

  const onSubmit = handleSubmit((values) =>
    update.mutate(
      { event: { ...values, date: fromLocalInput(values.date) } },
      { onSuccess: () => toast.success("Informations du mariage enregistrées"), onError: (e) => toast.error(e.message) },
    ),
  );

  return (
    <Section title="Le mariage" description="Modifiable tant qu'aucun invité n'est inscrit. Ces informations seront ensuite verrouillées, car elles figurent sur les cartes d'invitation.">
      <form onSubmit={onSubmit} noValidate>
        <SettingRow title="Prénom du marié" description="Affiché sur l'accueil, le faire-part et les cartes d'invitation.">
          <FieldCell error={errors.groomName?.message}>
            <TextInput aria-label="Prénom du marié" aria-invalid={!!errors.groomName} {...register("groomName")} />
          </FieldCell>
        </SettingRow>
        <SettingRow title="Prénom de la mariée">
          <FieldCell error={errors.brideName?.message}>
            <TextInput aria-label="Prénom de la mariée" aria-invalid={!!errors.brideName} {...register("brideName")} />
          </FieldCell>
        </SettingRow>
        <SettingRow title="Date et heure" description="Heure d'accueil des invités, heure d'Abidjan. Elle règle aussi le compte à rebours et le lien Google Agenda.">
          <FieldCell error={errors.date?.message}>
            <TextInput type="datetime-local" aria-label="Date et heure" aria-invalid={!!errors.date} {...register("date")} />
          </FieldCell>
        </SettingRow>
        <SettingRow title="Nom du lieu">
          <FieldCell error={errors.venueName?.message}>
            <TextInput aria-label="Nom du lieu" aria-invalid={!!errors.venueName} {...register("venueName")} />
          </FieldCell>
        </SettingRow>
        <SettingRow title="Adresse" description="Sert aussi à centrer la carte Google Maps et à calculer l'itinéraire.">
          <FieldCell error={errors.venueAddress?.message}>
            <TextInput aria-label="Adresse" aria-invalid={!!errors.venueAddress} {...register("venueAddress")} />
          </FieldCell>
        </SettingRow>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" size="sm" variant="ghost" disabled={!isDirty || update.isPending} onClick={() => reset()}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={!isDirty} loading={update.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Section>
  );
}

/** Onglet « Événement » : informations du mariage, inscriptions, capacité, tables */
export function SettingsTab() {
  const { data: settings } = useSettings();
  const { data: capacity } = useCapacity();
  const { data: guests } = useRsvps();
  const update = useUpdateSettings();

  const save = async (patch: Partial<EventSettings>, message: string) => {
    try {
      await update.mutateAsync(patch);
      toast.success(message);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  };

  // On attend aussi la liste des invités : c'est elle qui dit si les informations sont verrouillées
  if (!settings || !guests) return <p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>;
  const confirmed = capacity?.confirmed ?? 0;

  return (
    <>
      <EventInfoSection event={settings.event} guestCount={guests.length} />

      <Section title="Inscriptions">
        <SettingRow
          title="Inscriptions ouvertes"
          description="Autoriser les invités à confirmer leur présence. Lorsque cette option est désactivée, le formulaire affiche « Les réservations sont désormais clôturées. ». Vous pouvez toujours ajouter des invités depuis l'onglet Invités."
        >
          <Switch
            label="Inscriptions ouvertes"
            checked={settings.rsvpOpen}
            disabled={update.isPending}
            onChange={(rsvpOpen) => save({ rsvpOpen }, rsvpOpen ? "Inscriptions ouvertes" : "Inscriptions fermées")}
          />
        </SettingRow>
        <SettingRow
          title="Livre d'or ouvert"
          description="Autoriser les invités à laisser un message, depuis l'accueil ou en scannant le QR Code du livre d'or."
        >
          <Switch
            label="Livre d'or ouvert"
            checked={settings.guestbookOpen}
            disabled={update.isPending}
            onChange={(guestbookOpen) => save({ guestbookOpen }, guestbookOpen ? "Livre d'or ouvert" : "Livre d'or fermé")}
          />
        </SettingRow>
      </Section>

      <Section title="Capacité" description="Ces réglages restent modifiables après les premières inscriptions.">
        <SettingRow
          title="Nombre de places"
          description={`Capacité totale de la réception. ${confirmed} personne${confirmed > 1 ? "s sont" : " est"} déjà confirmée${confirmed > 1 ? "s" : ""} : la capacité ne peut pas descendre en dessous. Les inscriptions se ferment d'elles-mêmes quand elle est atteinte.`}
        >
          <NumberField label="Nombre de places" value={settings.capacity} min={Math.max(1, confirmed)} max={2000} disabled={update.isPending} onCommit={(capacity) => save({ capacity }, `Capacité : ${capacity} places`)} />
        </SettingRow>
        <SettingRow
          title="Personnes par table"
          description="Changer cette valeur replace automatiquement tous les invités : les numéros de table des cartes déjà distribuées peuvent ne plus correspondre."
        >
          <NumberField label="Personnes par table" value={settings.tableSize} min={Math.max(2, settings.familyMax)} max={20} disabled={update.isPending} onCommit={(tableSize) => save({ tableSize }, `Tables de ${tableSize} personnes`)} />
        </SettingRow>
        <SettingRow
          title="Maximum par famille"
          description="Nombre de personnes qu'une famille peut inscrire avec une seule invitation. Une famille n'est jamais séparée : ce maximum ne peut pas dépasser la taille d'une table."
        >
          <NumberField label="Maximum par famille" value={settings.familyMax} min={1} max={settings.tableSize} disabled={update.isPending} onCommit={(familyMax) => save({ familyMax }, `Maximum ${familyMax} personnes par famille`)} />
        </SettingRow>
      </Section>
    </>
  );
}

/** Onglet « Données » : exports, mise à zéro et jeu de données de démonstration */
export function DataTab() {
  const { data: guests = [] } = useRsvps();
  const event = useEventInfo();
  const reset = useResetDemo();
  const clear = useClearData();
  const [confirm, setConfirm] = useState<"reset" | "clear" | null>(null);

  const exportAs = async (kind: "excel" | "pdf") => {
    if (guests.length === 0) return toast.error("Aucun invité à exporter.");
    try {
      await (kind === "excel" ? exportGuestsExcel(guests) : exportGuestsPdf(guests, weddingTitle(event)));
      toast.success(`Export ${kind === "excel" ? "Excel" : "PDF"} généré (${guests.length} invitations)`);
    } catch {
      toast.error("L'export a échoué.");
    }
  };

  return (
    <>
      <Section title="Exports">
        <SettingRow title="Liste des invités (Excel)" description="Toutes les invitations avec téléphone, catégorie, nombre de personnes, table, code et statut.">
          <Button size="sm" variant="outline" onClick={() => exportAs("excel")}>
            <FileSpreadsheet />
            Exporter en .xlsx
          </Button>
        </SettingRow>
        <SettingRow title="Liste des invités (PDF)" description="La même liste, mise en page pour l'impression — pratique à remettre aux agents d'accueil.">
          <Button size="sm" variant="outline" onClick={() => exportAs("pdf")}>
            <FileText />
            Exporter en .pdf
          </Button>
        </SettingRow>
      </Section>

      <Section title="Données" description="Les données sont enregistrées dans ce navigateur uniquement.">
        <SettingRow
          title="Repartir de zéro"
          description="Efface toutes les invitations, entrées, messages et rappels, en conservant vos réglages. Sans aucune inscription, les informations du mariage (onglet Événement) redeviennent modifiables."
        >
          <Button size="sm" variant="outline" onClick={() => setConfirm("clear")}>
            <Eraser />
            Tout effacer
          </Button>
        </SettingRow>
        <SettingRow
          title="Recharger la démonstration"
          description="Efface tout, réglages compris, puis recharge le jeu de données fictif de départ (36 invitations)."
        >
          <Button size="sm" variant="destructive" onClick={() => setConfirm("reset")}>
            <RotateCcw />
            Réinitialiser
          </Button>
        </SettingRow>
      </Section>

      <ConfirmAction
        open={confirm === "clear"}
        onClose={() => setConfirm(null)}
        title="Tout effacer ?"
        confirmLabel="Tout effacer"
        destructive
        loading={clear.isPending}
        onConfirm={() =>
          clear.mutate(undefined, {
            onSuccess: () => {
              toast.success("Données effacées : vous repartez de zéro");
              setConfirm(null);
            },
          })
        }
      >
        Les {guests.length} invitations, l&apos;historique des entrées, le livre d&apos;or et les rappels seront effacés. Vos réglages sont conservés. Cette action est
        irréversible.
      </ConfirmAction>

      <ConfirmAction
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        title="Recharger la démonstration ?"
        confirmLabel="Réinitialiser"
        destructive
        loading={reset.isPending}
        onConfirm={() =>
          reset.mutate(undefined, {
            onSuccess: () => {
              toast.success("Données de démonstration rétablies");
              setConfirm(null);
            },
          })
        }
      >
        Tout ce qui a été saisi sera effacé, y compris les réglages et les informations du mariage, et remplacé par les données fictives de départ.
      </ConfirmAction>
    </>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState, IconButton, Pill, Section, Segmented, SettingRow, Switch } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { coupleNamesOf, deOrD, weddingDateLabel } from "@/config/wedding";
import { useDeleteGuestbookMessage, useEventInfo, useGuestbook, useReminders, useRsvps, useSendReminder, useSettings, useUpdateSettings } from "@/hooks/useWedding";
import { reminderSchema, type ReminderInput } from "@/lib/schemas";
import { formatDateTime } from "@/lib/utils";

export function RemindersTab() {
  const { data: guests = [] } = useRsvps();
  const { data: reminders = [] } = useReminders();
  const send = useSendReminder();
  const recipients = guests.filter((g) => !g.isRevoked).length;
  const event = useEventInfo();
  const suggestion = `Rappel : le mariage ${deOrD(event.groomName)}${coupleNamesOf(event)} a lieu ${weddingDateLabel(event.date)}. Pensez à présenter votre carte d'invitation à l'entrée.`;

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<ReminderInput>({
    resolver: zodResolver(reminderSchema),
    // `values` : le message proposé se met à jour quand les réglages finissent de charger
    values: { canal: "SMS", message: suggestion },
  });
  const canal = useWatch({ control, name: "canal" });
  const message = useWatch({ control, name: "message" });

  return (
    <>
      <Section title="Envoyer un rappel" description="Démonstration : l'envoi est simulé et seulement journalisé. Aucun SMS ni e-mail ne part.">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            send.mutate(values, {
              onSuccess: (log) => toast.success(`Rappel envoyé à ${log.destinataires} invités (simulation)`),
              onError: (e) => toast.error(e.message),
            }),
          )}
        >
          <SettingRow title="Canal" description="Le moyen par lequel les invités recevront le message.">
            <Segmented value={canal} onChange={(value) => setValue("canal", value)} label="Canal" options={[{ value: "SMS", label: "SMS" }, { value: "EMAIL", label: "E-mail" }]} />
          </SettingRow>
          <SettingRow title="Destinataires" description="Tous les invités dont l'invitation est active. Les invitations révoquées sont exclues.">
            <Pill>{recipients} invité{recipients > 1 ? "s" : ""}</Pill>
          </SettingRow>
          <div className="border-b border-border py-5">
            <label htmlFor="reminder-message" className="text-[15px] font-medium">
              Message
            </label>
            <textarea
              id="reminder-message"
              aria-invalid={!!errors.message}
              className="mt-2 min-h-28 w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-ring/30 aria-invalid:border-destructive"
              {...register("message")}
            />
            <p className={errors.message ? "mt-1 text-sm text-destructive" : "mt-1 text-xs text-muted-foreground"}>
              {errors.message?.message ?? `${message?.length ?? 0} / 320 caractères`}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" size="sm" loading={send.isPending} disabled={recipients === 0}>
              {!send.isPending && <Send />}
              Envoyer à tous les invités
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Historique des rappels">
        {reminders.map((r) => (
          <SettingRow key={r.id} title={`${r.canal === "SMS" ? "SMS" : "E-mail"} · ${r.destinataires} destinataires`} description={r.message}>
            <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
          </SettingRow>
        ))}
        {reminders.length === 0 && <EmptyState>Aucun rappel envoyé.</EmptyState>}
      </Section>
    </>
  );
}

export function GuestbookTab() {
  const { data: messages = [] } = useGuestbook();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const removeMessage = useDeleteGuestbookMessage();

  return (
    <>
      <Section title="Réglages">
        <SettingRow
          title="Livre d'or ouvert"
          description="Lorsque cette option est désactivée, le formulaire de l'accueil et celui du QR Code sont remplacés par un message de clôture. Les messages déjà reçus restent visibles."
        >
          <Switch
            label="Livre d'or ouvert"
            checked={settings?.guestbookOpen ?? true}
            disabled={!settings || updateSettings.isPending}
            onChange={(guestbookOpen) => updateSettings.mutate({ guestbookOpen }, { onSuccess: () => toast.success(guestbookOpen ? "Livre d'or ouvert" : "Livre d'or fermé") })}
          />
        </SettingRow>
      </Section>

      <Section title="Messages" description={`${messages.length} message${messages.length > 1 ? "s" : ""} laissé${messages.length > 1 ? "s" : ""} par les invités.`}>
        {messages.map((m) => (
          <SettingRow key={m.id} title={m.auteur} description={<>«&nbsp;{m.message}&nbsp;» — {formatDateTime(m.createdAt)}</>}>
            <IconButton label={`Supprimer le message de ${m.auteur}`} tone="danger" onClick={() => removeMessage.mutate(m.id, { onSuccess: () => toast.success("Message supprimé") })}>
              <Trash2 className="size-4" />
            </IconButton>
          </SettingRow>
        ))}
        {messages.length === 0 && <EmptyState>Le livre d&apos;or est vide.</EmptyState>}
      </Section>
    </>
  );
}

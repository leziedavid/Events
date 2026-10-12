"use client";

import { Ban, CheckCircle2, Download, Pencil, Printer, QrCode, RotateCcw, Search, Trash2, UserPlus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState, IconButton, NumberField, Pill, Section, Segmented } from "@/components/admin/ui";
import { InvitationBadge } from "@/components/invitation/InvitationBadge";
import { RsvpForm } from "@/components/rsvp/RsvpForm";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Modal } from "@/components/ui/MotionModal";
import { CATEGORIES, categoryMeta } from "@/config/categories";
import { wedding } from "@/config/wedding";
import { useCapacity, useCreateRsvp, useDeleteRsvp, useRestoreRsvp, useRevokeRsvp, useRsvps, useSettings, useUpdateRsvp, useValidateEntry } from "@/hooks/useWedding";
import { badgeFilename, downloadBadge, printBadge } from "@/lib/badge";
import { normalizePhone } from "@/lib/security";
import { cn, displayName, formatHour, personnes } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { GuestCategory, Rsvp } from "@/types/interface";

type Dialog = { type: "create" } | { type: "edit" | "badge" | "delete" | "validate" | "revoke"; guest: Rsvp } | null;
type StatusFilter = "ALL" | "PENDING" | "ARRIVED" | "REVOKED";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "ARRIVED", label: "Arrivés" },
  { value: "REVOKED", label: "Révoquées" },
];

export function GuestsTab() {
  const { data: guests = [], isLoading } = useRsvps();
  const { data: capacity } = useCapacity();
  const { data: settings } = useSettings();
  const familyMax = settings?.familyMax ?? wedding.familyMax;
  const remaining = capacity?.remaining ?? 0;
  const agent = useAuthStore((s) => s.user?.name) ?? "Organisateur";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GuestCategory | "ALL">("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [dialog, setDialog] = useState<Dialog>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const create = useCreateRsvp({ asAdmin: true });
  const update = useUpdateRsvp();
  const remove = useDeleteRsvp();
  const revoke = useRevokeRsvp();
  const restore = useRestoreRsvp();
  const validate = useValidateEntry();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = normalizePhone(q);
    return guests.filter((g) => {
      if (category !== "ALL" && g.categorie !== category) return false;
      if (status === "REVOKED" && !g.isRevoked) return false;
      if (status === "ARRIVED" && (!g.isVerified || g.isRevoked)) return false;
      if (status === "PENDING" && (g.isVerified || g.isRevoked)) return false;
      if (!q) return true;
      return (
        displayName(g).toLowerCase().includes(q) ||
        g.verificationCode.toLowerCase().includes(q) ||
        (digits.length > 0 && normalizePhone(g.telephone).includes(digits))
      );
    });
  }, [guests, search, category, status]);

  const activeCount = filtered.filter((g) => !g.isRevoked);
  const close = () => setDialog(null);
  const onError = (e: Error) => toast.error(e.message);
  const done = (message: string) => () => {
    toast.success(message);
    close();
  };

  /** Modifie le nombre de places d'une famille directement depuis la liste */
  const setPersons = async (guest: Rsvp, nombrePersonnes: number) => {
    try {
      await update.mutateAsync({ id: guest.id, input: { nom: guest.nom, telephone: guest.telephone, categorie: guest.categorie, nombrePersonnes } });
      toast.success(`${displayName(guest)} : ${personnes(nombrePersonnes)}`);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  };

  const badgeAction = async (action: (node: HTMLDivElement) => Promise<void>) => {
    if (!badgeRef.current) return;
    try {
      await action(badgeRef.current);
    } catch (e) {
      toast.error((e as Error).message || "Impossible de générer la carte.");
    }
  };

  return (
    <>
      <Section
        title="Invitations"
        description={`${activeCount.length} invitation${activeCount.length > 1 ? "s" : ""} · ${activeCount.reduce((s, g) => s + g.nombrePersonnes, 0)} personnes · ${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
        action={
          <Button size="sm" onClick={() => setDialog({ type: "create" })} disabled={capacity?.isFull}>
            <UserPlus />
            Ajouter un invité
          </Button>
        }
      >
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un nom, un téléphone, un code…"
              aria-label="Rechercher un invité"
              className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-[3px] focus:ring-ring/30"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GuestCategory | "ALL")}
            aria-label="Filtrer par catégorie"
            className="h-9 cursor-pointer rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">Toutes catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.plural}</option>
            ))}
          </select>
          <Segmented value={status} onChange={setStatus} options={STATUS_OPTIONS} label="Filtrer par statut" />
        </div>

        <div className="mt-2">
          {filtered.map((g) => {
            const c = categoryMeta(g.categorie);
            return (
              <div key={g.id} className={cn("flex flex-col gap-3 border-b border-border py-4 last:border-0 md:flex-row md:items-center md:justify-between", g.isRevoked && "opacity-60")}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `color-mix(in oklab, ${c.color} 16%, transparent)`, color: c.color }}>
                    <c.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
                      <span className={cn("truncate", g.isRevoked && "line-through")}>{displayName(g)}</span>
                      {g.isRevoked ? (
                        <Pill tone="danger">Révoquée</Pill>
                      ) : g.isVerified ? (
                        <Pill tone="success">Arrivé{g.verifiedAt ? ` à ${formatHour(g.verifiedAt)}` : ""}</Pill>
                      ) : (
                        <Pill>En attente</Pill>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {g.telephone} · {c.label}
                      {!g.isRevoked && <> · Table {g.tableNumero}</>} · <span className="font-mono text-xs">{g.verificationCode}</span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 pl-12 md:justify-end md:pl-0">
                  {g.categorie === "FAMILLE" && !g.isRevoked ? (
                    <NumberField
                      label={`Nombre de places de ${displayName(g)}`}
                      value={g.nombrePersonnes}
                      min={1}
                      // Les places de l'invité lui-même restent disponibles pour lui
                      max={Math.min(familyMax, remaining + g.nombrePersonnes)}
                      disabled={update.isPending}
                      onCommit={(n) => setPersons(g, n)}
                    />
                  ) : (
                    <span className="w-[7.4rem] text-center text-sm text-muted-foreground">{personnes(g.nombrePersonnes)}</span>
                  )}

                  <div className="flex items-center">
                    {g.isRevoked ? (
                      <IconButton label="Restaurer l'invitation" tone="success" onClick={() => restore.mutate(g.id, { onSuccess: () => toast.success("Invitation restaurée"), onError })}>
                        <RotateCcw className="size-4" />
                      </IconButton>
                    ) : (
                      <>
                        <IconButton label="Voir / réimprimer la carte" onClick={() => setDialog({ type: "badge", guest: g })}><QrCode className="size-4" /></IconButton>
                        <IconButton label="Valider l'entrée manuellement" tone="success" disabled={g.isVerified} onClick={() => setDialog({ type: "validate", guest: g })}><CheckCircle2 className="size-4" /></IconButton>
                        <IconButton label="Modifier" onClick={() => setDialog({ type: "edit", guest: g })}><Pencil className="size-4" /></IconButton>
                        <IconButton label="Révoquer l'invitation" tone="danger" disabled={g.isVerified} onClick={() => setDialog({ type: "revoke", guest: g })}><Ban className="size-4" /></IconButton>
                      </>
                    )}
                    <IconButton label="Supprimer définitivement" tone="danger" onClick={() => setDialog({ type: "delete", guest: g })}><Trash2 className="size-4" /></IconButton>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <EmptyState>{isLoading ? "Chargement…" : "Aucune invitation ne correspond à cette recherche."}</EmptyState>}
        </div>
      </Section>

      <Modal open={dialog?.type === "create"} onClose={close} title="Ajouter un invité" description="La table est attribuée automatiquement.">
        <RsvpForm submitLabel="Ajouter l'invité" loading={create.isPending} maxPersons={remaining} onSubmit={(values) => create.mutate(values, { onSuccess: done("Invité ajouté"), onError })} />
      </Modal>

      <Modal open={dialog?.type === "edit"} onClose={close} title="Modifier l'invitation">
        {dialog?.type === "edit" && (
          <RsvpForm
            key={dialog.guest.id}
            defaultValues={dialog.guest}
            submitLabel="Enregistrer"
            loading={update.isPending}
            maxPersons={remaining + dialog.guest.nombrePersonnes}
            onSubmit={(values) => update.mutate({ id: dialog.guest.id, input: values }, { onSuccess: done("Invitation modifiée"), onError })}
          />
        )}
      </Modal>

      <Modal open={dialog?.type === "badge"} onClose={close} title="Carte d'invitation" size="lg">
        {dialog?.type === "badge" && (
          <>
            <InvitationBadge guest={dialog.guest} ref={badgeRef} />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => badgeAction(printBadge)}>
                <Printer />
                Imprimer
              </Button>
              <Button onClick={() => badgeAction((node) => downloadBadge(node, badgeFilename(dialog.guest.verificationCode)))}>
                <Download />
                Télécharger
              </Button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmAction
        open={dialog?.type === "revoke"}
        onClose={close}
        title="Révoquer cette invitation ?"
        confirmLabel="Révoquer"
        destructive
        loading={revoke.isPending}
        onConfirm={() => dialog?.type === "revoke" && revoke.mutate(dialog.guest.id, { onSuccess: done("Invitation révoquée"), onError })}
      >
        {dialog?.type === "revoke" && (
          <>
            La carte de <strong className="text-foreground">{displayName(dialog.guest)}</strong> sera refusée à l&apos;entrée et{" "}
            {dialog.guest.nombrePersonnes > 1 ? `ses ${dialog.guest.nombrePersonnes} places seront libérées` : "sa place sera libérée"}. L&apos;invitation reste dans la
            liste : vous pourrez la restaurer tant qu&apos;il reste de la place.
          </>
        )}
      </ConfirmAction>

      <ConfirmAction
        open={dialog?.type === "delete"}
        onClose={close}
        title="Supprimer définitivement ?"
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() => dialog?.type === "delete" && remove.mutate(dialog.guest.id, { onSuccess: done("Invitation supprimée"), onError })}
      >
        {dialog?.type === "delete" && (
          <>
            L&apos;invitation de <strong className="text-foreground">{displayName(dialog.guest)}</strong> sera effacée et ne pourra pas être récupérée. Pour seulement
            l&apos;annuler, préférez « Révoquer ».
          </>
        )}
      </ConfirmAction>

      <ConfirmAction
        open={dialog?.type === "validate"}
        onClose={close}
        title="Valider l'entrée ?"
        confirmLabel="Valider l'entrée"
        loading={validate.isPending}
        onConfirm={() => dialog?.type === "validate" && validate.mutate({ guestId: dialog.guest.id, source: "ADMIN", agent }, { onSuccess: done("Entrée validée"), onError })}
      >
        {dialog?.type === "validate" && (
          <>
            <strong className="text-foreground">{displayName(dialog.guest)}</strong> sera marqué comme arrivé. Sa carte ne pourra plus être utilisée à l&apos;entrée.
          </>
        )}
      </ConfirmAction>
    </>
  );
}

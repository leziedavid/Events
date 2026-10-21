"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Download, ExternalLink, Pencil, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState, type Ref } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { IconButton, Pill, Section } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Modal } from "@/components/ui/MotionModal";
import { QR_DEFAULT_TARGETS, resolveQrTarget, weddingTitle } from "@/config/wedding";
import { useMounted } from "@/hooks/useMounted";
import { useEventInfo, useSettings, useUpdateSettings } from "@/hooks/useWedding";
import { downloadBadge, printBadge } from "@/lib/badge";
import { qrCodeSchema, type QrCodeInput } from "@/lib/schemas";
import type { QrCodeEntry } from "@/types/interface";

// Où chaque QR Code de la plateforme apparaît, pour que l'organisateur sache ce qu'il modifie
const USAGES: Record<QrCodeEntry["kind"], string> = {
  rsvp: "Affiché sur l'accueil, dans le bloc « Confirmer ma présence ».",
  "livre-dor": "Affiché sur l'accueil, dans la section Livre d'or.",
  "ma-carte": "À imprimer pour l'accueil : les invités sans carte la retrouvent avec leur numéro.",
  accueil: "Mène au site du mariage ; à glisser dans les faire-part papier.",
  verification: "Pour les agents d'accueil : ouvre le scanner de contrôle des entrées.",
  menu: "À poser sur les tables ou à glisser dans les faire-part : ouvre le menu du repas (page /menu).",
  custom: "QR Code ajouté par vous.",
};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-ring/30 aria-invalid:border-destructive";

/**
 * Affiche imprimable : couleurs en dur et tailles en `cqw`, comme la carte d'invitation,
 * pour que l'image téléchargée soit identique à l'aperçu, quel que soit le thème.
 */
function QrPoster({ entry, url, title, ref }: { entry: QrCodeEntry; url: string; title: string; ref?: Ref<HTMLDivElement> }) {
  return (
    <div className="@container w-full">
      <div ref={ref} className="relative flex aspect-[3/4] w-full flex-col items-center justify-between bg-white px-[9cqw] py-[10cqw] text-center text-[#14274a]">
        <span aria-hidden className="absolute inset-[3.5cqw] border border-[#c59d5f]" />
        <div className="relative">
          <p className="text-[3.2cqw] uppercase tracking-[0.25em] text-[#b0843a]">{title}</p>
          <p className="mt-[2.5cqw] text-[9cqw] leading-tight" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
            {entry.label}
          </p>
        </div>
        <div className="relative size-[56cqw]">{url && <QRCodeSVG value={url} size={512} level="M" fgColor="#14274a" className="size-full" />}</div>
        <div className="relative">
          {entry.caption && <p className="text-[4cqw] leading-snug">{entry.caption}</p>}
          <p className="mt-[2cqw] break-all font-mono text-[2.6cqw] text-[#6c6a66]">{url.replace(/^https?:\/\//, "")}</p>
        </div>
      </div>
    </div>
  );
}

function QrForm({ entry, onSubmit, loading }: { entry?: QrCodeEntry; onSubmit: (values: QrCodeInput) => void; loading: boolean }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<QrCodeInput>({
    resolver: zodResolver(qrCodeSchema),
    defaultValues: { label: entry?.label ?? "", caption: entry?.caption ?? "", target: entry?.target ?? "https://" },
  });
  const defaultTarget = entry && entry.kind !== "custom" ? QR_DEFAULT_TARGETS[entry.kind] : null;
  const error = (message?: string) => message && <p role="alert" className="mt-1 text-xs text-destructive">{message}</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="qr-target" className="text-sm font-medium">Lien du QR Code</label>
        <input id="qr-target" spellCheck={false} aria-invalid={!!errors.target} className={`${fieldClass} h-10 font-mono`} {...register("target")} />
        {error(errors.target?.message) || (
          <p className="mt-1 text-xs text-muted-foreground">
            Une page du site (ex. <span className="font-mono">/rsvp</span>) ou une adresse complète (ex. un groupe WhatsApp, une cagnotte).
          </p>
        )}
        {defaultTarget && (
          <button type="button" onClick={() => setValue("target", defaultTarget, { shouldDirty: true, shouldValidate: true })} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <RotateCcw className="size-3" /> Lien par défaut ({defaultTarget})
          </button>
        )}
      </div>
      <div>
        <label htmlFor="qr-label" className="text-sm font-medium">Titre imprimé</label>
        <input id="qr-label" aria-invalid={!!errors.label} className={`${fieldClass} h-10`} {...register("label")} />
        {error(errors.label?.message)}
      </div>
      <div>
        <label htmlFor="qr-caption" className="text-sm font-medium">Consigne sous le QR Code</label>
        <textarea id="qr-caption" aria-invalid={!!errors.caption} className={`${fieldClass} min-h-16 resize-none py-2`} {...register("caption")} />
        {error(errors.caption?.message)}
      </div>
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" loading={loading}>
          {entry ? "Enregistrer" : "Créer le QR Code"}
        </Button>
      </div>
    </form>
  );
}

function QrCard({ entry, url, title, onEdit, onDelete }: { entry: QrCodeEntry; url: string; title: string; onEdit: () => void; onDelete?: () => void }) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "print" | null>(null);

  const run = async (kind: "download" | "print") => {
    if (!posterRef.current) return;
    setBusy(kind);
    try {
      if (kind === "download") await downloadBadge(posterRef.current, `qr-${entry.label.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`);
      else await printBadge(posterRef.current, entry.label);
    } catch (e) {
      toast.error((e as Error).message || "Impossible de générer l'image.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/50 p-4">
        <div className="mx-auto max-w-[15rem] border border-border">
          <QrPoster entry={entry} url={url} title={title} ref={posterRef} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-medium">{entry.label}</p>
          {entry.kind === "custom" ? <Pill>Personnalisé</Pill> : entry.target !== QR_DEFAULT_TARGETS[entry.kind] && <Pill tone="warning">Lien modifié</Pill>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{USAGES[entry.kind]}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 break-all font-mono text-xs text-primary hover:underline">
          {url} <ExternalLink className="size-3 shrink-0" />
        </a>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Button size="sm" variant="outline" onClick={() => run("download")} loading={busy === "download"}>
            {busy !== "download" && <Download />}
            PNG
          </Button>
          <Button size="sm" variant="outline" onClick={() => run("print")} loading={busy === "print"}>
            {busy !== "print" && <Printer />}
            Imprimer
          </Button>
          <span className="ml-auto flex items-center">
            <IconButton label={`Modifier ${entry.label}`} onClick={onEdit}>
              <Pencil className="size-4" />
            </IconButton>
            {onDelete && (
              <IconButton label={`Supprimer ${entry.label}`} tone="danger" onClick={onDelete}>
                <Trash2 className="size-4" />
              </IconButton>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

type Dialog = { type: "create" } | { type: "edit" | "delete"; entry: QrCodeEntry } | null;

/** Onglet « QR Codes » : tous les QR Codes de la plateforme, leur lien, leur impression */
export function QrTab() {
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const mounted = useMounted();
  const title = weddingTitle(useEventInfo());
  const [dialog, setDialog] = useState<Dialog>(null);

  if (!settings || !mounted) return <p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>;

  const origin = window.location.origin;
  const isLocal = /localhost|127\.0\.0\.1|\[::1\]/.test(origin);
  const codes = settings.qrCodes;
  const close = () => setDialog(null);
  const save = (qrCodes: QrCodeEntry[], message: string) =>
    update.mutate(
      { qrCodes },
      {
        onSuccess: () => {
          toast.success(message);
          close();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <>
      <Section
        title="QR Codes de la plateforme"
        description="Chaque QR Code peut pointer vers une page du site ou vers une adresse de votre choix. Téléchargez-le en image ou imprimez-le pour vos supports (chevalets de table, affiches, faire-part)."
        action={
          <Button size="sm" onClick={() => setDialog({ type: "create" })} disabled={codes.length >= 20}>
            <Plus />
            Ajouter un QR Code
          </Button>
        }
      >
        {isLocal && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-warning/12 px-4 py-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Le site tourne en local ({origin}) : les QR Codes vers une page du site pointent vers cet ordinateur et ne s&apos;ouvriront pas sur les téléphones
              des invités. Imprimez-les depuis l&apos;adresse en ligne (Vercel), ou saisissez une adresse complète.
            </span>
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          Un QR Code imprimé garde le lien qu&apos;il avait au moment de l&apos;impression : après un changement de lien, réimprimez-le.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {codes.map((entry) => (
            <QrCard
              key={entry.id}
              entry={entry}
              title={title}
              url={resolveQrTarget(entry.target, origin)}
              onEdit={() => setDialog({ type: "edit", entry })}
              onDelete={entry.kind === "custom" ? () => setDialog({ type: "delete", entry }) : undefined}
            />
          ))}
        </div>
      </Section>

      <Modal open={dialog?.type === "create"} onClose={close} title="Ajouter un QR Code" description="Par exemple : groupe WhatsApp des invités, cagnotte, album photo partagé." size="sm">
        <QrForm loading={update.isPending} onSubmit={(values) => save([...codes, { id: crypto.randomUUID(), kind: "custom", ...values }], "QR Code créé")} />
      </Modal>

      <Modal open={dialog?.type === "edit"} onClose={close} title="Modifier le QR Code" size="sm">
        {dialog?.type === "edit" && (
          <QrForm key={dialog.entry.id} entry={dialog.entry} loading={update.isPending} onSubmit={(values) => save(codes.map((c) => (c.id === dialog.entry.id ? { ...c, ...values } : c)), "QR Code enregistré")} />
        )}
      </Modal>

      <ConfirmAction
        open={dialog?.type === "delete"}
        onClose={close}
        title="Supprimer ce QR Code ?"
        confirmLabel="Supprimer"
        destructive
        loading={update.isPending}
        onConfirm={() => dialog?.type === "delete" && save(codes.filter((c) => c.id !== dialog.entry.id), "QR Code supprimé")}
      >
        {dialog?.type === "delete" && (
          <>
            <strong className="text-foreground">{dialog.entry.label}</strong> disparaîtra de cette liste. Les exemplaires déjà imprimés continueront de mener à leur lien.
          </>
        )}
      </ConfirmAction>
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import { Ban, CalendarPlus, Download, Loader2, PartyPopper, SearchX, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InvitationBadge } from "@/components/invitation/InvitationBadge";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Divider } from "@/components/shared/Ornaments";
import { EASE } from "@/components/shared/Reveal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Modal } from "@/components/ui/MotionModal";
import { googleCalendarUrl, weddingTitle } from "@/config/wedding";
import { useEventInfo, useRsvp } from "@/hooks/useWedding";
import { badgeFile, badgeFilename, canShareFile, downloadFile, isAppleMobile } from "@/lib/badge";

export default function InvitationPage() {
  const { code } = useParams<{ code: string }>();
  const { data: guest, isLoading } = useRsvp(decodeURIComponent(code));
  const event = useEventInfo();
  const badgeRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  // Image de la carte préparée à l'avance : sur iPhone, la feuille de partage (« Enregistrer
  // l'image » → Photos) ne s'ouvre que si elle suit immédiatement le toucher de l'invité
  const fileRef = useRef<File | null>(null);
  // Dernier recours (iOS ancien, partage refusé) : l'image affichée, à enregistrer d'un appui long
  const [preview, setPreview] = useState<string | null>(null);

  const cardKey = guest ? `${guest.id}|${guest.nom}|${guest.tableNumero}|${guest.qrToken ?? ""}` : "";
  useEffect(() => {
    if (!cardKey || !badgeRef.current) return;
    fileRef.current = null;
    let cancelled = false;
    // Après l'animation d'apparition de la carte (≈ 1 s) : capture d'une carte complète. Une
    // capture refusée (carte pas encore affichée, téléphone lent) est retentée, 4 fois au plus.
    let id: ReturnType<typeof setTimeout>;
    const attempt = (left: number) => {
      id = setTimeout(() => {
        if (cancelled || !badgeRef.current) return;
        badgeFile(badgeRef.current, badgeFilename(guest!.verificationCode))
          .then((file) => {
            if (!cancelled) fileRef.current = file;
          })
          .catch(() => {
            if (left > 1) attempt(left - 1);
          });
      }, 1400);
    };
    attempt(4);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cardKey résume la carte affichée
  }, [cardKey]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  /** Fichier de la carte : celui préparé à l'avance, sinon généré maintenant */
  const getFile = async () => {
    if (fileRef.current) return fileRef.current;
    if (!badgeRef.current) throw new Error("Carte indisponible");
    const file = await badgeFile(badgeRef.current, badgeFilename(guest!.verificationCode));
    fileRef.current = file;
    return file;
  };

  const showPreview = (file: File) => setPreview(URL.createObjectURL(file));

  const run = async (kind: "download" | "share", action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
    } catch (e) {
      // L'annulation de la feuille de partage n'est pas une erreur à signaler
      if ((e as Error).name !== "AbortError") toast.error("Impossible de générer la carte. Réessayez.");
    } finally {
      setBusy(null);
    }
  };

  /**
   * Partage du fichier. `navigator.share` est appelé sans aucune attente quand l'image est prête
   * (exigence d'iOS) ; si le système refuse malgré tout, l'image s'affiche pour un appui long.
   */
  const shareFile = async (file: File, data: ShareData) => {
    try {
      await navigator.share({ ...data, files: [file] });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      showPreview(file);
    }
  };

  const download = () =>
    run("download", async () => {
      const ready = fileRef.current;
      if (isAppleMobile()) {
        // iPhone / iPad : la feuille de partage propose « Enregistrer l'image » (galerie Photos).
        // Fichier seul, sans texte : avec un texte, certaines versions d'iOS masquent cette option.
        if (ready && canShareFile(ready)) return shareFile(ready, {});
        return showPreview(ready ?? (await getFile()));
      }
      downloadFile(ready ?? (await getFile()));
      toast.success("Carte enregistrée");
    });

  const share = () =>
    run("share", async () => {
      const ready = fileRef.current;
      const data = { title: weddingTitle(event), text: "Ma carte d'invitation" };
      if (ready && canShareFile(ready)) return shareFile(ready, data);
      const file = ready ?? (await getFile());
      if (canShareFile(file) && !isAppleMobile()) return shareFile(file, data);
      if (isAppleMobile()) return showPreview(file);
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien de l'invitation copié");
    });

  return (
    <>
      <SiteHeader variant="page" />
      <main className="ambient-bg min-h-[100svh] px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <div className="grid h-80 place-items-center">
              <Loader2 className="size-8 animate-spin text-gold" />
            </div>
          ) : !guest ? (
            <div className="glass rounded-3xl p-10 text-center">
              <SearchX className="mx-auto size-10 text-gold" />
              <h1 className="mt-4 font-display text-3xl font-semibold">Invitation introuvable</h1>
              <p className="mt-2 text-sm text-muted-foreground">Ce lien ne correspond à aucune invitation enregistrée sur cet appareil.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/ma-carte" className={buttonVariants()}>
                  Retrouver ma carte
                </Link>
                <Link href="/rsvp" className={buttonVariants({ variant: "outline" })}>
                  Confirmer ma présence
                </Link>
              </div>
            </div>
          ) : guest.isRevoked ? (
            <div className="glass rounded-3xl p-10 text-center">
              <Ban className="mx-auto size-10 text-destructive" />
              <h1 className="mt-4 font-display text-3xl font-semibold">Invitation annulée</h1>
              <p className="mt-2 text-sm text-muted-foreground">Cette invitation n&apos;est plus valable. Rapprochez-vous des mariés pour en savoir plus.</p>
              <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="text-center">
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10, stiffness: 180, delay: 0.2 }}
                  className="mx-auto grid size-14 place-items-center rounded-full bg-gold/15 text-gold"
                >
                  <PartyPopper className="size-7" />
                </motion.span>
                <h1 className="mt-4 font-display text-4xl font-medium sm:text-5xl">Merci, {guest.nom}&nbsp;!</h1>
                <Divider className="mt-4" />
                <p className="mx-auto mt-4 max-w-lg text-[15px] text-muted-foreground">
                  Votre présence est confirmée. Voici votre carte d&apos;invitation : enregistrez-la et présentez son QR Code à l&apos;entrée.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateX: 25 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: EASE }}
                style={{ transformPerspective: 1200 }}
                className="mt-9 rounded-[1.6rem] shadow-[0_40px_80px_-35px_rgba(58,28,17,0.9)]"
              >
                <InvitationBadge guest={guest} ref={badgeRef} />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 grid gap-3 sm:grid-cols-3">
                <Button size="lg" onClick={download} loading={busy === "download"}>
                  {busy !== "download" && <Download />}
                  Télécharger
                </Button>
                <Button size="lg" variant="outline" onClick={share} loading={busy === "share"}>
                  {busy !== "share" && <Share2 />}
                  Partager
                </Button>
                <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  <CalendarPlus />
                  Google Agenda
                </a>
              </motion.div>
            </>
          )}
        </div>
      </main>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Enregistrer la carte" size="md">
        {preview && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Appuyez longuement sur l&apos;image, puis choisissez <strong>« Ajouter à Photos »</strong> (ou « Enregistrer l&apos;image »).
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- image générée dans le navigateur (blob) */}
            <img src={preview} alt="Carte d'invitation" className="w-full rounded-xl" style={{ WebkitTouchCallout: "default" }} />
          </div>
        )}
      </Modal>
    </>
  );
}

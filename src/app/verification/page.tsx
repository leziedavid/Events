"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, LayoutDashboard, LogOut, ScanLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Monogram } from "@/components/layout/SiteHeader";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrScanner, type ScanFeedback } from "@/components/verification/QrScanner";
import { VerificationResult } from "@/components/verification/VerificationResult";
import { useMounted } from "@/hooks/useMounted";
import { useLookupInvitation, useRsvps, useValidateEntry } from "@/hooks/useWedding";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { LookupResult, ScanSource } from "@/types/interface";

type Mode = "scan" | "code";

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

export default function VerificationPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const agent = (mounted && user?.name) || "Agent d'accueil";

  const [mode, setMode] = useState<Mode>("scan");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [source, setSource] = useState<ScanSource>("QR");
  const [justValidated, setJustValidated] = useState(false);
  const [feedback, setFeedback] = useState<ScanFeedback>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const lookup = useLookupInvitation();
  const validate = useValidateEntry();
  const { data: guests = [] } = useRsvps();
  const arrived = guests.filter((g) => g.isVerified);

  // Le halo vert / rouge du scanner s'éteint de lui-même
  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback(null), 1800);
    return () => clearTimeout(id);
  }, [feedback]);

  const { mutate: runLookup } = lookup;
  const check = useCallback(
    (raw: string, from: ScanSource) => {
      if (!raw.trim()) return;
      runLookup(
        { raw, source: from, agent },
        {
          onSuccess: (res) => {
            const good = res.status === "FOUND";
            setFeedback(good ? "valid" : "invalid");
            vibrate(good ? 120 : [90, 60, 90, 60, 90]);
            setSource(from);
            setJustValidated(false);
            setResult(res);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    },
    [runLookup, agent],
  );

  const onScan = useCallback((text: string) => check(text, "QR"), [check]);

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    check(code, "CODE");
  };

  const validateEntry = () => {
    if (!result?.guest) return;
    validate.mutate(
      { guestId: result.guest.id, source, agent },
      {
        onSuccess: (guest) => {
          vibrate(200);
          setJustValidated(true);
          setResult({ status: "ALREADY_USED", guest });
          toast.success("Entrée validée");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const next = () => {
    setResult(null);
    setJustValidated(false);
    setCode("");
  };

  return (
    <main className="ambient-bg min-h-[100svh] px-4 pb-12 pt-4">
      {/* Éclair plein écran, vert ou rouge : le verdict se voit du coin de l'œil */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback}
            aria-hidden
            initial={{ opacity: 0.75 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={cn("pointer-events-none fixed inset-0 z-50", feedback === "valid" ? "bg-success" : "bg-destructive")}
          />
        )}
      </AnimatePresence>
      <header className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <Link href="/" aria-label="Accueil">
          <Monogram />
        </Link>
        <div className="flex items-center gap-2">
          {mounted && user?.role === "ADMIN" && (
            <Link href="/admin" aria-label="Tableau de bord" title="Tableau de bord" className="glass grid size-10 place-items-center rounded-full text-gold">
              <LayoutDashboard className="size-[18px]" />
            </Link>
          )}
          <ThemeToggle />
          <button
            type="button"
            aria-label="Se déconnecter"
            title="Se déconnecter"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="glass grid size-10 place-items-center rounded-full text-gold"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </header>

      <div className="mx-auto mt-6 max-w-xl">
        <h1 className="font-display text-4xl font-medium">Contrôle des entrées</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {agent} · {arrived.length} invitation{arrived.length > 1 ? "s" : ""} validée{arrived.length > 1 ? "s" : ""} ·{" "}
          {arrived.reduce((s, g) => s + g.nombrePersonnes, 0)} personnes entrées
        </p>

        <div className="glass mt-5 grid grid-cols-2 rounded-full p-1" role="tablist">
          {([["scan", "Scanner", ScanLine], ["code", "Saisir le code", Keyboard]] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn("relative flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors", mode === value ? "text-primary-foreground" : "text-muted-foreground")}
            >
              {mode === value && <motion.span layoutId="verif-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", damping: 26, stiffness: 300 }} />}
              <Icon className="relative size-4" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          {/* Pas d'animation de sortie ici : le résultat doit s'afficher immédiatement,
              même si le navigateur ralentit les animations (onglet en arrière-plan, économie d'énergie) */}
          <>
            {result ? (
              <motion.div key="result">
                <VerificationResult result={result} justValidated={justValidated} onValidate={validateEntry} validating={validate.isPending} onNext={next} />
              </motion.div>
            ) : mode === "scan" ? (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <QrScanner onDetect={onScan} feedback={feedback} autoStart={cameraOn} onActiveChange={setCameraOn} />
              </motion.div>
            ) : (
              <motion.form key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submitCode} className="glass rounded-3xl p-6">
                <label htmlFor="verif-code" className="text-sm font-medium">
                  Code inscrit sous le QR Code
                </label>
                <Input
                  id="verif-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-2 h-14 text-center font-mono text-2xl tracking-[0.25em]"
                />
                <Button type="submit" size="lg" className="mt-4 w-full" loading={lookup.isPending} disabled={!code.trim()}>
                  Vérifier
                </Button>
              </motion.form>
            )}
          </>
        </div>
      </div>
    </main>
  );
}

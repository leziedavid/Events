"use client";

import { AlertTriangle, Ban, CheckCircle2, ShieldX, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState, Section, Segmented } from "@/components/admin/ui";
import { useScans } from "@/hooks/useWedding";
import { formatDateTime } from "@/lib/utils";
import type { ScanResult, ScanSource } from "@/types/interface";

const RESULTS: Record<ScanResult, { label: string; icon: LucideIcon; color: string }> = {
  VALID: { label: "Entrée validée", icon: CheckCircle2, color: "var(--success)" },
  ALREADY_USED: { label: "Déjà utilisée", icon: AlertTriangle, color: "var(--warning)" },
  REVOKED: { label: "Révoquée", icon: Ban, color: "var(--destructive)" },
  INVALID: { label: "Code invalide", icon: ShieldX, color: "var(--destructive)" },
};

const SOURCES: Record<ScanSource, string> = { QR: "QR Code", CODE: "Saisie du code", ADMIN: "Validation manuelle" };

export function ScansTab() {
  const { data: scans = [], isLoading } = useScans();
  const [filter, setFilter] = useState<ScanResult | "ALL">("ALL");
  const count = (result: ScanResult) => scans.filter((s) => s.result === result).length;
  const visible = filter === "ALL" ? scans : scans.filter((s) => s.result === filter);

  return (
    <>
      <Section title="Résumé">
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(Object.keys(RESULTS) as ScanResult[]).map((key) => {
            const { label, icon: Icon, color } = RESULTS[key];
            return (
              <div key={key} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted-foreground">{label}</p>
                  <Icon className="size-4 shrink-0" style={{ color }} />
                </div>
                <p className="mt-1.5 text-3xl font-semibold tabular-nums">{count(key)}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title="Historique"
        description="Chaque lecture de carte à l'entrée, de la plus récente à la plus ancienne."
        action={
          <Segmented
            value={filter}
            onChange={setFilter}
            label="Filtrer l'historique"
            options={[{ value: "ALL", label: "Tout" }, ...(Object.keys(RESULTS) as ScanResult[]).map((key) => ({ value: key, label: RESULTS[key].label }))]}
          />
        }
      >
        {visible.map((scan) => {
          const { label, icon: Icon, color } = RESULTS[scan.result];
          return (
            <div key={scan.id} className="flex items-center gap-3 border-b border-border py-4 last:border-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`, color }}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{scan.guestName ?? "Invitation inconnue"}</p>
                <p className="truncate text-sm text-muted-foreground">
                  <span className="font-mono text-xs">{scan.code}</span> · {SOURCES[scan.source]} · {scan.agent}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium" style={{ color }}>{label}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(scan.createdAt)}</p>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && <EmptyState>{isLoading ? "Chargement…" : "Aucun scan enregistré."}</EmptyState>}
      </Section>
    </>
  );
}

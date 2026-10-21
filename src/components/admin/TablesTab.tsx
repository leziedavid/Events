"use client";

import { Shuffle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Box, EmptyState, Pill, Section } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { useReassignTables, useTables } from "@/hooks/useWedding";
import { cn, displayName } from "@/lib/utils";

export function TablesTab() {
  const { data: tables = [], isLoading } = useTables();
  const reassign = useReassignTables();
  const [confirm, setConfirm] = useState(false);

  const full = tables.filter((t) => t.occupied >= t.seats).length;
  const seats = tables.reduce((s, t) => s + t.seats, 0);
  const occupied = tables.reduce((s, t) => s + t.occupied, 0);
  const chosen = tables.reduce((s, t) => s + t.guests.filter((g) => g.tableChoisie).length, 0);

  return (
    <>
      <Section
        title="Plan de table"
        description={
          tables.length
            ? `${tables.length} tables ouvertes · ${full} pleine${full > 1 ? "s" : ""} · ${occupied} / ${seats} sièges occupés (${Math.round((occupied / seats) * 100)}%) · ${chosen} invitation${chosen > 1 ? "s ont" : " a"} choisi sa table`
            : undefined
        }
        action={
          <Button size="sm" variant="outline" onClick={() => setConfirm(true)} disabled={tables.length === 0}>
            <Shuffle />
            Réorganiser les tables
          </Button>
        }
      >
        {tables.length === 0 ? (
          <EmptyState>{isLoading ? "Chargement…" : "Aucune table attribuée pour l'instant."}</EmptyState>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => {
              const free = table.seats - table.occupied;
              return (
                <Box key={table.numero}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-semibold">Table {table.numero}</p>
                    {free <= 0 ? <Pill tone="success">Pleine</Pill> : <Pill>{free} place{free > 1 ? "s" : ""} libre{free > 1 ? "s" : ""}</Pill>}
                  </div>

                  {/* Un trait par siège : le remplissage se lit sans chiffre */}
                  <div className="mt-3 flex gap-1" aria-label={`${table.occupied} sièges occupés sur ${table.seats}`}>
                    {Array.from({ length: table.seats }, (_, seat) => (
                      <span key={seat} className={cn("h-1.5 flex-1 rounded-full", seat < table.occupied ? "bg-primary" : "bg-muted")} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {table.occupied} / {table.seats} · {Math.round((table.occupied / table.seats) * 100)}%
                  </p>

                  <ul className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                    {table.guests.map((g) => (
                      <li key={g.id} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={cn("size-1.5 shrink-0 rounded-full", g.isVerified ? "bg-success" : "bg-muted-foreground/40")} title={g.isVerified ? "Arrivé" : "En attente"} />
                          <span className="truncate">{displayName(g)}</span>
                          {g.tableChoisie && (
                            <span title="Table choisie par l'invité" className="shrink-0 text-xs text-primary">
                              choisie
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">({g.nombrePersonnes})</span>
                      </li>
                    ))}
                  </ul>
                </Box>
              );
            })}
          </div>
        )}
      </Section>

      <ConfirmAction
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Réorganiser les tables ?"
        confirmLabel="Réorganiser"
        loading={reassign.isPending}
        onConfirm={() =>
          reassign.mutate(undefined, {
            onSuccess: (moved) => {
              toast.success(moved === 0 ? "Le plan de table était déjà optimal" : `${moved} invitation${moved > 1 ? "s" : ""} changée${moved > 1 ? "s" : ""} de table`);
              setConfirm(false);
            },
            onError: (e) => toast.error(e.message),
          })
        }
      >
        Les invités qui ont choisi leur table y restent (tant que leur groupe y tient). Les autres sont replacés depuis la Table 1, dans l&apos;ordre
        d&apos;inscription, pour combler les places libérées. Les numéros de table peuvent changer :
        les cartes déjà téléchargées ou imprimées afficheront l&apos;ancien numéro.
      </ConfirmAction>
    </>
  );
}

"use client";

import { FileDown, Pencil, Shuffle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Box, EmptyState, IconButton, Pill, Section, TextInput } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Modal } from "@/components/ui/MotionModal";
import { weddingTitle } from "@/config/wedding";
import { useEventInfo, useReassignTables, useRenameTable, useTables } from "@/hooks/useWedding";
import { downloadTablePdf } from "@/lib/table-pdf";
import { cn, displayName, tableLabel } from "@/lib/utils";
import type { TableSummary } from "@/types/interface";

/** Renommer une table : le numéro (qui relie les invitations) ne change pas */
function RenameForm({ table, onDone }: { table: TableSummary; onDone: () => void }) {
  const rename = useRenameTable();
  const [name, setName] = useState(table.name);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return toast.error("Indiquez un nom de table.");
    rename.mutate(
      { numero: table.numero, name: value },
      {
        onSuccess: () => {
          toast.success(`Table ${table.numero} renommée « ${value} »`);
          onDone();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="table-name" className="text-sm font-medium">
          Nom de la table n° {table.numero}
        </label>
        <TextInput id="table-name" className="mt-1.5 w-full" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Affiché sur les cartes d&apos;invitation, au contrôle des entrées et sur le PDF de la table. Les invités restent à leur table.
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={rename.isPending}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

export function TablesTab() {
  const { data: tables = [], isLoading } = useTables();
  const reassign = useReassignTables();
  const title = weddingTitle(useEventInfo());
  const [confirm, setConfirm] = useState(false);
  const [renaming, setRenaming] = useState<TableSummary | null>(null);
  const [printing, setPrinting] = useState<number | null>(null);

  const full = tables.filter((t) => t.occupied >= t.seats).length;
  const seats = tables.reduce((s, t) => s + t.seats, 0);
  const occupied = tables.reduce((s, t) => s + t.occupied, 0);
  const chosen = tables.reduce((s, t) => s + t.guests.filter((g) => g.tableChoisie).length, 0);

  // Noms en double (ex. deux « VENISE ») : signalés pour être renommés, jamais corrigés d'office
  const duplicates = Object.entries(
    tables.reduce<Record<string, number[]>>((acc, t) => {
      const key = t.name.trim().toUpperCase();
      (acc[key] ??= []).push(t.numero);
      return acc;
    }, {}),
  ).filter(([, numeros]) => numeros.length > 1);

  const print = async (table: TableSummary) => {
    setPrinting(table.numero);
    try {
      await downloadTablePdf(table, title);
    } catch {
      toast.error("Le PDF n'a pas pu être généré.");
    } finally {
      setPrinting(null);
    }
  };

  return (
    <>
      <Section
        title="Plan de table"
        description={
          tables.length
            ? `${tables.length} tables · ${full} pleine${full > 1 ? "s" : ""} · ${occupied} / ${seats} sièges occupés (${Math.round((occupied / Math.max(1, seats)) * 100)}%) · ${chosen} invitation${chosen > 1 ? "s ont" : " a"} choisi sa table. Le nombre de tables suit le nombre de personnes attendues (onglet Événement).`
            : undefined
        }
        action={
          <Button size="sm" variant="outline" onClick={() => setConfirm(true)} disabled={tables.length === 0}>
            <Shuffle />
            Réorganiser les tables
          </Button>
        }
      >
        {duplicates.length > 0 && (
          <p role="alert" className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
            {duplicates.map(([name, numeros]) => `« ${name} » est utilisé par les tables ${numeros.join(" et ")}`).join(" ; ")}. Les
            invités ne sont pas mélangés (chaque table a son numéro), mais le même nom sur deux tables peut prêter à confusion le jour J :
            renommez-en une avec le crayon si ce doublon n&apos;est pas voulu.
          </p>
        )}

        {tables.length === 0 ? (
          <EmptyState>{isLoading ? "Chargement…" : "Aucune table : indiquez le nombre de personnes attendues dans l'onglet Événement."}</EmptyState>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => {
              const free = table.seats - table.occupied;
              return (
                <Box key={table.numero}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                        <span className="truncate">{tableLabel(table.numero, [table])}</span>
                        {table.isVip && <Pill tone="warning">Réservée</Pill>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        N° {table.numero} · {free <= 0 ? "pleine" : `${free} place${free > 1 ? "s" : ""} libre${free > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <IconButton label={`Renommer ${tableLabel(table.numero, [table])}`} onClick={() => setRenaming(table)}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label={`PDF de ${tableLabel(table.numero, [table])} (nom et liste des invités)`} disabled={printing === table.numero} onClick={() => print(table)}>
                        <FileDown className="size-4" />
                      </IconButton>
                    </div>
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

                  {table.guests.length > 0 && (
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
                  )}
                </Box>
              );
            })}
          </div>
        )}
      </Section>

      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="Renommer la table" size="sm">
        {renaming && <RenameForm table={renaming} onDone={() => setRenaming(null)} />}
      </Modal>

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
        Les invités qui ont choisi leur table y restent (tant que leur groupe y tient). Les autres sont replacés sur les tables non réservées,
        dans l&apos;ordre d&apos;inscription, pour combler les places libérées : les tables VIP 1 et VIP 2 ne reçoivent que les invités
        qui les ont choisies. Les cartes déjà téléchargées ou imprimées afficheront l&apos;ancienne table.
      </ConfirmAction>
    </>
  );
}

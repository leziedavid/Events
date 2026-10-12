import type { Rsvp, TableSummary } from "@/types/interface";

type Seated = Pick<Rsvp, "id" | "tableNumero" | "nombrePersonnes">;

/**
 * Première table capable d'accueillir tout le groupe (un groupe n'est jamais séparé).
 * Les tables sont remplies dans l'ordre : Table 1 jusqu'à ce qu'elle soit pleine, puis
 * Table 2, etc. Une place libérée par une suppression est donc réutilisée en priorité.
 */
export function findTable(guests: Seated[], groupSize: number, tableSize: number, excludeId?: string): number {
  const occupied = new Map<number, number>();
  for (const g of guests) {
    if (g.id === excludeId) continue;
    occupied.set(g.tableNumero, (occupied.get(g.tableNumero) ?? 0) + g.nombrePersonnes);
  }
  let numero = 1;
  while ((occupied.get(numero) ?? 0) + groupSize > tableSize) numero++;
  return numero;
}

/**
 * Replace tous les invités depuis la Table 1, dans l'ordre d'inscription. Sert quand la
 * taille des tables change ou pour combler les trous laissés par des suppressions.
 * Les invitations révoquées n'ont pas de table (numéro 0).
 */
export function reassignAll(guests: Rsvp[], tableSize: number): Rsvp[] {
  const placed: Rsvp[] = [];
  const ordered = [...guests].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const g of ordered) {
    placed.push({ ...g, tableNumero: g.isRevoked ? 0 : findTable(placed.filter((p) => !p.isRevoked), g.nombrePersonnes, tableSize) });
  }
  const byId = new Map(placed.map((g) => [g.id, g]));
  return guests.map((g) => byId.get(g.id) ?? g);
}

export function buildTables(guests: Rsvp[], tableSize: number): TableSummary[] {
  const byTable = new Map<number, Rsvp[]>();
  for (const g of guests) {
    byTable.set(g.tableNumero, [...(byTable.get(g.tableNumero) ?? []), g]);
  }
  return [...byTable.entries()]
    .sort(([a], [b]) => a - b)
    .map(([numero, list]) => ({
      numero,
      seats: tableSize,
      occupied: list.reduce((sum, g) => sum + g.nombrePersonnes, 0),
      guests: list,
    }));
}

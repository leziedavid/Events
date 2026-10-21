import type { Rsvp, TableOption, TableSummary } from "@/types/interface";

type Seated = Pick<Rsvp, "id" | "tableNumero" | "nombrePersonnes">;

/**
 * Première table capable d'accueillir tout le groupe (un groupe n'est jamais séparé).
 * Les tables sont remplies dans l'ordre : Table 1 jusqu'à ce qu'elle soit pleine, puis
 * Table 2, etc. Une place libérée par une suppression est donc réutilisée en priorité.
 */
export function findTable(guests: Seated[], groupSize: number, tableSize: number, excludeId?: string): number {
  const occupied = tableLoads(guests, excludeId);
  let numero = 1;
  while ((occupied.get(numero) ?? 0) + groupSize > tableSize) numero++;
  return numero;
}

/** Places occupées par table (invités actifs, hors `excludeId`) */
export function tableLoads(guests: Seated[], excludeId?: string): Map<number, number> {
  const occupied = new Map<number, number>();
  for (const g of guests) {
    if (g.id === excludeId) continue;
    occupied.set(g.tableNumero, (occupied.get(g.tableNumero) ?? 0) + g.nombrePersonnes);
  }
  return occupied;
}

/**
 * Tables proposées dans le formulaire RSVP : de la Table 1 jusqu'au nombre de tables que la
 * capacité permet d'ouvrir (150 places / 8 = 19 tables), plus toute table au-delà déjà occupée.
 */
export function tableOptions(guests: Seated[], capacity: number, tableSize: number, excludeId?: string): TableOption[] {
  const occupied = tableLoads(guests, excludeId);
  const count = Math.max(Math.ceil(capacity / tableSize), ...occupied.keys(), 0);
  return Array.from({ length: count }, (_, i) => {
    const numero = i + 1;
    return { numero, seats: tableSize, free: Math.max(0, tableSize - (occupied.get(numero) ?? 0)) };
  });
}

/**
 * Replace tous les invités dans l'ordre d'inscription. Sert quand la taille des tables change
 * ou pour combler les trous laissés par des suppressions. Les tables choisies par les invités
 * sont conservées tant que le groupe y tient encore ; les autres sont replacés depuis la Table 1.
 * Les invitations révoquées n'ont pas de table (numéro 0).
 */
export function reassignAll(guests: Rsvp[], tableSize: number): Rsvp[] {
  const placed: Rsvp[] = [];
  const auto: Rsvp[] = [];
  const ordered = [...guests].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const g of ordered) {
    if (g.isRevoked) {
      placed.push({ ...g, tableNumero: 0 });
    } else if (g.tableChoisie && (tableLoads(placed).get(g.tableNumero) ?? 0) + g.nombrePersonnes <= tableSize) {
      placed.push(g);
    } else {
      auto.push(g);
    }
  }
  for (const g of auto) {
    const actifs = placed.filter((p) => !p.isRevoked);
    placed.push({ ...g, tableChoisie: false, tableNumero: findTable(actifs, g.nombrePersonnes, tableSize) });
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

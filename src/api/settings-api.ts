// Réglages de l'événement (simulés en localStorage) : capacité, tables, ouverture des inscriptions.

import { settingsSchema } from "@/lib/schemas";
import { delay, fail, ok, readDb, writeDb } from "@/lib/storage";
import { reassignAll } from "@/lib/tables";
import type { BaseResponse, EventSettings } from "@/types/interface";

export async function getSettings(): Promise<BaseResponse<EventSettings>> {
  await delay(150);
  return ok(readDb().settings);
}

export async function updateSettings(patch: Partial<EventSettings>): Promise<BaseResponse<EventSettings>> {
  await delay(350);
  const db = readDb();
  // Noms, date et lieu figurent sur les cartes d'invitation : on ne les change plus dès
  // qu'une invitation existe (même révoquée), sinon des cartes déjà remises deviendraient fausses.
  if (patch.event && db.guests.length > 0) {
    return fail(409, "Les informations du mariage ne sont plus modifiables : des invités sont déjà inscrits.");
  }
  const parsed = settingsSchema.safeParse({ ...db.settings, ...patch });
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Réglages invalides");
  const next = parsed.data;

  // On ne peut pas descendre sous ce qui est déjà promis aux invités
  const activeGuests = db.guests.filter((g) => !g.isRevoked);
  const confirmed = activeGuests.reduce((sum, g) => sum + g.nombrePersonnes, 0);
  if (next.capacity < confirmed) {
    return fail(409, `Impossible : ${confirmed} personnes sont déjà confirmées. Révoquez des invitations avant de réduire la capacité.`);
  }
  const largestGroup = Math.max(0, ...activeGuests.map((g) => g.nombrePersonnes));
  if (next.tableSize < largestGroup) {
    return fail(409, `Impossible : un groupe de ${largestGroup} personnes est déjà inscrit et doit tenir à une seule table.`);
  }

  // Changer la taille des tables invalide le plan : on replace tout le monde
  const guests = next.tableSize !== db.settings.tableSize ? reassignAll(db.guests, next.tableSize) : db.guests;
  writeDb({ ...db, guests, settings: next });
  return ok(next, "Réglages enregistrés");
}

/** Replace tous les invités depuis la Table 1 (comble les places libérées) */
export async function reassignTables(): Promise<BaseResponse<number>> {
  await delay(500);
  const db = readDb();
  const guests = reassignAll(db.guests, db.settings.tableSize);
  const moved = guests.filter((g, i) => g.tableNumero !== db.guests[i].tableNumero).length;
  writeDb({ ...db, guests });
  return ok(moved, "Tables réorganisées");
}

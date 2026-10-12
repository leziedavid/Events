// API RSVP simulée (localStorage). Chaque fonction a la signature du futur appel HTTP et
// renvoie un `BaseResponse<T>` : brancher NestJS reviendra à remplacer leur corps par un fetch.
// Les règles métier (quota, doublons, tables, révocation) y sont volontairement regroupées,
// car ce sont celles que le serveur devra appliquer.

import { rsvpSchema } from "@/lib/schemas";
import { checkRateLimit, generateCode, normalizePhone, parsePayload } from "@/lib/security";
import { delay, fail, ok, readDb, resetDb, writeDb } from "@/lib/storage";
import { buildTables, findTable } from "@/lib/tables";
import type { BaseResponse, CapacityStats, LocalDb, Rsvp, RsvpInput, TableSummary } from "@/types/interface";

const CLOSED = "Les réservations sont désormais clôturées.";

/** Une invitation révoquée ne compte ni dans le quota ni dans les tables */
const active = (guests: Rsvp[]) => guests.filter((g) => !g.isRevoked);
const persons = (guests: Rsvp[]) => guests.reduce((sum, g) => sum + g.nombrePersonnes, 0);

function capacityOf(db: LocalDb, excludeId?: string): CapacityStats {
  const confirmed = persons(active(db.guests).filter((g) => g.id !== excludeId));
  const remaining = Math.max(0, db.settings.capacity - confirmed);
  return { capacity: db.settings.capacity, confirmed, remaining, isFull: remaining === 0, isClosed: !db.settings.rsvpOpen };
}

/** Validation « serveur » : on ne fait jamais confiance au formulaire */
function validate(input: RsvpInput, familyMax: number): { data?: RsvpInput; error?: string } {
  // Hors famille, une invitation vaut toujours pour une seule personne
  const candidate = { ...input, nombrePersonnes: input.categorie === "FAMILLE" ? input.nombrePersonnes : 1 };
  const parsed = rsvpSchema.safeParse(candidate);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  if (parsed.data.nombrePersonnes > familyMax) return { error: `Maximum ${familyMax} personnes par famille.` };
  return { data: parsed.data };
}

function placesMessage(remaining: number): string {
  return remaining === 0 ? CLOSED : `Il ne reste que ${remaining} place${remaining > 1 ? "s" : ""}.`;
}

export async function getCapacity(): Promise<BaseResponse<CapacityStats>> {
  await delay(150);
  return ok(capacityOf(readDb()));
}

export async function getRsvps(): Promise<BaseResponse<Rsvp[]>> {
  await delay();
  const guests = [...readDb().guests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return ok(guests);
}

export async function getRsvpByCode(code: string): Promise<BaseResponse<Rsvp>> {
  await delay();
  const guest = readDb().guests.find((g) => g.verificationCode === code.toUpperCase());
  return guest ? ok(guest) : fail(404, "Invitation introuvable.");
}

/**
 * « Retrouver ma carte » : l'invité saisit le téléphone de son inscription ou le code de sa
 * carte. La limite de débit freine ceux qui essaieraient des numéros au hasard ; le backend
 * devra l'appliquer par adresse IP.
 */
export async function findRsvp(query: string): Promise<BaseResponse<Rsvp>> {
  await delay(500);
  if (!checkRateLimit("find-card", 6, 60_000)) return fail(429, "Trop de tentatives. Merci de patienter une minute.");

  const guests = readDb().guests;
  const { code, valid } = parsePayload(query);
  const byCode = valid ? guests.find((g) => g.verificationCode === code) : undefined;
  if (byCode) return ok(byCode);

  const phone = normalizePhone(query);
  // 8 chiffres au minimum : pas de recherche sur un morceau de numéro
  const byPhone = phone.length >= 8 ? guests.find((g) => normalizePhone(g.telephone) === phone) : undefined;
  if (byPhone) return ok(byPhone);

  return fail(404, "Aucune invitation ne correspond. Vérifiez le numéro utilisé lors de l'inscription ou le code de votre carte.");
}

export async function getTables(): Promise<BaseResponse<TableSummary[]>> {
  await delay();
  const db = readDb();
  return ok(buildTables(active(db.guests), db.settings.tableSize));
}

/** `asAdmin` : ajout par l'organisateur — sans limite de débit, et possible même inscriptions fermées */
export async function createRsvp(input: RsvpInput, options?: { asAdmin?: boolean }): Promise<BaseResponse<Rsvp>> {
  await delay(600);
  const db = readDb();
  if (!options?.asAdmin) {
    if (!checkRateLimit("rsvp", 5, 60_000)) return fail(429, "Trop de tentatives. Merci de patienter une minute.");
    if (!db.settings.rsvpOpen) return fail(403, CLOSED);
  }
  const { data, error } = validate(input, db.settings.familyMax);
  if (!data) return fail(400, error ?? "Données invalides");

  const phone = normalizePhone(data.telephone);
  const existing = db.guests.find((g) => normalizePhone(g.telephone) === phone);
  if (existing) {
    return fail(409, existing.isRevoked ? "L'invitation liée à ce numéro a été révoquée." : "Ce numéro de téléphone a déjà confirmé sa présence.");
  }
  const { remaining } = capacityOf(db);
  if (data.nombrePersonnes > remaining) return fail(409, placesMessage(remaining));

  // Le code doit être unique : on retire jusqu'à en obtenir un libre
  let verificationCode = generateCode();
  while (db.guests.some((g) => g.verificationCode === verificationCode)) verificationCode = generateCode();

  const now = new Date().toISOString();
  const guest: Rsvp = {
    id: crypto.randomUUID(),
    ...data,
    tableNumero: findTable(active(db.guests), data.nombrePersonnes, db.settings.tableSize),
    verificationCode,
    isVerified: false,
    verifiedAt: null,
    isRevoked: false,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  writeDb({ ...db, guests: [...db.guests, guest] });
  return ok(guest, "Présence confirmée");
}

export async function updateRsvp(id: string, input: RsvpInput): Promise<BaseResponse<Rsvp>> {
  await delay(400);
  const db = readDb();
  const { data, error } = validate(input, db.settings.familyMax);
  if (!data) return fail(400, error ?? "Données invalides");

  const current = db.guests.find((g) => g.id === id);
  if (!current) return fail(404, "Invitation introuvable.");
  if (current.isRevoked) return fail(409, "Cette invitation est révoquée : restaurez-la avant de la modifier.");

  const phone = normalizePhone(data.telephone);
  if (db.guests.some((g) => g.id !== id && normalizePhone(g.telephone) === phone)) {
    return fail(409, "Ce numéro de téléphone est déjà utilisé par une autre invitation.");
  }
  const { remaining } = capacityOf(db, id);
  if (data.nombrePersonnes > remaining) return fail(409, placesMessage(remaining));

  // On ne déplace l'invité que si son groupe ne tient plus à sa table actuelle
  const others = active(db.guests).filter((g) => g.id !== id);
  const tableLoad = persons(others.filter((g) => g.tableNumero === current.tableNumero));
  const tableNumero =
    tableLoad + data.nombrePersonnes <= db.settings.tableSize
      ? current.tableNumero
      : findTable(others, data.nombrePersonnes, db.settings.tableSize);

  const updated: Rsvp = { ...current, ...data, tableNumero, updatedAt: new Date().toISOString() };
  writeDb({ ...db, guests: db.guests.map((g) => (g.id === id ? updated : g)) });
  return ok(updated, "Invitation modifiée");
}

/**
 * Révoque une invitation sans l'effacer : ses places et sa table sont libérées, sa carte est
 * refusée à l'entrée, mais elle reste visible (et restaurable) dans la liste.
 */
export async function revokeRsvp(id: string): Promise<BaseResponse<Rsvp>> {
  await delay(400);
  const db = readDb();
  const current = db.guests.find((g) => g.id === id);
  if (!current) return fail(404, "Invitation introuvable.");
  if (current.isRevoked) return fail(409, "Cette invitation est déjà révoquée.");
  if (current.isVerified) return fail(409, "Cet invité est déjà entré : son invitation ne peut plus être révoquée.");

  const now = new Date().toISOString();
  const updated: Rsvp = { ...current, isRevoked: true, revokedAt: now, tableNumero: 0, updatedAt: now };
  writeDb({ ...db, guests: db.guests.map((g) => (g.id === id ? updated : g)) });
  return ok(updated, "Invitation révoquée");
}

export async function restoreRsvp(id: string): Promise<BaseResponse<Rsvp>> {
  await delay(400);
  const db = readDb();
  const current = db.guests.find((g) => g.id === id);
  if (!current) return fail(404, "Invitation introuvable.");
  if (!current.isRevoked) return fail(409, "Cette invitation n'est pas révoquée.");

  const { remaining } = capacityOf(db);
  if (current.nombrePersonnes > remaining) return fail(409, placesMessage(remaining));

  const updated: Rsvp = {
    ...current,
    isRevoked: false,
    revokedAt: null,
    tableNumero: findTable(active(db.guests), current.nombrePersonnes, db.settings.tableSize),
    updatedAt: new Date().toISOString(),
  };
  writeDb({ ...db, guests: db.guests.map((g) => (g.id === id ? updated : g)) });
  return ok(updated, "Invitation restaurée");
}

export async function deleteRsvp(id: string): Promise<BaseResponse<boolean>> {
  await delay(400);
  const db = readDb();
  if (!db.guests.some((g) => g.id === id)) return fail(404, "Invitation introuvable.");
  writeDb({ ...db, guests: db.guests.filter((g) => g.id !== id) });
  return ok(true, "Invitation supprimée");
}

/** Vide invitations, scans, messages et rappels, en gardant réglages et menu : la base du vrai mariage */
export async function clearAllData(): Promise<BaseResponse<boolean>> {
  await delay(400);
  // Le menu et les réglages sont de la configuration : on les conserve
  const db = readDb();
  writeDb({ guests: [], scans: [], guestbook: [], reminders: [], menu: db.menu, settings: db.settings });
  return ok(true, "Données effacées");
}

export async function resetDemoData(): Promise<BaseResponse<boolean>> {
  await delay(400);
  resetDb();
  return ok(true, "Données de démonstration réinitialisées");
}

// Contrôle des invitations à l'entrée (simulé en localStorage).

import { parsePayload } from "@/lib/security";
import { delay, fail, ok, readDb, writeDb } from "@/lib/storage";
import { displayName } from "@/lib/utils";
import type { BaseResponse, LocalDb, LookupResult, Rsvp, ScanLog, ScanSource } from "@/types/interface";

function logScan(db: LocalDb, entry: Omit<ScanLog, "id" | "createdAt">): LocalDb {
  const log: ScanLog = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  return { ...db, scans: [log, ...db.scans] };
}

/**
 * Recherche une invitation à partir du contenu d'un QR Code ou d'un code saisi.
 * Les lectures invalides et les invitations déjà utilisées sont tracées dans l'historique ;
 * une lecture valide ne l'est qu'au moment où l'agent valide l'entrée.
 */
export async function lookupInvitation(raw: string, source: ScanSource, agent: string): Promise<BaseResponse<LookupResult>> {
  await delay(250);
  const db = readDb();
  const { code, valid } = parsePayload(raw);
  const guest = valid ? db.guests.find((g) => g.verificationCode === code) : undefined;

  if (!guest) {
    writeDb(logScan(db, { code: raw.trim().slice(0, 40), guestId: null, guestName: null, result: "INVALID", source, agent }));
    return ok({ status: "INVALID" });
  }
  if (guest.isRevoked) {
    writeDb(logScan(db, { code, guestId: guest.id, guestName: displayName(guest), result: "REVOKED", source, agent }));
    return ok({ status: "REVOKED", guest });
  }
  if (guest.isVerified) {
    writeDb(logScan(db, { code, guestId: guest.id, guestName: displayName(guest), result: "ALREADY_USED", source, agent }));
    return ok({ status: "ALREADY_USED", guest });
  }
  return ok({ status: "FOUND", guest });
}

/** Marque l'invitation comme utilisée. Une seconde validation est toujours refusée. */
export async function validateEntry(guestId: string, source: ScanSource, agent: string): Promise<BaseResponse<Rsvp>> {
  await delay(300);
  const db = readDb();
  const guest = db.guests.find((g) => g.id === guestId);
  if (!guest) return fail(404, "Invitation introuvable.");
  if (guest.isRevoked) return fail(409, "Cette invitation a été révoquée.");
  if (guest.isVerified) return fail(409, "Cette invitation a déjà été utilisée.");

  const now = new Date().toISOString();
  const updated: Rsvp = { ...guest, isVerified: true, verifiedAt: now, updatedAt: now };
  const next = { ...db, guests: db.guests.map((g) => (g.id === guestId ? updated : g)) };
  writeDb(logScan(next, { code: guest.verificationCode, guestId, guestName: displayName(guest), result: "VALID", source, agent }));
  return ok(updated, "Entrée validée");
}

export async function getScans(): Promise<BaseResponse<ScanLog[]>> {
  await delay();
  return ok(readDb().scans);
}

// Livre d'or et rappels aux invités (simulés en localStorage).

import { guestbookSchema, reminderSchema, type GuestbookInput, type ReminderInput } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/security";
import { delay, fail, ok, readDb, writeDb } from "@/lib/storage";
import type { BaseResponse, GuestbookMessage, ReminderLog } from "@/types/interface";

export async function getGuestbook(): Promise<BaseResponse<GuestbookMessage[]>> {
  await delay();
  return ok(readDb().guestbook);
}

export async function addGuestbookMessage(input: GuestbookInput): Promise<BaseResponse<GuestbookMessage>> {
  await delay(400);
  if (!checkRateLimit("guestbook", 3, 60_000)) return fail(429, "Trop de messages envoyés. Merci de patienter une minute.");
  const parsed = guestbookSchema.safeParse(input);
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Message invalide");

  const db = readDb();
  if (!db.settings.guestbookOpen) return fail(403, "Le livre d'or est fermé pour le moment.");
  const entry: GuestbookMessage = { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() };
  writeDb({ ...db, guestbook: [entry, ...db.guestbook] });
  return ok(entry, "Merci pour votre message");
}

export async function deleteGuestbookMessage(id: string): Promise<BaseResponse<boolean>> {
  await delay(300);
  const db = readDb();
  writeDb({ ...db, guestbook: db.guestbook.filter((m) => m.id !== id) });
  return ok(true, "Message supprimé");
}

export async function getReminders(): Promise<BaseResponse<ReminderLog[]>> {
  await delay();
  return ok(readDb().reminders);
}

/**
 * DÉMO : aucun SMS ni e-mail ne part réellement. L'envoi est seulement journalisé ; le
 * backend le confiera à un fournisseur (SMS) et à un service d'e-mail.
 */
export async function sendReminder(input: ReminderInput): Promise<BaseResponse<ReminderLog>> {
  await delay(700);
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Message invalide");

  const db = readDb();
  // Les invitations révoquées ne reçoivent plus rien
  const recipients = db.guests.filter((g) => !g.isRevoked).length;
  if (recipients === 0) return fail(400, "Aucun invité à notifier.");
  const entry: ReminderLog = {
    id: crypto.randomUUID(),
    ...parsed.data,
    destinataires: recipients,
    createdAt: new Date().toISOString(),
  };
  writeDb({ ...db, reminders: [entry, ...db.reminders] });
  return ok(entry, "Rappel envoyé");
}

"use client";

import { eventUrl, publicEventUrl, publicFetch, secureFetch, toJson } from "@/api/api";
import type { GuestbookInput, ReminderInput } from "@/lib/schemas";
import type { BaseResponse, GuestbookMessage, ReminderLog } from "@/types/interface";

/* =======================================================
   LIVRE D'OR ET RAPPELS — voir event-backend/src/content
======================================================= */

// ─── Livre d'or ───────────────────────────────────────────────────────────

export async function getGuestbook(): Promise<BaseResponse<GuestbookMessage[]>> {
  return toJson(await publicFetch(publicEventUrl("/guestbook")));
}

/** Message d'un invité (débit limité par l'API, refusé si le livre d'or est fermé) */
export async function addGuestbookMessage(input: GuestbookInput): Promise<BaseResponse<GuestbookMessage>> {
  return toJson(await publicFetch(publicEventUrl("/guestbook"), { method: "POST", body: JSON.stringify(input) }));
}

export async function deleteGuestbookMessage(id: string): Promise<BaseResponse<boolean>> {
  return toJson(await secureFetch(eventUrl(`/guestbook/${id}`), { method: "DELETE" }));
}

// ─── Rappels ──────────────────────────────────────────────────────────────

export async function getReminders(): Promise<BaseResponse<ReminderLog[]>> {
  return toJson(await secureFetch(eventUrl("/reminders")));
}

/** Envoi groupé (WhatsApp ou e-mail) aux invités non révoqués ; l'API envoie en arrière-plan */
export async function sendReminder(input: ReminderInput): Promise<BaseResponse<ReminderLog>> {
  return toJson(await secureFetch(eventUrl("/reminders"), { method: "POST", body: JSON.stringify(input) }));
}

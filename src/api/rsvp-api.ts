"use client";

import { eventUrl, hasAdminSession, hasStaffSession, publicEventUrl, publicFetch, secureFetch, toJson, toQueryString } from "@/api/api";
import type { BaseResponse, CapacityStats, EventTable, Rsvp, RsvpInput, TableOption, TableSummary } from "@/types/interface";

/* =======================================================
   INVITATIONS (RSVP) — voir event-backend/src/guest
   Toutes les règles (quota, doublon de téléphone, tables, révocation) sont appliquées par
   l'API, dans une transaction : le formulaire ne fait qu'une première vérification.
======================================================= */

// ─── Public ───────────────────────────────────────────────────────────────

export async function getCapacity(): Promise<BaseResponse<CapacityStats>> {
  const res = hasStaffSession() ? await secureFetch(eventUrl("/capacity")) : await publicFetch(publicEventUrl("/capacity"));
  return toJson(res);
}

/** Carte d'invitation (sans téléphone ni e-mail) */
export async function getRsvpByCode(code: string): Promise<BaseResponse<Rsvp>> {
  return toJson(await publicFetch(publicEventUrl(`/invitations/${encodeURIComponent(code.trim().toUpperCase())}`)));
}

/** « Retrouver ma carte » : téléphone de l'inscription ou code de la carte (débit limité par l'API) */
export async function findRsvp(query: string): Promise<BaseResponse<Rsvp>> {
  return toJson(await publicFetch(publicEventUrl("/invitations/find"), { method: "POST", body: JSON.stringify({ query: query.trim() }) }));
}

/**
 * Tables proposées dans le formulaire. Côté gestion (organisateur), toutes les tables, avec
 * `excludeId` pour la modification d'une invitation ; côté public, la liste n'existe que si
 * l'organisateur a ouvert le choix de la table.
 */
export async function getTableOptions(excludeId?: string, categorie?: string): Promise<BaseResponse<TableOption[]>> {
  // La catégorie décide des tables VIP proposées (Famille et Église oui, Amis non) ; l'API
  // applique la même règle à l'enregistrement
  const res = hasAdminSession()
    ? await secureFetch(eventUrl(`/tables/options?${toQueryString({ excludeId, categorie })}`))
    : await publicFetch(publicEventUrl(`/tables/options?${toQueryString({ categorie })}`));
  return toJson(res);
}

/** Renommer une table (son numéro, qui relie les invitations, ne change pas) */
export async function renameTable(numero: number, name: string): Promise<BaseResponse<EventTable>> {
  return toJson(await secureFetch(eventUrl(`/tables/${numero}/name`), { method: "PATCH", body: JSON.stringify({ name }) }));
}

/** Confirmation de présence (publique) ou ajout par l'organisateur (`asAdmin`) */
export async function createRsvp(input: RsvpInput, options?: { asAdmin?: boolean }): Promise<BaseResponse<Rsvp>> {
  const body = JSON.stringify(input);
  const res = options?.asAdmin
    ? await secureFetch(eventUrl("/guests"), { method: "POST", body })
    : await publicFetch(publicEventUrl("/rsvp"), { method: "POST", body });
  return toJson(res);
}

// ─── Gestion ──────────────────────────────────────────────────────────────

export async function getRsvps(): Promise<BaseResponse<Rsvp[]>> {
  return toJson(await secureFetch(eventUrl("/guests")));
}

export async function getTables(): Promise<BaseResponse<TableSummary[]>> {
  return toJson(await secureFetch(eventUrl("/tables")));
}

export async function updateRsvp(id: string, input: RsvpInput): Promise<BaseResponse<Rsvp>> {
  return toJson(await secureFetch(eventUrl(`/guests/${id}`), { method: "PUT", body: JSON.stringify(input) }));
}

export async function revokeRsvp(id: string): Promise<BaseResponse<Rsvp>> {
  return toJson(await secureFetch(eventUrl(`/guests/${id}/revoke`), { method: "POST" }));
}

export async function restoreRsvp(id: string): Promise<BaseResponse<Rsvp>> {
  return toJson(await secureFetch(eventUrl(`/guests/${id}/restore`), { method: "POST" }));
}

/** Nouvelle carte : l'ancien QR Code de cette invitation est refusé à l'entrée */
export async function regenerateCard(id: string): Promise<BaseResponse<Rsvp>> {
  return toJson(await secureFetch(eventUrl(`/guests/${id}/regenerate-card`), { method: "POST" }));
}

export async function deleteRsvp(id: string): Promise<BaseResponse<boolean>> {
  return toJson(await secureFetch(eventUrl(`/guests/${id}`), { method: "DELETE" }));
}

/**
 * « Tout effacer » : invitations, entrées, livre d'or et rappels. Réglages, contenu et comptes
 * sont conservés ; les informations du mariage redeviennent modifiables.
 */
export async function clearAllData(): Promise<BaseResponse<number>> {
  return toJson(await secureFetch(eventUrl("/guests"), { method: "DELETE" }));
}

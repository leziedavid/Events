"use client";

import { eventUrl, secureFetch, toJson } from "@/api/api";
import type { BaseResponse, LookupResult, Rsvp, ScanLog, ScanSource, ScanStats } from "@/types/interface";

/* =======================================================
   CONTRÔLE DES ENTRÉES — voir event-backend/src/scan
   La signature du QR Code est vérifiée par l'API ; l'agent est celui du jeton de connexion.
   Une invitation ne se valide qu'une fois (verrou en base).
======================================================= */

/** Recherche une invitation à partir du contenu d'un QR Code ou d'un code saisi */
export async function lookupInvitation(raw: string, source: ScanSource): Promise<BaseResponse<LookupResult>> {
  return toJson(await secureFetch(eventUrl("/scans/lookup"), { method: "POST", body: JSON.stringify({ raw, source }) }));
}

/** Marque l'invitation comme utilisée. Une seconde validation est toujours refusée. */
export async function validateEntry(guestId: string, source: ScanSource): Promise<BaseResponse<Rsvp>> {
  return toJson(await secureFetch(eventUrl("/scans/validate"), { method: "POST", body: JSON.stringify({ guestId, source }) }));
}

export async function getScans(): Promise<BaseResponse<ScanLog[]>> {
  return toJson(await secureFetch(eventUrl("/scans")));
}

/** Arrivées en direct (accessible aux agents d'accueil) */
export async function getScanStats(): Promise<BaseResponse<ScanStats>> {
  return toJson(await secureFetch(eventUrl("/scans/stats")));
}

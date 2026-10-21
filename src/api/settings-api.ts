"use client";

import { eventUrl, hasStaffSession, publicEventUrl, publicFetch, secureFetch, toJson } from "@/api/api";
import type { BaseResponse, EventMediaView, EventSettings } from "@/types/interface";

/* =======================================================
   RÉGLAGES DE L'ÉVÉNEMENT — voir event-backend/src/event et src/content
   L'API renvoie les réglages dans la forme exacte d'`EventSettings`. Une modification se fait
   par morceaux (`updateSettings(patch)`), traduits ici vers les routes de l'API :
   réglages généraux (PATCH /settings), programme (PUT /programme), QR Codes (PUT /qr-codes),
   photo du programme (POST|DELETE /media).
======================================================= */

/** Réglages vus par la gestion (tout) ou, sans session, par le site public (événement publié) */
export async function getSettings(): Promise<BaseResponse<EventSettings>> {
  const res = hasStaffSession() ? await secureFetch(eventUrl("/settings")) : await publicFetch(publicEventUrl());
  return toJson(res);
}

async function getStaffSettings(): Promise<EventSettings> {
  const current = await toJson<EventSettings>(await secureFetch(eventUrl("/settings")));
  if (!current.data) throw new Error(current.message || "Réglages introuvables.");
  return current.data;
}

/** Envoie une photo (data URL redimensionnée par lib/image.ts) dans la médiathèque de l'événement */
export async function uploadMedia(dataUrl: string, kind: "HERO" | "SECONDARY" | "PROGRAMME" | "GALLERY", alt = ""): Promise<BaseResponse<EventMediaView>> {
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append("file", blob, `photo.${blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg"}`);
  form.append("kind", kind);
  if (alt) form.append("alt", alt);
  return toJson(await secureFetch(eventUrl("/media"), { method: "POST", body: form }));
}

export async function deleteMedia(id: string): Promise<BaseResponse<boolean>> {
  return toJson(await secureFetch(eventUrl(`/media/${id}`), { method: "DELETE" }));
}

/** Première erreur d'une suite d'appels, sinon `null` */
function failure<T>(res: BaseResponse<T>): BaseResponse<EventSettings> | null {
  return res.statusCode >= 400 ? { statusCode: res.statusCode, message: res.message } : null;
}

export async function updateSettings(patch: Partial<EventSettings>): Promise<BaseResponse<EventSettings>> {
  let current: EventSettings;
  try {
    current = await getStaffSettings();
  } catch (e) {
    return { statusCode: 500, message: (e as Error).message };
  }

  // ─── Photo du programme : envoyée à part, jamais stockée dans les réglages ───
  if (patch.home) {
    const url = patch.home.programmePhotoUrl;
    if (url?.startsWith("data:")) {
      const err = failure(await uploadMedia(url, "PROGRAMME"));
      if (err) return err;
    } else if (url === "" && current.media?.programme) {
      const err = failure(await deleteMedia(current.media.programme.id));
      if (err) return err;
    }
  }

  // ─── Réglages généraux ───
  const body: Record<string, unknown> = {};
  if (patch.event) Object.assign(body, patch.event);
  for (const key of ["capacity", "tableSize", "familyMax", "rsvpOpen", "guestbookOpen", "tableChoice"] as const) {
    if (patch[key] !== undefined) body[key] = patch[key];
  }
  if (patch.home || patch.menu) {
    const home = { ...current.home, ...patch.home };
    body.home = {
      programme: home.programme,
      dressCode: home.dressCode,
      gallery: home.gallery,
      venue: home.venue,
      guestbook: home.guestbook,
      story: home.story,
      menu: patch.menu?.visible ?? current.menu.visible,
      programmePhoto: home.programmePhoto,
    };
  }
  if (patch.menu) body.menuSettings = { catering: patch.menu.catering, catererName: patch.menu.catererName };
  if (patch.dressCode) body.dressCode = patch.dressCode;
  if (patch.ceremony) body.ceremony = patch.ceremony;
  if (patch.townHall) body.townHall = patch.townHall;
  if (patch.story) body.story = patch.story;

  if (Object.keys(body).length) {
    const err = failure(await toJson(await secureFetch(eventUrl("/settings"), { method: "PATCH", body: JSON.stringify(body) })));
    if (err) return err;
  }

  // ─── Listes enregistrées d'un bloc ───
  if (patch.programme) {
    const steps = patch.programme.map(({ id, heure, titre, description, icon, place }) => ({ id, heure, titre, description, icon, place }));
    const err = failure(await toJson(await secureFetch(eventUrl("/programme"), { method: "PUT", body: JSON.stringify({ steps }) })));
    if (err) return err;
  }
  if (patch.qrCodes) {
    const qrCodes = patch.qrCodes.map(({ id, kind, label, caption, target }) => ({ id, kind, label, caption, target }));
    const err = failure(await toJson(await secureFetch(eventUrl("/qr-codes"), { method: "PUT", body: JSON.stringify({ qrCodes }) })));
    if (err) return err;
  }

  const next = await toJson<EventSettings>(await secureFetch(eventUrl("/settings")));
  return { ...next, message: "Réglages enregistrés" };
}

/** Replace tous les invités depuis la Table 1 (comble les places libérées) */
export async function reassignTables(): Promise<BaseResponse<number>> {
  return toJson(await secureFetch(eventUrl("/tables/reassign"), { method: "PATCH" }));
}


"use client";

import { eventUrl, hasAdminSession, publicEventUrl, publicFetch, secureFetch, toJson } from "@/api/api";
import type { MenuItemInput } from "@/lib/schemas";
import type { BaseResponse, MenuItem } from "@/types/interface";

/* =======================================================
   MENU DU REPAS — voir event-backend/src/content
======================================================= */

/** Organisateur : tous les plats (masqués compris) ; public : plats visibles seulement */
export async function getMenu(): Promise<BaseResponse<MenuItem[]>> {
  const res = hasAdminSession() ? await secureFetch(eventUrl("/menu")) : await publicFetch(publicEventUrl("/menu"));
  return toJson(res);
}

export async function createMenuItem(input: MenuItemInput): Promise<BaseResponse<MenuItem>> {
  return toJson(await secureFetch(eventUrl("/menu"), { method: "POST", body: JSON.stringify(input) }));
}

export async function updateMenuItem(id: string, patch: Partial<MenuItemInput> & { visible?: boolean }): Promise<BaseResponse<MenuItem>> {
  return toJson(await secureFetch(eventUrl(`/menu/${id}`), { method: "PATCH", body: JSON.stringify(patch) }));
}

export async function deleteMenuItem(id: string): Promise<BaseResponse<boolean>> {
  return toJson(await secureFetch(eventUrl(`/menu/${id}`), { method: "DELETE" }));
}

// Menu du repas (simulé en localStorage) : les plats présentés aux invités sur l'accueil.

import { menuItemSchema, type MenuItemInput } from "@/lib/schemas";
import { delay, fail, ok, readDb, writeDb } from "@/lib/storage";
import type { BaseResponse, MenuItem } from "@/types/interface";

export async function getMenu(): Promise<BaseResponse<MenuItem[]>> {
  await delay(200);
  return ok(readDb().menu);
}

export async function createMenuItem(input: MenuItemInput): Promise<BaseResponse<MenuItem>> {
  await delay(350);
  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Plat invalide");

  const db = readDb();
  const item: MenuItem = { id: crypto.randomUUID(), ...parsed.data, visible: true };
  writeDb({ ...db, menu: [...db.menu, item] });
  return ok(item, "Plat ajouté");
}

export async function updateMenuItem(id: string, patch: Partial<MenuItemInput> & { visible?: boolean }): Promise<BaseResponse<MenuItem>> {
  await delay(300);
  const db = readDb();
  const current = db.menu.find((m) => m.id === id);
  if (!current) return fail(404, "Plat introuvable.");

  const parsed = menuItemSchema.safeParse({ ...current, ...patch });
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Plat invalide");

  const updated: MenuItem = { ...current, ...parsed.data, visible: patch.visible ?? current.visible };
  writeDb({ ...db, menu: db.menu.map((m) => (m.id === id ? updated : m)) });
  return ok(updated, "Plat modifié");
}

export async function deleteMenuItem(id: string): Promise<BaseResponse<boolean>> {
  await delay(300);
  const db = readDb();
  writeDb({ ...db, menu: db.menu.filter((m) => m.id !== id) });
  return ok(true, "Plat supprimé");
}

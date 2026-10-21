"use client";

import { eventUrl, secureFetch, toJson } from "@/api/api";
import type { AccountInput, NewAccountInput } from "@/lib/schemas";
import type { AccountView, BaseResponse } from "@/types/interface";

/* =======================================================
   COMPTES DE L'ÉVÉNEMENT (administrateurs et agents) — voir event-backend/src/user/member.*
   Mots de passe hachés côté serveur et jamais renvoyés. L'API garde toujours un
   administrateur actif et refuse de supprimer ou désactiver son propre compte.
======================================================= */

export type { AccountView };

export async function getAccounts(): Promise<BaseResponse<AccountView[]>> {
  return toJson(await secureFetch(eventUrl("/members")));
}

export async function createAccount(input: NewAccountInput): Promise<BaseResponse<AccountView>> {
  const body = { username: input.identifiant, name: input.name, role: input.role, password: input.password };
  return toJson(await secureFetch(eventUrl("/members"), { method: "POST", body: JSON.stringify(body) }));
}

export async function updateAccount(id: string, input: AccountInput & { active: boolean }): Promise<BaseResponse<AccountView>> {
  const body = { username: input.identifiant, name: input.name, role: input.role, active: input.active };
  return toJson(await secureFetch(eventUrl(`/members/${id}`), { method: "PUT", body: JSON.stringify(body) }));
}

export async function setAccountPassword(id: string, password: string): Promise<BaseResponse<boolean>> {
  return toJson(await secureFetch(eventUrl(`/members/${id}/password`), { method: "PUT", body: JSON.stringify({ password }) }));
}

export async function deleteAccount(id: string): Promise<BaseResponse<boolean>> {
  return toJson(await secureFetch(eventUrl(`/members/${id}`), { method: "DELETE" }));
}

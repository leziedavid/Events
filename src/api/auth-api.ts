"use client";

import { getBaseUrl, getEventSlug, publicFetch, secureFetch, toJson, toQueryString } from "@/api/api";
import type { SessionTokens } from "@/lib/auth";
import type { LoginInput } from "@/lib/schemas";
import type { BaseResponse, SessionUser } from "@/types/interface";

/* =======================================================
   AUTHENTIFICATION — voir event-backend/src/auth
   JWT lié à une session serveur ; l'accès à l'événement vient de l'appartenance (EventMember)
   OWNER / ADMIN → « ADMIN » (toute la gestion), AGENT → « AGENT » (contrôle des entrées).
======================================================= */

interface MeEvent {
  id: string;
  slug: string;
  title: string;
  memberRole: "OWNER" | "ADMIN" | "AGENT";
}

export interface Me {
  id: string;
  username: string;
  fullName: string;
  roles: string[];
  policies: string[];
  menu: { code: string; name: string; icon: string | null; frontendRoute: string | null }[];
  events: MeEvent[];
}

interface LoginResponse extends SessionTokens {
  user: Me;
}

/** Un administrateur de la plateforme gère tous les événements, même sans en être membre */
const PLATFORM_EVENTS_MANAGE = "PLATFORM_EVENTS_MANAGE";

/** Retrouve l'événement de ce site parmi ceux du compte (ou dans tout le catalogue pour la plateforme) */
async function resolveEvent(me: Me, accessToken: string): Promise<{ id: string; role: SessionUser["role"] } | null> {
  const slug = getEventSlug();
  const membership = me.events.find((e) => e.slug === slug);
  if (membership) return { id: membership.id, role: membership.memberRole === "AGENT" ? "AGENT" : "ADMIN" };
  if (!me.policies.includes(PLATFORM_EVENTS_MANAGE)) return null;

  const res = await fetch(`${getBaseUrl()}/admin/events?${toQueryString({ search: slug, limit: 20 })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const list = await toJson<{ data: { id: string; slug: string }[] }>(res);
  const event = list.data?.data.find((e) => e.slug === slug);
  return event ? { id: event.id, role: "ADMIN" } : null;
}

export async function login(input: LoginInput): Promise<BaseResponse<{ tokens: SessionTokens; user: SessionUser }>> {
  const res = await publicFetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ identifier: input.identifiant.trim().toLowerCase(), password: input.password }),
  });
  const body = await toJson<LoginResponse>(res);
  if (!res.ok || !body.data) return { statusCode: body.statusCode, message: body.message || "Connexion impossible." };

  const { user: me, ...tokens } = body.data;
  const event = await resolveEvent(me, tokens.accessToken);
  if (!event) {
    // Session ouverte côté serveur mais inutilisable ici : on la referme aussitôt
    await fetch(`${getBaseUrl()}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${tokens.accessToken}` } }).catch(() => undefined);
    return { statusCode: 403, message: "Ce compte n'a pas accès à cet événement." };
  }
  return {
    statusCode: 200,
    message: "Connexion réussie",
    data: { tokens, user: { id: me.id, name: me.fullName, username: me.username, role: event.role, eventId: event.id } },
  };
}

export async function logout(): Promise<BaseResponse<boolean>> {
  const res = await secureFetch(`${getBaseUrl()}/auth/logout`, { method: "POST" });
  return toJson(res);
}

export async function getMe(): Promise<BaseResponse<Me>> {
  const res = await secureFetch(`${getBaseUrl()}/auth/me`);
  return toJson(res);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<BaseResponse<boolean>> {
  const res = await secureFetch(`${getBaseUrl()}/auth/password`, { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
  return toJson(res);
}

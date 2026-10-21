// Client HTTP de l'API event-backend — même structure que src/api/api.ts de in-seach :
// `getBaseUrl`, `toQueryString`, `secureFetch` (jeton du cookie `token`, déconnexion sur 401)
// et une fonction par route dans les fichiers `*-api.ts` du dossier, qui renvoient toutes un
// `BaseResponse<T>` (les erreurs de l'API ont la même forme : { statusCode, message }).

import { getCookie } from "@/lib/cookies";
import type { BaseResponse } from "@/types/interface";

/** Adresse de l'API, `/api/v1` compris (NEXT_PUBLIC_API_URL peut l'omettre) */
export const getBaseUrl = (): string => {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "https://event-api.djamko.com").replace(/\/+$/, "");
  return /\/api\/v\d+$/.test(raw) ? raw : `${raw}/api/v1`;
};

/** Site de l'événement servi par ce frontend */
export const getEventSlug = (): string => process.env.NEXT_PUBLIC_EVENT_SLUG || "emmanuel-grace-2026";

/** Préfixe des routes publiques de l'événement */
export const publicEventUrl = (path = ""): string => `${getBaseUrl()}/public/events/${encodeURIComponent(getEventSlug())}${path}`;

/** Identifiant de l'événement géré, mémorisé à la connexion (cookie `eventId`) */
export const getEventId = (): string | undefined => getCookie("eventId");

/** Préfixe des routes de gestion de l'événement (`/events/:eventId/...`) */
export const eventUrl = (path = ""): string => `${getBaseUrl()}/events/${getEventId() ?? "_"}${path}`;

/** Session de gestion ouverte dans ce navigateur (organisateur ou agent) */
export const hasStaffSession = (): boolean => !!getCookie("token") && !!getEventId();
/** Session organisateur (accès à toute la gestion) */
export const hasAdminSession = (): boolean => hasStaffSession() && getCookie("role") === "ADMIN";

export function toQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) value.forEach((v) => v !== undefined && v !== null && v !== "" && searchParams.append(key, String(v)));
    else searchParams.append(key, String(value));
  });
  return searchParams.toString();
}

/**
 * Lit la réponse sous la forme `BaseResponse`. Les erreurs de validation de l'API arrivent en
 * tableau de messages : on garde le premier, lisible tel quel dans un toast. Une réponse non
 * JSON (proxy, panne) devient une erreur avec un message compréhensible.
 */
export async function toJson<T>(res: Response): Promise<BaseResponse<T>> {
  const body = (await res.json().catch(() => null)) as (BaseResponse<T> & { message?: string | string[] }) | null;
  if (!body) {
    return { statusCode: res.status, message: res.ok ? "Réponse vide du serveur." : "Le serveur est momentanément indisponible. Réessayez dans un instant." };
  }
  const message = Array.isArray(body.message) ? body.message[0] : body.message;
  if (res.status === 429) return { statusCode: 429, message: "Trop de tentatives. Merci de patienter une minute." };
  return { ...body, statusCode: body.statusCode ?? res.status, message: message ?? "" };
}

/** Appel public, sans jeton */
export const publicFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers: Record<string, string> = { ...((options.headers as Record<string, string>) || {}) };
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  return fetch(url, { ...options, headers });
};

// secureFetch : routes protégées uniquement
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getCookie("token") || "";
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    Authorization: `Bearer ${token}`,
  };
  // application/json sauf pour un envoi de fichier (FormData fixe lui-même son en-tête)
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const response = await fetch(url, { ...options, headers });

  // Session expirée ou fermée à distance : retour à la connexion (comme in-seach)
  if (response.status === 401 && token) {
    import("@/store/authStore").then(({ useAuthStore }) => {
      useAuthStore.getState().logout({ skipServer: true });
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
    });
  }
  return response;
};

import { deleteCookie, setCookie } from "@/lib/cookies";
import type { SessionUser } from "@/types/interface";

// Les cookies `token` et `role` sont lus par `src/proxy.ts` pour protéger /admin et
// /verification avant même le rendu de la page ; `eventId` désigne l'événement géré
// (routes /events/:eventId de l'API). Le jeton est un JWT de l'API, lié à une session
// serveur révocable : sa durée de vie fait foi, le cookie n'est qu'un transport.

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  /** Expiration du jeton d'accès (ISO) */
  expiresAt: string;
}

export function setSession(tokens: SessionTokens, user: SessionUser): void {
  const maxAge = Math.max(60, Math.floor((new Date(tokens.expiresAt).getTime() - Date.now()) / 1000));
  setCookie("token", tokens.accessToken, maxAge);
  setCookie("role", user.role, maxAge);
  setCookie("eventId", user.eventId, maxAge);
}

export function clearSession(): void {
  deleteCookie("token");
  deleteCookie("role");
  deleteCookie("eventId");
}

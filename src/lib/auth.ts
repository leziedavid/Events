import type { SessionUser } from "@/types/interface";

// Les cookies `token` et `role` sont lus par `src/proxy.ts` pour protéger /admin et
// /verification avant même le rendu de la page.

const DAY = 60 * 60 * 24;

export function setSession(token: string, user: SessionUser): void {
  document.cookie = `token=${token}; path=/; max-age=${DAY}; samesite=lax`;
  document.cookie = `role=${user.role}; path=/; max-age=${DAY}; samesite=lax`;
}

export function clearSession(): void {
  document.cookie = "token=; path=/; max-age=0; samesite=lax";
  document.cookie = "role=; path=/; max-age=0; samesite=lax";
}

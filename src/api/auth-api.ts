// Connexion simulée de l'espace organisateurs. Avec le backend : POST /auth/login → JWT.

import { DEMO_ACCOUNTS } from "@/data/seed";
import type { LoginInput } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/security";
import { delay, fail, ok } from "@/lib/storage";
import type { BaseResponse, SessionUser } from "@/types/interface";

export async function login(input: LoginInput): Promise<BaseResponse<{ token: string; user: SessionUser }>> {
  await delay(500);
  if (!checkRateLimit("login", 8, 60_000)) return fail(429, "Trop de tentatives. Merci de patienter une minute.");
  const account = DEMO_ACCOUNTS.find(
    (a) => a.identifiant === input.identifiant.trim().toLowerCase() && a.password === input.password,
  );
  if (!account) return fail(401, "Identifiant ou mot de passe incorrect.");
  return ok({ token: crypto.randomUUID(), user: { name: account.name, role: account.role } }, "Connexion réussie");
}

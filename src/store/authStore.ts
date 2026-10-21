import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearSession, setSession, type SessionTokens } from "@/lib/auth";
import type { SessionUser } from "@/types/interface";

interface AuthState {
  user: SessionUser | null;
  signIn: (tokens: SessionTokens, user: SessionUser) => void;
  /** `skipServer` : la session est déjà fermée côté API (jeton expiré ou révoqué) */
  logout: (options?: { skipServer?: boolean }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (tokens, user) => {
        setSession(tokens, user);
        set({ user });
      },
      logout: (options) => {
        // Fermeture de la session serveur avant d'effacer le jeton (sans attendre la réponse)
        if (!options?.skipServer) void import("@/api/auth-api").then(({ logout }) => logout().catch(() => undefined)).finally(clearSession);
        else clearSession();
        set({ user: null });
      },
    }),
    // Le nom seul est conservé (affichage) ; le jeton ne vit que dans le cookie
    { name: "mariage-session" },
  ),
);

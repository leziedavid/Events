import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearSession, setSession } from "@/lib/auth";
import type { SessionUser } from "@/types/interface";

interface AuthState {
  user: SessionUser | null;
  signIn: (token: string, user: SessionUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (token, user) => {
        setSession(token, user);
        set({ user });
      },
      logout: () => {
        clearSession();
        set({ user: null });
      },
    }),
    { name: "mariage-session" },
  ),
);

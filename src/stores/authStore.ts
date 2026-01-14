import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../lib/auth";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (userData) =>
        set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "magenta-activity-auth",
    }
  )
);

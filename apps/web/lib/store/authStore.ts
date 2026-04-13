import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "user" | "vendor" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  vendor_id: string | null;
  created_at?: string | null;
  profile_image_url?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setHasHydrated: (hydrated: boolean) => void;
  isAuthenticated: () => boolean;
  isVendor: () => boolean;
  isAdmin: () => boolean;
}

const REFRESH_TOKEN_KEY = "afdp-refresh-token";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
        set({ user, accessToken, refreshToken });
      },
      updateUser: (user) => set({ user }),
      clearAuth: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      isAuthenticated: () => !!get().accessToken && !!get().user,
      isVendor: () => {
        const role = get().user?.role;
        return role === "vendor" || role === "admin";
      },
      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "afdp-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);


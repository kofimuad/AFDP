import { create } from "zustand";

interface MockUser {
  fullName: string;
  email: string;
}

interface AuthState {
  user: MockUser | null;
  mode: "signin" | "signup";
  setMode: (mode: "signin" | "signup") => void;
  signIn: (email: string) => void;
  signUp: (fullName: string, email: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  mode: "signin",
  setMode: (mode) => set({ mode }),
  signIn: (email) =>
    set({
      user: {
        fullName: "AFDP User",
        email
      }
    }),
  signUp: (fullName, email) =>
    set({
      user: {
        fullName,
        email
      }
    }),
  signOut: () => set({ user: null })
}));
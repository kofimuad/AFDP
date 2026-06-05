"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

import { getMe } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import {
  clearSaved,
  hydrateSavedFromServer,
  mergeLocalSavedToServer,
  useSavedStore
} from "@/lib/store/savedStore";

function AuthRefresher() {
  const hasHydrated = useHasHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (!hasHydrated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        updateUser({
          id: me.id,
          email: me.email,
          full_name: me.full_name,
          role: me.role,
          vendor_id: me.vendor_id,
          created_at: me.created_at,
          profile_image_url: me.profile_image_url,
        });
      } catch {
        if (!cancelled) clearAuth();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, accessToken, updateUser, clearAuth]);

  return null;
}

/**
 * Keeps the saved collection in sync with auth:
 * - fresh authed load / token refresh → pull the server collection
 * - login (guest → authed)            → merge guest saves up, then pull
 * - logout (authed → guest)           → clear the local collection
 * Guests are left on localStorage only.
 */
function SavedSync() {
  const authHydrated = useHasHydrated();
  const savedHydrated = useSavedStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const prev = useRef<string | null | "init">("init");

  useEffect(() => {
    if (!authHydrated || !savedHydrated) return;
    const had = prev.current;

    if (accessToken) {
      if (had === null) {
        void mergeLocalSavedToServer(); // just logged in
      } else {
        void hydrateSavedFromServer(); // fresh authed load or token refresh
      }
    } else if (had && had !== "init") {
      clearSaved(); // just logged out
    }

    prev.current = accessToken;
  }, [authHydrated, savedHydrated, accessToken]);

  return null;
}

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRefresher />
      <SavedSync />
      {children}
    </QueryClientProvider>
  );
}

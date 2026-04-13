"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useState } from "react";

import { getMe } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";

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

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRefresher />
      {children}
    </QueryClientProvider>
  );
}

import { useEffect, useState } from "react";
import { useAuthStore } from "./authStore";

export const useHasHydrated = (): boolean => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    if (useAuthStore.getState()._hasHydrated) {
      setHasHydrated(true);
      return;
    }
    const unsub = useAuthStore.subscribe((state) => {
      if (state._hasHydrated) setHasHydrated(true);
    });
    return () => unsub();
  }, []);

  return hasHydrated;
};

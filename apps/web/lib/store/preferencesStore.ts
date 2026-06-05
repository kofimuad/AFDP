import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PreferredLocation {
  lat: number;
  lng: number;
}

interface PreferencesState {
  /** A location the user pins as their default for proximity searches. */
  preferredLocation: PreferredLocation | null;
  _hasHydrated: boolean;
  setPreferredLocation: (loc: PreferredLocation) => void;
  clearPreferredLocation: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

// Theme is handled by next-themes (also persisted); this store holds the
// other client-side preferences — currently the preferred search location,
// which useGeolocation reads as an override.
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferredLocation: null,
      _hasHydrated: false,
      setPreferredLocation: (loc) => set({ preferredLocation: loc }),
      clearPreferredLocation: () => set({ preferredLocation: null }),
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated })
    }),
    {
      name: "afdp-preferences",
      partialize: (state) => ({ preferredLocation: state.preferredLocation }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);

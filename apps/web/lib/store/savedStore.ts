import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedFood {
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface SavedState {
  foods: SavedFood[];
  _hasHydrated: boolean;
  toggleFood: (food: SavedFood) => boolean; // returns true if now saved
  isFoodSaved: (slug: string) => boolean;
  removeFood: (slug: string) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      foods: [],
      _hasHydrated: false,
      toggleFood: (food) => {
        const exists = get().foods.some((f) => f.slug === food.slug);
        if (exists) {
          set((state) => ({ foods: state.foods.filter((f) => f.slug !== food.slug) }));
          return false;
        }
        set((state) => ({ foods: [...state.foods, food] }));
        return true;
      },
      isFoodSaved: (slug) => get().foods.some((f) => f.slug === slug),
      removeFood: (slug) =>
        set((state) => ({ foods: state.foods.filter((f) => f.slug !== slug) })),
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated })
    }),
    {
      name: "afdp-saved",
      partialize: (state) => ({ foods: state.foods }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);

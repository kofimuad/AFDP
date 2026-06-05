import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { VendorType } from "@/types";

export interface SavedFood {
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

export interface SavedVendor {
  slug: string;
  name: string;
  address: string;
  type: VendorType;
  image_url: string | null;
}

interface SavedState {
  foods: SavedFood[];
  vendors: SavedVendor[];
  _hasHydrated: boolean;

  // dishes
  toggleFood: (food: SavedFood) => boolean; // returns true if now saved
  isFoodSaved: (slug: string) => boolean;
  removeFood: (slug: string) => void;

  // vendors (places)
  toggleVendor: (vendor: SavedVendor) => boolean; // returns true if now saved
  isVendorSaved: (slug: string) => boolean;
  removeVendor: (slug: string) => void;

  setHasHydrated: (hydrated: boolean) => void;
}

// NOTE: persistence is currently client-side (localStorage), so saves are
// per-browser. When the M6 SCRUM-37 save-recipes/collection API lands, swap
// the toggle/remove actions to call it and hydrate `foods`/`vendors` from the
// authenticated user's collection — the component API stays the same.
export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      foods: [],
      vendors: [],
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

      toggleVendor: (vendor) => {
        const exists = get().vendors.some((v) => v.slug === vendor.slug);
        if (exists) {
          set((state) => ({ vendors: state.vendors.filter((v) => v.slug !== vendor.slug) }));
          return false;
        }
        set((state) => ({ vendors: [...state.vendors, vendor] }));
        return true;
      },
      isVendorSaved: (slug) => get().vendors.some((v) => v.slug === slug),
      removeVendor: (slug) =>
        set((state) => ({ vendors: state.vendors.filter((v) => v.slug !== slug) })),

      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated })
    }),
    {
      name: "afdp-saved",
      partialize: (state) => ({ foods: state.foods, vendors: state.vendors }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);

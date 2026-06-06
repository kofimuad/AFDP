import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  getSavedCollection,
  saveFoodApi,
  saveVendorApi,
  unsaveFoodApi,
  unsaveVendorApi
} from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useToastStore } from "@/lib/store/toastStore";
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

const isAuthed = () => Boolean(useAuthStore.getState().accessToken);
const syncError = () =>
  useToastStore.getState().showToast("Couldn't sync your saved items. Try again.", "error");

// ── Backend sync (only when authenticated; reverts local state on failure) ──

async function pushFood(food: SavedFood, save: boolean) {
  if (!isAuthed()) return; // guests: localStorage only
  try {
    await (save ? saveFoodApi(food.slug) : unsaveFoodApi(food.slug));
  } catch {
    useSavedStore.setState((state) => {
      const has = state.foods.some((f) => f.slug === food.slug);
      if (save && has) return { foods: state.foods.filter((f) => f.slug !== food.slug) };
      if (!save && !has) return { foods: [...state.foods, food] };
      return state;
    });
    syncError();
  }
}

async function pushVendor(vendor: SavedVendor, save: boolean) {
  if (!isAuthed()) return;
  try {
    await (save ? saveVendorApi(vendor.slug) : unsaveVendorApi(vendor.slug));
  } catch {
    useSavedStore.setState((state) => {
      const has = state.vendors.some((v) => v.slug === vendor.slug);
      if (save && has) return { vendors: state.vendors.filter((v) => v.slug !== vendor.slug) };
      if (!save && !has) return { vendors: [...state.vendors, vendor] };
      return state;
    });
    syncError();
  }
}

// NOTE: persistence is localStorage (a per-browser cache + guest store).
// When authenticated, SavedSync replaces it with the server collection and
// every toggle/remove is mirrored to the /saved API below.
export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      foods: [],
      vendors: [],
      _hasHydrated: false,

      toggleFood: (food) => {
        const nowSaved = !get().foods.some((f) => f.slug === food.slug);
        set((state) => ({
          foods: nowSaved
            ? [...state.foods, food]
            : state.foods.filter((f) => f.slug !== food.slug)
        }));
        void pushFood(food, nowSaved);
        return nowSaved;
      },
      isFoodSaved: (slug) => get().foods.some((f) => f.slug === slug),
      removeFood: (slug) => {
        const existing = get().foods.find((f) => f.slug === slug);
        set((state) => ({ foods: state.foods.filter((f) => f.slug !== slug) }));
        if (existing) void pushFood(existing, false);
      },

      toggleVendor: (vendor) => {
        const nowSaved = !get().vendors.some((v) => v.slug === vendor.slug);
        set((state) => ({
          vendors: nowSaved
            ? [...state.vendors, vendor]
            : state.vendors.filter((v) => v.slug !== vendor.slug)
        }));
        void pushVendor(vendor, nowSaved);
        return nowSaved;
      },
      isVendorSaved: (slug) => get().vendors.some((v) => v.slug === slug),
      removeVendor: (slug) => {
        const existing = get().vendors.find((v) => v.slug === slug);
        set((state) => ({ vendors: state.vendors.filter((v) => v.slug !== slug) }));
        if (existing) void pushVendor(existing, false);
      },

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

// ── Auth-driven sync helpers (used by SavedSync) ──────────────────────────

/** Replace the local collection with the authenticated user's server data. */
export async function hydrateSavedFromServer(): Promise<void> {
  try {
    const data = await getSavedCollection();
    useSavedStore.setState({
      foods: data.foods.map((f) => ({
        slug: f.slug,
        name: f.name,
        description: f.description,
        image_url: f.image_url
      })),
      vendors: data.vendors.map((v) => ({
        slug: v.slug,
        name: v.name,
        address: v.address,
        type: v.type as VendorType,
        image_url: v.image_url
      }))
    });
  } catch {
    // Keep the local cache if the request fails.
  }
}

/** On login: push any guest saves up to the server, then pull the merged set. */
export async function mergeLocalSavedToServer(): Promise<void> {
  const { foods, vendors } = useSavedStore.getState();
  try {
    await Promise.allSettled([
      ...foods.map((f) => saveFoodApi(f.slug)),
      ...vendors.map((v) => saveVendorApi(v.slug))
    ]);
  } catch {
    // ignore — best effort
  }
  await hydrateSavedFromServer();
}

/** On logout: drop the collection so it doesn't leak to the next session. */
export function clearSaved(): void {
  useSavedStore.setState({ foods: [], vendors: [] });
}

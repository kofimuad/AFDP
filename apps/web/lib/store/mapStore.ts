import { create } from "zustand";

interface ViewportState {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface MapStoreState {
  viewport: ViewportState;
  activeVendorId: string | null;
  searchQuery: string;
  setViewport: (viewport: ViewportState) => void;
  setActiveVendorId: (vendorId: string | null) => void;
  setSearchQuery: (query: string) => void;
}

const DEFAULT_VIEWPORT: ViewportState = {
  latitude: 38.9072,
  longitude: -77.0369,
  zoom: 11
};

export const useMapStore = create<MapStoreState>((set) => ({
  viewport: DEFAULT_VIEWPORT,
  activeVendorId: null,
  searchQuery: "",
  setViewport: (viewport) => set({ viewport }),
  setActiveVendorId: (activeVendorId) => set({ activeVendorId }),
  setSearchQuery: (searchQuery) => set({ searchQuery })
}));
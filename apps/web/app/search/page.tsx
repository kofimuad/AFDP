"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { MapView } from "@/components/map/MapView";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchPanel } from "@/components/search/SearchPanel";
import { getVendors } from "@/lib/api";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useSearch } from "@/lib/hooks/useSearch";
import { useMapStore } from "@/lib/store/mapStore";
import type { VendorSummary, VendorType } from "@/types";

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);

  const typeParam = searchParams.get("type");
  const activeTypeFilter: VendorType | null = typeParam === "restaurant" || typeParam === "grocery_store" ? typeParam : null;

  const [prefilteredVendors, setPrefilteredVendors] = useState<VendorSummary[]>([]);
  const [isPrefilterLoading, setIsPrefilterLoading] = useState(false);

  const { lat, lng, isLoading: isGeoLoading } = useGeolocation();
  const { activeVendorId, setActiveVendorId, setViewport } = useMapStore();

  const { data, isLoading, isFetching } = useSearch({
    q: query,
    lat,
    lng,
    radiusKm: 10
  });

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    router.replace(`/search?${params.toString()}`);
  }, [query, router, searchParams]);

  useEffect(() => {
    setViewport({
      latitude: lat,
      longitude: lng,
      zoom: 11
    });
  }, [lat, lng, setViewport]);

  useEffect(() => {
    if (!activeTypeFilter) {
      setPrefilteredVendors([]);
      setIsPrefilterLoading(false);
      return;
    }

    let isMounted = true;
    setIsPrefilterLoading(true);

    getVendors({ type: activeTypeFilter })
      .then((vendors) => {
        if (!isMounted) return;
        setPrefilteredVendors(vendors);
      })
      .catch(() => {
        if (!isMounted) return;
        setPrefilteredVendors([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsPrefilterLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTypeFilter]);

  const searchVendors = useMemo(() => {
    if (!data) return [];
    const ingredientStores = data.ingredients.flatMap((entry) => entry.stores);
    const merged = [...data.restaurants, ...ingredientStores];
    const deduped = new Map<string, VendorSummary>();
    merged.forEach((vendor) => deduped.set(vendor.id, vendor));
    return Array.from(deduped.values());
  }, [data]);

  const vendors = useMemo(() => {
    if (query.trim()) return searchVendors;
    if (activeTypeFilter) return prefilteredVendors;
    return [];
  }, [activeTypeFilter, prefilteredVendors, query, searchVendors]);

  const panelLoading = query.trim() ? isLoading || isFetching || isGeoLoading : isPrefilterLoading || isGeoLoading;

  const handleVendorSelect = (vendor: VendorSummary) => {
    setActiveVendorId(vendor.id);
    if (vendor.lat != null && vendor.lng != null) {
      setViewport({
        latitude: vendor.lat,
        longitude: vendor.lng,
        zoom: 13.5
      });
    }
  };

  const clearTypeFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("type");
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-6">
      <div className="sticky top-16 z-40 mb-4 bg-[var(--color-bg)]/95 py-2 backdrop-blur">
        <SearchBar value={query} onChange={setQuery} isLoading={panelLoading} mode="compact" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className="order-2 lg:order-1">
          <MapView vendors={vendors} onVendorClick={handleVendorSelect} />
        </section>

        <aside className="order-1 space-y-4 lg:order-2">
          {activeTypeFilter ? (
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-primary-light)] px-3 py-2">
              <p className="text-sm font-medium text-[var(--color-primary)]">
                Showing: {activeTypeFilter === "restaurant" ? "Restaurants only" : "Grocery Stores only"}
              </p>
              <button
                type="button"
                onClick={clearTypeFilter}
                className="rounded-full p-1 text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
                aria-label="Clear type filter"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}

          <SearchPanel
            data={data}
            isLoading={panelLoading}
            activeVendorId={activeVendorId}
            onVendorSelect={handleVendorSelect}
            prefetchedVendors={!query.trim() ? prefilteredVendors : []}
          />
        </aside>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-6">Loading search...</main>}>
      <SearchPageContent />
    </Suspense>
  );
}
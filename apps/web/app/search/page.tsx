"use client";

import { ChevronDown, Map as MapIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { MapView } from "@/components/map/MapView";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchPanel, type SearchSort } from "@/components/search/SearchPanel";
import { getVendors } from "@/lib/api";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useSearch } from "@/lib/hooks/useSearch";
import { useMapStore } from "@/lib/store/mapStore";
import type { VendorSummary, VendorType } from "@/types";

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "nearest", label: "Nearest" },
  { value: "popular", label: "Most Popular" },
  { value: "recent", label: "Recently Added" }
];

type ChipFilter =
  | { kind: "all" }
  | { kind: "type"; value: VendorType }
  | { kind: "region"; value: string };

const FILTER_CHIPS: { label: string; filter: ChipFilter }[] = [
  { label: "All", filter: { kind: "all" } },
  { label: "Restaurants", filter: { kind: "type", value: "restaurant" } },
  { label: "Grocery Stores", filter: { kind: "type", value: "grocery_store" } },
  { label: "West African", filter: { kind: "region", value: "west-african" } },
  { label: "Ethiopian", filter: { kind: "region", value: "ethiopian" } },
  { label: "North African", filter: { kind: "region", value: "north-african" } }
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);

  const typeParam = searchParams.get("type");
  const activeTypeFilter: VendorType | null = typeParam === "restaurant" || typeParam === "grocery_store" ? typeParam : null;
  const activeRegionFilter = searchParams.get("region");

  const [prefilteredVendors, setPrefilteredVendors] = useState<VendorSummary[]>([]);
  const [isPrefilterLoading, setIsPrefilterLoading] = useState(false);
  const [sort, setSort] = useState<SearchSort>("nearest");
  const [isMapOpenMobile, setIsMapOpenMobile] = useState(false);

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

  const resultCount = vendors.length;

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

  const isChipActive = (filter: ChipFilter) => {
    if (filter.kind === "all") return !activeTypeFilter && !activeRegionFilter;
    if (filter.kind === "type") return activeTypeFilter === filter.value;
    return activeRegionFilter === filter.value;
  };

  const applyChip = (filter: ChipFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter.kind === "all") {
      params.delete("type");
      params.delete("region");
    } else if (filter.kind === "type") {
      params.delete("region");
      if (activeTypeFilter === filter.value) params.delete("type");
      else params.set("type", filter.value);
    } else {
      params.delete("type");
      if (activeRegionFilter === filter.value) params.delete("region");
      else params.set("region", filter.value);
    }
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-6">
      <div className="sticky top-16 z-40 mb-4 bg-[var(--color-bg)]/95 py-2 backdrop-blur">
        <SearchBar value={query} onChange={setQuery} isLoading={panelLoading} mode="compact" />
        <div className="-mx-4 mt-3 overflow-x-auto px-4 md:-mx-6 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {FILTER_CHIPS.map(({ label, filter }) => {
              const active = isChipActive(filter);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => applyChip(filter)}
                  aria-pressed={active}
                  className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
        <aside className="space-y-4">
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

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">
              {resultCount} {resultCount === 1 ? "result" : "results"} near you
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMapOpenMobile((open) => !open)}
                aria-pressed={isMapOpenMobile}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)] lg:hidden"
              >
                <MapIcon size={14} />
                {isMapOpenMobile ? "Hide map" : "Map"}
              </button>
              <label className="relative inline-flex items-center">
                <span className="sr-only">Sort results</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SearchSort)}
                  className="appearance-none rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-3 pr-8 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-[var(--color-text-muted)]" />
              </label>
            </div>
          </div>

          <SearchPanel
            data={data}
            isLoading={panelLoading}
            activeVendorId={activeVendorId}
            onVendorSelect={handleVendorSelect}
            prefetchedVendors={!query.trim() ? prefilteredVendors : []}
            sort={sort}
          />
        </aside>

        <section
          className={`${isMapOpenMobile ? "block" : "hidden"} lg:sticky lg:top-[140px] lg:block lg:self-start`}
        >
          <MapView vendors={vendors} onVendorClick={handleVendorSelect} />
        </section>
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
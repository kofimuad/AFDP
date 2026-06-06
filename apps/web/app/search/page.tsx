"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { MapView } from "@/components/map/MapView";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters, type SearchFilter, type SearchSort } from "@/components/search/SearchFilters";
import { SearchPanel } from "@/components/search/SearchPanel";
import { getVendors } from "@/lib/api";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useSearch } from "@/lib/hooks/useSearch";
import { useMapStore } from "@/lib/store/mapStore";
import type { VendorSummary } from "@/types";

function filterFromType(type: string | null): SearchFilter {
  if (type === "restaurant") return "restaurant";
  if (type === "grocery_store") return "grocery";
  return "all";
}

function applyFilter(vendors: VendorSummary[], filter: SearchFilter): VendorSummary[] {
  switch (filter) {
    case "restaurant":
      return vendors.filter((v) => v.type === "restaurant");
    case "grocery":
      return vendors.filter((v) => v.type === "grocery_store");
    case "verified":
      return vendors.filter((v) => v.is_verified);
    default:
      return vendors;
  }
}

function applySort(vendors: VendorSummary[], sort: SearchSort): VendorSummary[] {
  const out = [...vendors];
  if (sort === "az") {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // nearest — distance ascending, unknown distances last
    out.sort((a, b) => {
      const ad = a.distance_km ?? Number.POSITIVE_INFINITY;
      const bd = b.distance_km ?? Number.POSITIVE_INFINITY;
      return ad - bd;
    });
  }
  return out;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilter>(filterFromType(searchParams.get("type")));
  const [sort, setSort] = useState<SearchSort>("nearest");

  const [browseVendors, setBrowseVendors] = useState<VendorSummary[]>([]);
  const [isBrowseLoading, setIsBrowseLoading] = useState(false);

  const { lat, lng, isLoading: isGeoLoading } = useGeolocation();
  const { activeVendorId, setActiveVendorId, setViewport } = useMapStore();

  const { data, isLoading, isFetching } = useSearch({ q: query, lat, lng, radiusKm: 10 });

  const hasQuery = query.trim().length > 0;

  // Keep the input in sync with the URL (e.g. suggestion links, "Browse
  // Restaurants" deep-links). Only adopt a filter when the URL carries an
  // explicit vendor type — otherwise we'd clobber the local "Verified"/"All".
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    const type = searchParams.get("type");
    if (type === "restaurant" || type === "grocery_store") {
      setFilter(filterFromType(type));
    }
  }, [searchParams]);

  // Reflect the query into the URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    router.replace(`/search?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Center the map on the user
  useEffect(() => {
    setViewport({ latitude: lat, longitude: lng, zoom: 11 });
  }, [lat, lng, setViewport]);

  // Browse mode (no query): fetch vendors for the active filter
  useEffect(() => {
    if (hasQuery || filter === "all") {
      setBrowseVendors([]);
      setIsBrowseLoading(false);
      return;
    }

    let active = true;
    setIsBrowseLoading(true);
    const params =
      filter === "restaurant"
        ? { type: "restaurant" as const }
        : filter === "grocery"
        ? { type: "grocery_store" as const }
        : { is_verified: true };

    getVendors(params)
      .then((vendors) => active && setBrowseVendors(vendors))
      .catch(() => active && setBrowseVendors([]))
      .finally(() => active && setIsBrowseLoading(false));

    return () => {
      active = false;
    };
  }, [hasQuery, filter]);

  // Base vendor set (query results or browse), deduped
  const baseVendors = useMemo(() => {
    if (hasQuery) {
      if (!data) return [];
      const stores = data.ingredients.flatMap((b) => b.stores);
      const merged = [...data.restaurants, ...stores];
      const deduped = new Map<string, VendorSummary>();
      merged.forEach((v) => deduped.set(v.id, v));
      return Array.from(deduped.values());
    }
    return browseVendors;
  }, [hasQuery, data, browseVendors]);

  const displayVendors = useMemo(
    () => applySort(applyFilter(baseVendors, filter), sort),
    [baseVendors, filter, sort]
  );

  const panelLoading = hasQuery
    ? isLoading || isFetching || isGeoLoading
    : filter !== "all" && (isBrowseLoading || isGeoLoading);

  const handleVendorSelect = useCallback(
    (vendor: VendorSummary) => {
      setActiveVendorId(vendor.id);
      if (vendor.lat != null && vendor.lng != null) {
        setViewport({ latitude: vendor.lat, longitude: vendor.lng, zoom: 13.5 });
      }
    },
    [setActiveVendorId, setViewport]
  );

  const handleFilter = useCallback(
    (next: SearchFilter) => {
      setFilter(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "restaurant") params.set("type", "restaurant");
      else if (next === "grocery") params.set("type", "grocery_store");
      else params.delete("type");
      router.replace(`/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-6 md:px-6">
      {/* Search + filters (sticky) */}
      <div className="sticky top-16 z-30 -mx-4 space-y-3 bg-[var(--color-bg)]/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <SearchBar value={query} onChange={setQuery} isLoading={panelLoading} mode="compact" />
        <SearchFilters filter={filter} onFilter={handleFilter} sort={sort} onSort={setSort} />
      </div>

      <div className="mt-3 grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* Results list */}
        <aside className="order-2 lg:order-1 lg:h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
          <SearchPanel
            query={query}
            isLoading={panelLoading}
            vendors={displayVendors}
            foodMatch={hasQuery ? data?.food_match ?? null : null}
            hasSearched={hasQuery}
            activeVendorId={activeVendorId}
            onVendorSelect={handleVendorSelect}
          />
        </aside>

        {/* Map */}
        <section className="order-1 lg:order-2 lg:sticky lg:top-32">
          <div className="h-[45vh] overflow-hidden rounded-[var(--radius-lg)] lg:h-[calc(100vh-12rem)] [&>div]:!h-full">
            <MapView vendors={displayVendors} onVendorClick={handleVendorSelect} />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<main className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-6">Loading search…</main>}
    >
      <SearchPageContent />
    </Suspense>
  );
}

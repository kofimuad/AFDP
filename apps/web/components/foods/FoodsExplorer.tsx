"use client";

import { Loader2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useToast } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils";
import type { FoodSummary } from "@/types";

type SortKey = "az" | "za" | "newest";

interface FoodsExplorerProps {
  foods: FoodSummary[];
  regions: string[];
  activeRegion: string | null;
}

const PAGE_SIZE = 12;

const REGION_DOT: Record<string, string> = {
  "West African": "#E07020",
  "East African": "#1E7A4A",
  "North African": "#D4A017",
  "Southern African": "#9C4A1A",
  "Central African": "#7A2E1C",
  "Afro-Caribbean": "#C44536"
};

export function FoodsExplorer({ foods, regions, activeRegion }: FoodsExplorerProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("az");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [locating, setLocating] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Client-side search + sort over the server-provided (region-filtered) set
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? foods.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            (f.description ?? "").toLowerCase().includes(q)
        )
      : foods;

    const sorted = [...matched];
    sorted.sort((a, b) => {
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "za") return b.name.localeCompare(a.name);
      // newest
      const at = a.created_at ? Date.parse(a.created_at) : 0;
      const bt = b.created_at ? Date.parse(b.created_at) : 0;
      return bt - at;
    });
    return sorted;
  }, [foods, query, sort]);

  // Reset the reveal window whenever the result set changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, sort, activeRegion]);

  // Infinite scroll: reveal more as the sentinel enters the viewport
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length]);

  function findNearMe() {
    if (!navigator.geolocation) {
      showToast("Location is not supported on this device", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => router.push(`/search?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`),
      () => {
        setLocating(false);
        showToast("Couldn't get your location", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  const shown = filtered.slice(0, visible);

  return (
    <div className="flex flex-col">
      {/* ── Page header band ── */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 md:px-6">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Explore African Dishes
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Browse the full directory of African cuisine — from street food to celebration feasts
          </p>

          {/* Search + Find Near Me */}
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="flex max-w-md flex-1 items-center gap-2.5 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 shadow-[var(--shadow-sm)] focus-within:border-[var(--color-primary)]">
              <Search size={16} className="shrink-0 text-[var(--color-text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes by name or ingredient…"
                aria-label="Search dishes"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
            </div>
            <button
              type="button"
              onClick={findNearMe}
              disabled={locating}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)] disabled:opacity-70"
            >
              {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              Find Near Me
            </button>
          </div>

          {/* Region filter pills */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <RegionPill href="/foods" label="All Regions" active={activeRegion === null} />
            {regions.map((region) => (
              <RegionPill
                key={region}
                href={`/foods?region=${encodeURIComponent(region)}`}
                label={region}
                dot={REGION_DOT[region]}
                active={activeRegion?.toLowerCase() === region.toLowerCase()}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            <strong className="text-[var(--color-text-primary)]">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "dish" : "dishes"} found
            {activeRegion ? ` in ${activeRegion}` : ""}
          </p>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <SlidersHorizontal size={14} className="hidden sm:block" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort dishes"
              className="cursor-pointer rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-sm font-medium text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] py-20 text-center">
            <Search size={32} className="text-[var(--color-text-muted)]" />
            <p className="display-font text-xl font-bold text-[var(--color-text-primary)]">
              No dishes found
            </p>
            <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
              Try a different search{activeRegion ? " or explore another region" : ""}.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {shown.map((food) => (
                <Link
                  key={food.id}
                  href={`/foods/${food.slug}`}
                  aria-label={food.name}
                  className="group block overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                >
                  {food.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={food.image_url}
                      alt={food.name}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="food-gradient-dish aspect-square w-full" />
                  )}
                  <div className="p-3 sm:p-3.5">
                    <p className="font-semibold text-[var(--color-text-primary)]">{food.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                      {food.description ?? "Traditional and modern African flavors."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Infinite-scroll sentinel */}
            {visible < filtered.length && (
              <div
                ref={sentinelRef}
                className="mt-8 flex items-center justify-center py-4 text-[var(--color-text-muted)]"
              >
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ── Region pill ──────────────────────────────────────────────

function RegionPill({
  href,
  label,
  dot,
  active
}: {
  href: string;
  label: string;
  dot?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href as Route}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border-[1.5px] px-4 py-2 text-sm font-bold transition",
        active
          ? "border-[var(--color-dark)] bg-[var(--color-dark)] text-[var(--color-text-inverse)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)]"
      )}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dot }}
          aria-hidden="true"
        />
      )}
      {label}
    </Link>
  );
}

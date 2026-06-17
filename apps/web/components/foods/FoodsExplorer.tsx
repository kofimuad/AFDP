"use client";

import { Clock, Loader2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { SaveDishButton } from "@/components/food/SaveDishButton";
import { useToast } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils";
import type { FoodSummary } from "@/types";

type SortKey = "az" | "za" | "newest";

interface FoodsExplorerProps {
  foods: FoodSummary[];
  regions: string[];
  cuisines: string[];
  activeRegion: string | null;
  activeCuisine: string | null;
  /** Seed the search box (e.g. from the homepage "Cook it yourself" search). */
  initialQuery?: string;
}

const PAGE_SIZE = 12;
const MAX_SUGGESTIONS = 8;

const REGION_DOT: Record<string, string> = {
  "West African": "#F23B2F",
  "East African": "#1E7A4A",
  "North African": "#D4A017",
  "Southern African": "#9C4A1A",
  "Central African": "#7A2E1C",
  "Afro-Caribbean": "#C44536"
};

// Build a /foods URL that preserves whichever filters are still active.
function buildFoodsHref(region: string | null, cuisine: string | null): Route {
  const sp = new URLSearchParams();
  if (region) sp.set("region", region);
  if (cuisine) sp.set("cuisine", cuisine);
  const qs = sp.toString();
  return (qs ? `/foods?${qs}` : "/foods") as Route;
}

// "20m prep · 45m cook" — gracefully omits whichever side is missing.
function formatTimes(prep: number | null, cook: number | null): string | null {
  const parts: string[] = [];
  if (prep != null && prep > 0) parts.push(`${prep}m prep`);
  if (cook != null && cook > 0) parts.push(`${cook}m cook`);
  return parts.length ? parts.join(" · ") : null;
}

export function FoodsExplorer({
  foods,
  regions,
  cuisines,
  activeRegion,
  activeCuisine,
  initialQuery
}: FoodsExplorerProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [query, setQuery] = useState(initialQuery ?? "");
  const [sort, setSort] = useState<SortKey>("az");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [locating, setLocating] = useState(false);

  // Autocomplete state
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Client-side search + sort over the server-provided (region/cuisine-filtered) set
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

  // Autocomplete suggestions: name-prefix matches rank first, then substring.
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = foods.filter((f) => f.name.toLowerCase().includes(q));
    matches.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name);
    });
    return matches.slice(0, MAX_SUGGESTIONS);
  }, [foods, query]);

  // Reset the reveal window whenever the result set changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, sort, activeRegion, activeCuisine]);

  // Keep the active suggestion index in range as suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Close the autocomplete dropdown on outside click
  useEffect(() => {
    if (!suggestOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [suggestOpen]);

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

  function goToDish(slug: string) {
    router.push(`/foods/${slug}` as Route);
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestOpen || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        event.preventDefault();
        goToDish(suggestions[activeIndex].slug);
      }
    } else if (event.key === "Escape") {
      setSuggestOpen(false);
    }
  }

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
  const hasFilter = !!activeRegion || !!activeCuisine;

  return (
    <div className="flex flex-col">
      {/* ── Page header band ── */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 md:px-6">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Cook It Yourself
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Browse African dishes to make at home — search by name, then filter by cuisine and region
          </p>

          {/* Search (with autocomplete) + Find Near Me */}
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div ref={searchBoxRef} className="relative max-w-md flex-1">
              <div
                className="flex items-center gap-2.5 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 shadow-[var(--shadow-sm)] focus-within:border-[var(--color-primary)]"
              >
                <Search size={16} className="shrink-0 text-[var(--color-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSuggestOpen(true);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search dishes by name…"
                  aria-label="Search dishes"
                  role="combobox"
                  aria-expanded={suggestOpen && suggestions.length > 0}
                  aria-controls="dish-suggestions"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    activeIndex >= 0 ? `dish-suggestion-${activeIndex}` : undefined
                  }
                  autoComplete="off"
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              {/* Autocomplete dropdown */}
              {suggestOpen && suggestions.length > 0 && (
                <ul
                  id="dish-suggestions"
                  role="listbox"
                  className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 shadow-[var(--shadow-lg)]"
                >
                  {suggestions.map((food, i) => (
                    <li key={food.id} role="presentation">
                      <button
                        type="button"
                        id={`dish-suggestion-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => goToDish(food.slug)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left transition",
                          i === activeIndex
                            ? "bg-[var(--color-surface-hover)]"
                            : "hover:bg-[var(--color-surface-hover)]"
                        )}
                      >
                        {food.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={food.image_url}
                            alt=""
                            loading="lazy"
                            className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] object-cover"
                          />
                        ) : (
                          <span className="food-gradient-dish h-9 w-9 shrink-0 rounded-[var(--radius-sm)]" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
                            {food.name}
                          </span>
                          {food.region && (
                            <span className="block truncate text-xs text-[var(--color-text-muted)]">
                              {food.region}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
            <FilterPill
              href={buildFoodsHref(null, activeCuisine)}
              label="All Regions"
              active={activeRegion === null}
            />
            {regions.map((region) => (
              <FilterPill
                key={region}
                href={buildFoodsHref(region, activeCuisine)}
                label={region}
                dot={REGION_DOT[region]}
                active={activeRegion?.toLowerCase() === region.toLowerCase()}
              />
            ))}
          </div>

          {/* Cuisine filter pills */}
          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterPill
              href={buildFoodsHref(activeRegion, null)}
              label="All Cuisines"
              active={activeCuisine === null}
            />
            {cuisines.map((cuisine) => (
              <FilterPill
                key={cuisine}
                href={buildFoodsHref(activeRegion, cuisine)}
                label={cuisine}
                active={activeCuisine?.toLowerCase() === cuisine.toLowerCase()}
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
            {activeCuisine ? ` · ${activeCuisine}` : ""}
            {activeRegion ? ` · ${activeRegion}` : ""}
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
              {query
                ? `No dishes match “${query.trim()}”.`
                : "No dishes match these filters."}{" "}
              {hasFilter ? "Try clearing a filter" : "Try a different search"}.
            </p>
            {hasFilter && (
              <Link
                href={"/foods" as Route}
                className="mt-1 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
              >
                Clear all filters
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {shown.map((food) => {
                const times = formatTimes(food.prep_minutes, food.cook_minutes);
                return (
                  <div
                    key={food.id}
                    className="group relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                  >
                    {/* Save (icon) — overlaid outside the link so the button isn't nested in an anchor */}
                    <div className="absolute right-2 top-2 z-10">
                      <SaveDishButton
                        food={{ slug: food.slug, name: food.name, description: food.description, image_url: food.image_url }}
                        variant="icon"
                        className="h-9 w-9 border-0 bg-[var(--color-surface)]/90 shadow-[var(--shadow-sm)] backdrop-blur"
                      />
                    </div>
                    <Link href={`/foods/${food.slug}` as Route} aria-label={food.name} className="block">
                      <div className="relative">
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
                        {food.region && (
                          <span className="absolute left-2 top-2 rounded-full bg-[var(--color-dark)]/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            {food.region}
                          </span>
                        )}
                      </div>
                      <div className="p-3 sm:p-3.5">
                        <p className="font-semibold text-[var(--color-text-primary)]">{food.name}</p>
                        {times && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                            <Clock size={13} className="shrink-0" />
                            {times}
                          </p>
                        )}
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                          {food.description ?? "Traditional and modern African flavors."}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
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

// ── Filter pill (region + cuisine) ───────────────────────────────────────────

function FilterPill({
  href,
  label,
  dot,
  active
}: {
  href: Route;
  label: string;
  dot?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
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

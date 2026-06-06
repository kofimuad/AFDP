"use client";

import { ArrowDownUp } from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchFilter = "all" | "restaurant" | "grocery" | "verified";
export type SearchSort = "nearest" | "az";

const FILTERS: ReadonlyArray<{ key: SearchFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "restaurant", label: "Restaurants" },
  { key: "grocery", label: "Groceries" },
  { key: "verified", label: "Verified" }
];

interface SearchFiltersProps {
  filter: SearchFilter;
  onFilter: (filter: SearchFilter) => void;
  sort: SearchSort;
  onSort: (sort: SearchSort) => void;
}

export function SearchFilters({ filter, onFilter, sort, onSort }: SearchFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Filter pills */}
      <div
        className="flex flex-1 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Filter results"
      >
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onFilter(key)}
              aria-pressed={active}
              className={cn(
                "shrink-0 rounded-full border-[1.5px] px-4 py-1.5 text-sm font-bold transition",
                active
                  ? "border-[var(--color-dark)] bg-[var(--color-dark)] text-[var(--color-text-inverse)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)]"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <label className="relative inline-flex shrink-0 items-center">
        <ArrowDownUp
          size={13}
          className="pointer-events-none absolute left-3 text-[var(--color-text-muted)]"
          aria-hidden="true"
        />
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SearchSort)}
          aria-label="Sort results"
          className="cursor-pointer rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-8 pr-3 text-sm font-medium text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)]"
        >
          <option value="nearest">Nearest</option>
          <option value="az">A–Z</option>
        </select>
      </label>
    </div>
  );
}

"use client";

import { ChefHat, MapPin, SearchX } from "lucide-react";
import Link from "next/link";

import { ResultCard } from "@/components/search/ResultCard";
import type { FoodSummary, VendorSummary } from "@/types";

interface SearchPanelProps {
  query: string;
  isLoading: boolean;
  /** Display list — already filtered + sorted by the page */
  vendors: VendorSummary[];
  foodMatch?: FoodSummary | null;
  /** True once the user has entered a query */
  hasSearched: boolean;
  activeVendorId?: string | null;
  onVendorSelect?: (vendor: VendorSummary) => void;
}

const SUGGESTIONS = ["Jollof Rice", "Egusi Soup", "Suya", "Fufu", "Pepper Soup"];

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]"
        />
      ))}
    </div>
  );
}

export function SearchPanel({
  query,
  isLoading,
  vendors,
  foodMatch,
  hasSearched,
  activeVendorId,
  onVendorSelect
}: SearchPanelProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // ── Initial state: nothing searched yet ──
  if (!hasSearched && vendors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <MapPin size={22} />
        </span>
        <p className="display-font text-xl font-bold text-[var(--color-text-primary)]">
          Search for a dish or place
        </p>
        <p className="max-w-xs text-sm text-[var(--color-text-muted)]">
          Find restaurants serving the dish you crave and stores stocking the ingredients to cook it yourself.
        </p>
      </div>
    );
  }

  // ── Zero-result state (logged server-side as result_count: 0) ──
  if (hasSearched && vendors.length === 0 && !foodMatch) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
          <SearchX size={22} />
        </span>
        <p className="display-font text-xl font-bold text-[var(--color-text-primary)]">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="max-w-xs text-sm text-[var(--color-text-muted)]">
          We couldn&rsquo;t find anything nearby matching your search. Try another dish or widen your area.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s}
              href={`/search?q=${encodeURIComponent(s)}`}
              className="rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── Results ──
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        <strong className="text-[var(--color-text-primary)]">
          {vendors.length} {vendors.length === 1 ? "result" : "results"}
        </strong>
        {query.trim() ? ` for “${query.trim()}”` : ""} near you
      </p>

      {/* Food match highlight */}
      {foodMatch ? (
        <Link
          href={`/foods/${foodMatch.slug}`}
          className="block overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-primary)] p-5 text-[var(--color-text-inverse)] transition hover:brightness-105"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-white/70">Dish match</p>
          <p className="display-font mt-1 text-2xl font-extrabold">{foodMatch.name}</p>
          <p className="mt-1 text-sm text-white/90">
            {foodMatch.description ?? "View the recipe, ingredients and nearby options."}
          </p>
          <span className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
            View dish details →
          </span>
        </Link>
      ) : null}

      {/* Vendor results */}
      {vendors.length > 0 ? (
        <div className="space-y-3">
          {vendors.map((vendor) => (
            <ResultCard
              key={vendor.id}
              vendor={vendor}
              active={activeVendorId === vendor.id}
              onClick={() => onVendorSelect?.(vendor)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
          No nearby places match this filter.
        </p>
      )}

      {/* How to prepare (M6 hook) */}
      {foodMatch ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5">
          <div className="mb-2 flex items-center gap-2">
            <ChefHat size={18} className="text-[var(--color-primary)]" />
            <h3 className="display-font text-base font-bold text-[var(--color-text-primary)]">
              How to prepare it
            </h3>
            <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Step-by-step guides for {foodMatch.name} will appear here.{" "}
            <Link href={`/foods/${foodMatch.slug}`} className="font-semibold text-[var(--color-primary)] hover:underline">
              See ingredients →
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}

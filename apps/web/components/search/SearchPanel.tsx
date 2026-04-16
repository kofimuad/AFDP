"use client";

import { useMemo } from "react";

import { ResultCard } from "@/components/search/ResultCard";
import type { SearchIngredientBundle, SearchResponse, VendorSummary } from "@/types";

interface SearchPanelProps {
  data?: SearchResponse;
  isLoading: boolean;
  activeVendorId?: string | null;
  onVendorSelect?: (vendor: VendorSummary) => void;
  prefetchedVendors?: VendorSummary[];
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-hover)]" />
      ))}
    </div>
  );
}

function IngredientAccordion({
  bundle,
  activeVendorId,
  onVendorSelect
}: {
  bundle: SearchIngredientBundle;
  activeVendorId?: string | null;
  onVendorSelect?: (vendor: VendorSummary) => void;
}) {
  return (
    <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)]">{bundle.ingredient.name}</summary>
      <div className="grid gap-3 border-t border-[var(--color-border)] p-3">
        {bundle.stores.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No nearby stores found for this ingredient.</p>
        ) : (
          bundle.stores.map((store) => (
            <ResultCard
              key={`${bundle.ingredient.id}-${store.id}`}
              vendor={store}
              active={activeVendorId === store.id}
              onClick={() => onVendorSelect?.(store)}
            />
          ))
        )}
      </div>
    </details>
  );
}

export function SearchPanel({ data, isLoading, activeVendorId, onVendorSelect, prefetchedVendors = [] }: SearchPanelProps) {
  const restaurants = useMemo(() => (data?.restaurants?.length ? data.restaurants : prefetchedVendors), [data, prefetchedVendors]);

  const resultCount = useMemo(() => {
    if (!data) return 0;
    const ids = new Set<string>();
    for (const r of data.restaurants) ids.add(r.id);
    for (const bundle of data.ingredients) {
      for (const s of bundle.stores) ids.add(s.id);
    }
    return ids.size;
  }, [data]);

  const hasData = Boolean(
    (data && (data.restaurants.length > 0 || data.ingredients.length > 0 || data.food_match)) || prefetchedVendors.length > 0
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!hasData) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
        <p className="display-font text-2xl text-[var(--color-text-primary)]">Search for a dish above</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Results for restaurants and ingredient stores will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data ? (
        <p className="text-sm font-medium text-[var(--color-text-muted)]">
          {resultCount} {resultCount === 1 ? "result" : "results"} found near you
        </p>
      ) : null}

      {data?.food_match ? (
        <section className="rounded-[var(--radius-lg)] bg-[var(--color-primary)] p-5 text-[var(--color-text-inverse)]">
          <p className="display-font text-2xl">{data.food_match.name}</p>
          <p className="mt-2 text-sm text-[var(--color-text-inverse)]/90">{data.food_match.description ?? "Discover nearby options for this dish."}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="display-font text-xl text-[var(--color-text-primary)]">Restaurants serving this</h3>
        <div className="grid gap-3">
          {restaurants.length > 0 ? (
            restaurants.map((vendor) => (
              <ResultCard key={vendor.id} vendor={vendor} active={activeVendorId === vendor.id} onClick={() => onVendorSelect?.(vendor)} />
            ))
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No nearby restaurants currently match this food.</p>
          )}
        </div>
      </section>

      {data?.ingredients?.length ? (
        <section className="space-y-3">
          <h3 className="display-font text-xl text-[var(--color-text-primary)]">Where to find ingredients</h3>
          <div className="space-y-3">
            {data.ingredients.map((bundle) => (
              <IngredientAccordion key={bundle.ingredient.id} bundle={bundle} activeVendorId={activeVendorId} onVendorSelect={onVendorSelect} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Preparation guide placeholder */}
      {data?.food_match && (
        <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👨‍🍳</span>
            <h3 className="display-font text-xl text-[var(--color-text-primary)]">How to prepare it</h3>
            <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">Coming soon</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Step-by-step preparation guides and video recipes for {data.food_match.name} will appear here.
          </p>
        </section>
      )}
    </div>
  );
}

// FLUTTER NOTE:
// This component maps to: SliverList/Column with ExpansionTile sections
// Design tokens used: --radius-lg, --color-surface-hover, --color-border, --color-text-primary, --color-text-muted, --color-border-strong, --color-surface, --color-primary, --color-text-inverse
// State management equivalent: BLoC search-result state + selected-vendor state
// API call: searchFood / getVendors
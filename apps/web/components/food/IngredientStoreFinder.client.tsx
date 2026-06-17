"use client";

import { Loader2, MapPin, ShoppingBasket, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { getFoodIngredientStores } from "@/lib/api";
import { useToast } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils";
import type { FoodIngredient, IngredientStores, VendorSummary } from "@/types";

const RADII = [5, 10, 25] as const;

/** Prefer the structured "3 cups" amount; fall back to the free-text note. */
function formatAmount(item: FoodIngredient): string | null {
  if (item.quantity != null) {
    const qty = Number.isInteger(item.quantity) ? String(item.quantity) : item.quantity.toFixed(2).replace(/\.?0+$/, "");
    return item.unit ? `${qty} ${item.unit}` : qty;
  }
  return item.quantity_note;
}

interface IngredientStoreFinderProps {
  slug: string;
  ingredients: FoodIngredient[];
}

export function IngredientStoreFinder({ slug, ingredients }: IngredientStoreFinderProps) {
  const { showToast } = useToast();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(10);
  const [data, setData] = useState<IngredientStores[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(lat: number, lng: number, r: number) {
    setLoading(true);
    try {
      setData(await getFoodIngredientStores(slug, lat, lng, r));
    } catch {
      showToast("Couldn't load nearby stores. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  function findNearMe() {
    if (!navigator.geolocation) {
      showToast("Location isn't supported on this device.", "error");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        load(c.lat, c.lng, radius);
      },
      () => {
        setLoading(false);
        showToast("Couldn't get your location. Allow access and try again.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  function changeRadius(r: number) {
    setRadius(r);
    if (coords) load(coords.lat, coords.lng, r);
  }

  const byId = new Map((data ?? []).map((d) => [d.ingredient.id, d]));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="display-font flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
          <ShoppingBasket size={18} className="text-[var(--color-grocery)]" />
          Shopping list
        </h3>
        {coords ? (
          <div
            className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-surface-hover)] p-0.5 text-xs"
            role="group"
            aria-label="Search radius"
          >
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => changeRadius(r)}
                aria-pressed={radius === r}
                className={cn(
                  "rounded-full px-2.5 py-1 font-semibold transition",
                  radius === r
                    ? "bg-[var(--color-grocery)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                )}
              >
                {r} km
              </button>
            ))}
          </div>
        ) : (
          <span className="text-sm text-[var(--color-text-muted)]">
            {ingredients.length} {ingredients.length === 1 ? "ingredient" : "ingredients"}
          </span>
        )}
      </div>

      {!coords && (
        <button
          type="button"
          onClick={findNearMe}
          disabled={loading}
          className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-grocery)] bg-[var(--color-grocery-light)] px-4 py-3 text-sm font-semibold text-[var(--color-grocery)] transition hover:brightness-95 disabled:opacity-70"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          {loading ? "Finding stores near you…" : "Find which stores near you stock these"}
        </button>
      )}

      <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
        {ingredients.map((item) => {
          const result = byId.get(item.ingredient.id);
          return (
            <li key={item.ingredient.id} className="bg-[var(--color-surface)] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-grocery)]" aria-hidden="true" />
                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
                  {item.ingredient.name}
                  {formatAmount(item) ? (
                    <span className="font-normal text-[var(--color-text-muted)]"> · {formatAmount(item)}</span>
                  ) : null}
                </span>
                {coords && loading && !data ? (
                  <Loader2 size={14} className="animate-spin text-[var(--color-text-muted)]" />
                ) : null}
              </div>
              {coords && result ? <StoreAvailability result={result} radius={radius} /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StoreAvailability({ result, radius }: { result: IngredientStores; radius: number }) {
  if (result.available_nearby && result.stores.length > 0) {
    const shown = result.stores.slice(0, 3);
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
        {shown.map((store) => (
          <StoreChip key={store.id} store={store} />
        ))}
        {result.stores.length > 3 ? (
          <span className="text-xs text-[var(--color-text-muted)]">
            +{result.stores.length - 3} more
          </span>
        ) : null}
      </div>
    );
  }

  if (result.fallback_stores.length > 0) {
    const nearest = result.fallback_stores[0];
    return (
      <p className="mt-2 pl-5 text-xs text-[var(--color-warning)]">
        None within {radius} km · closest:{" "}
        <Link href={`/vendors/${nearest.slug}`} className="font-semibold underline">
          {nearest.name}
          {nearest.distance_km != null ? ` (${nearest.distance_km.toFixed(1)} km)` : ""}
        </Link>
      </p>
    );
  }

  return <p className="mt-2 pl-5 text-xs text-[var(--color-text-muted)]">Not available nearby.</p>;
}

function StoreChip({ store }: { store: VendorSummary }) {
  return (
    <Link
      href={`/vendors/${store.slug}`}
      className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[var(--color-grocery-light)] bg-[var(--color-grocery-light)] px-3 py-1 text-xs font-medium text-[var(--color-grocery)] transition hover:border-[var(--color-grocery)]"
    >
      <Store size={12} />
      {store.name}
      {store.distance_km != null ? ` · ${store.distance_km.toFixed(1)} km` : ""}
      {store.delivery_available === true ? (
        <span title="Delivers" aria-label="Delivers">🛵</span>
      ) : null}
    </Link>
  );
}

"use client";

import { Loader2, MapPin, ShoppingBasket, Store, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  clearShoppingList,
  getShoppingList,
  getShoppingListStores,
  removeShoppingItem,
  setShoppingItemChecked
} from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useToast } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils";
import type { ShoppingList, ShoppingListItem, StoreCoverage } from "@/types";

const RADII = [5, 10, 25] as const;

export default function ShoppingListPage() {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthed = useAuthStore((s) => !!s.accessToken && !!s.user);
  const { showToast } = useToast();

  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [stores, setStores] = useState<StoreCoverage[] | null>(null);
  const [storesLoading, setStoresLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthed) {
      setLoading(false);
      return;
    }
    getShoppingList()
      .then(setList)
      .catch(() => showToast("Couldn't load your shopping list.", "error"))
      .finally(() => setLoading(false));
  }, [hydrated, isAuthed, showToast]);

  const loadStores = useCallback(
    async (lat: number, lng: number, r: number) => {
      setStoresLoading(true);
      try {
        setStores(await getShoppingListStores(lat, lng, r));
      } catch {
        showToast("Couldn't find stores. Please try again.", "error");
      } finally {
        setStoresLoading(false);
      }
    },
    [showToast]
  );

  function findStores() {
    if (!navigator.geolocation) {
      showToast("Location isn't supported on this device.", "error");
      return;
    }
    setStoresLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        loadStores(c.lat, c.lng, radius);
      },
      () => {
        setStoresLoading(false);
        showToast("Couldn't get your location. Allow access and try again.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  function changeRadius(r: number) {
    setRadius(r);
    if (coords) loadStores(coords.lat, coords.lng, r);
  }

  async function toggle(item: ShoppingListItem) {
    const next = !item.checked;
    setList((cur) =>
      cur
        ? {
            ...cur,
            items: cur.items.map((i) => (i.id === item.id ? { ...i, checked: next } : i)),
            checked_count: cur.checked_count + (next ? 1 : -1)
          }
        : cur
    );
    try {
      await setShoppingItemChecked(item.id, next);
    } catch {
      setList((cur) =>
        cur
          ? {
              ...cur,
              items: cur.items.map((i) => (i.id === item.id ? { ...i, checked: !next } : i)),
              checked_count: cur.checked_count + (next ? -1 : 1)
            }
          : cur
      );
      showToast("Couldn't update the item.", "error");
    }
  }

  async function remove(item: ShoppingListItem) {
    setList((cur) =>
      cur
        ? {
            ...cur,
            items: cur.items.filter((i) => i.id !== item.id),
            total: cur.total - 1,
            checked_count: cur.checked_count - (item.checked ? 1 : 0)
          }
        : cur
    );
    setStores(null);
    try {
      await removeShoppingItem(item.id);
    } catch {
      showToast("Couldn't remove the item.", "error");
    }
  }

  async function clearAll() {
    try {
      await clearShoppingList();
      setList({ items: [], total: 0, checked_count: 0 });
      setStores(null);
    } catch {
      showToast("Couldn't clear the list.", "error");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (!hydrated || loading) {
    return (
      <main className="mx-auto flex max-w-3xl justify-center px-4 py-20">
        <Loader2 className="animate-spin text-[var(--color-text-muted)]" />
      </main>
    );
  }

  if (!isAuthed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingBasket className="mx-auto text-[var(--color-grocery)]" size={40} />
        <h1 className="display-font mt-4 text-2xl font-extrabold text-[var(--color-text-primary)]">
          Your shopping list
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[var(--color-text-muted)]">
          Sign in to build a shopping list from your favourite recipes and find the closest
          stores that stock everything.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-flex rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const items = list?.items ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display-font flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            <ShoppingBasket size={24} className="text-[var(--color-grocery)]" />
            Shopping list
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {list && list.total > 0
              ? `${list.checked_count} of ${list.total} checked off`
              : "Add ingredients from any recipe to get started."}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
          >
            <Trash2 size={13} />
            Clear list
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-6 py-12 text-center">
          <p className="text-[var(--color-text-muted)]">Your list is empty.</p>
          <Link
            href="/foods"
            className="mt-4 inline-flex rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            Browse recipes
          </Link>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
            <div
              className="h-full rounded-full bg-[var(--color-grocery)] transition-all"
              style={{ width: `${list ? (list.checked_count / Math.max(list.total, 1)) * 100 : 0}%` }}
            />
          </div>

          {/* Items */}
          <ul className="mt-4 divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 bg-[var(--color-surface)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggle(item)}
                  aria-label={`Mark ${item.ingredient.name} as bought`}
                  className="h-5 w-5 shrink-0 accent-[var(--color-grocery)]"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      item.checked
                        ? "text-[var(--color-text-muted)] line-through"
                        : "text-[var(--color-text-primary)]"
                    )}
                  >
                    {item.ingredient.name}
                    {item.quantity_note ? (
                      <span className="font-normal text-[var(--color-text-muted)]"> · {item.quantity_note}</span>
                    ) : null}
                  </span>
                  {item.source_food_name ? (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      for {item.source_food_name}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`Remove ${item.ingredient.name}`}
                  className="shrink-0 rounded-full p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)]"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>

          {/* Best stores by coverage */}
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="display-font text-lg font-bold text-[var(--color-text-primary)]">
                Where to buy it all
              </h2>
              {coords && (
                <div className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-surface-hover)] p-0.5 text-xs">
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
              )}
            </div>

            {!coords ? (
              <button
                type="button"
                onClick={findStores}
                disabled={storesLoading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-grocery)] bg-[var(--color-grocery-light)] px-4 py-3 text-sm font-semibold text-[var(--color-grocery)] transition hover:brightness-95 disabled:opacity-70"
              >
                {storesLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                Find the stores that cover the most items
              </button>
            ) : storesLoading ? (
              <div className="mt-4 flex justify-center py-6">
                <Loader2 className="animate-spin text-[var(--color-text-muted)]" />
              </div>
            ) : stores && stores.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {stores.map((s, i) => (
                  <li key={s.store.id}>
                    <Link
                      href={`/vendors/${s.store.slug}`}
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-md)] border bg-[var(--color-surface)] p-3 transition hover:shadow-[var(--shadow-sm)]",
                        i === 0
                          ? "border-[var(--color-grocery)]"
                          : "border-[var(--color-border)]"
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-grocery-light)] text-[var(--color-grocery)]">
                        <Store size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {s.store.name}
                          {i === 0 ? (
                            <span className="ml-2 rounded-full bg-[var(--color-grocery)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              Best
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          Covers {s.items_covered} of {s.total_items} items
                          {s.store.distance_km != null ? ` · ${s.store.distance_km.toFixed(1)} km` : ""}
                          {s.store.delivery_available === true ? " · 🛵 delivers" : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
                No stores within {radius} km stock these items. Try a wider radius.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}

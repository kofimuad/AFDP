"use client";

import { Check, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getIngredients, removeVendorStock, setVendorStock } from "@/lib/api";
import { useToast } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils";
import type { IngredientSummary } from "@/types";

interface StockManagerProps {
  vendorId: string;
  /** Ingredient ids the store already carries (from its vendor_items). */
  initialStockedIds: string[];
}

export function StockManager({ vendorId, initialStockedIds }: StockManagerProps) {
  const { showToast } = useToast();
  const [catalog, setCatalog] = useState<IngredientSummary[]>([]);
  const [stocked, setStocked] = useState<Set<string>>(() => new Set(initialStockedIds));
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    getIngredients()
      .then(setCatalog)
      .catch(() => showToast("Couldn't load the ingredient catalog.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? catalog.filter((i) => i.name.toLowerCase().includes(q)) : catalog;
    // Carried ingredients first, then alphabetical.
    return [...list].sort((a, b) => {
      const sa = stocked.has(a.id) ? 0 : 1;
      const sb = stocked.has(b.id) ? 0 : 1;
      return sa !== sb ? sa - sb : a.name.localeCompare(b.name);
    });
  }, [catalog, query, stocked]);

  async function toggle(ing: IngredientSummary) {
    const wasStocked = stocked.has(ing.id);
    setBusyId(ing.id);
    setStocked((prev) => {
      const next = new Set(prev);
      if (wasStocked) next.delete(ing.id);
      else next.add(ing.id);
      return next;
    });
    try {
      if (wasStocked) await removeVendorStock(vendorId, ing.id);
      else await setVendorStock(vendorId, ing.id);
    } catch {
      // Revert optimistic change.
      setStocked((prev) => {
        const next = new Set(prev);
        if (wasStocked) next.add(ing.id);
        else next.delete(ing.id);
        return next;
      });
      showToast("Couldn't update. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="display-font text-lg font-bold text-[var(--color-text-primary)]">What you stock</h3>
        <span className="rounded-full bg-[var(--color-grocery-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-grocery)]">
          {stocked.size} carried
        </span>
      </div>
      <p className="mb-3 text-sm text-[var(--color-text-muted)]">
        Tap an ingredient to flag that your store carries it — that&rsquo;s what makes it show up when shoppers
        search recipes nearby. No prices needed.
      </p>

      <div className="mb-3 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
        <Search size={16} className="shrink-0 text-[var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the ingredient catalog…"
          aria-label="Search ingredients"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-[var(--color-text-muted)]">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : (
        <div className="flex max-h-80 flex-wrap gap-2 overflow-y-auto">
          {filtered.map((ing) => {
            const on = stocked.has(ing.id);
            const busy = busyId === ing.id;
            return (
              <button
                key={ing.id}
                type="button"
                onClick={() => toggle(ing)}
                disabled={busy}
                aria-pressed={on}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-sm font-medium transition disabled:opacity-60",
                  on
                    ? "border-[var(--color-grocery)] bg-[var(--color-grocery)] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-grocery)]"
                )}
              >
                {busy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : on ? (
                  <Check size={13} />
                ) : (
                  <Plus size={13} />
                )}
                {ing.name}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-4 text-sm text-[var(--color-text-muted)]">No ingredients match “{query}”.</p>
          )}
        </div>
      )}
    </div>
  );
}

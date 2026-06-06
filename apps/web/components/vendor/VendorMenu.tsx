"use client";

import { useRef } from "react";

import { trackView } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import type { VendorItem } from "@/types";

interface VendorMenuProps {
  items: VendorItem[];
  isGrocery: boolean;
}

export function VendorMenu({ items, isGrocery }: VendorMenuProps) {
  // Track each item's first click per page view to avoid noisy duplicates.
  const trackedRef = useRef<Set<string>>(new Set());

  const visible = items.filter((i) =>
    isGrocery ? i.item_type === "ingredient" : i.item_type === "food"
  );

  if (visible.length === 0) {
    return (
      <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
        No {isGrocery ? "items" : "dishes"} listed yet.
      </p>
    );
  }

  function handleClick(item: VendorItem) {
    const catalog = item.food ?? item.ingredient;
    if (!catalog || trackedRef.current.has(item.id)) return;
    trackedRef.current.add(item.id);
    trackView(item.item_type === "ingredient" ? "ingredient" : "food", catalog.id);
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
      {visible.map((item) => {
        const catalog = item.food ?? item.ingredient;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item)}
            className="group overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {catalog?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={catalog.image_url}
                alt={catalog.name}
                loading="lazy"
                className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="food-gradient-dish h-28 w-full" />
            )}
            <div className="p-3">
              <p className="font-semibold text-[var(--color-text-primary)]">{catalog?.name}</p>
              {!isGrocery && item.food?.description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {item.food.description}
                </p>
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  {item.price != null ? `$${item.price.toFixed(2)}` : ""}
                </span>
                <Badge variant={item.available ? "success" : "neutral"}>
                  {item.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

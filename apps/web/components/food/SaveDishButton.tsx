"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/lib/store/toastStore";
import { useSavedStore, type SavedFood } from "@/lib/store/savedStore";
import { cn } from "@/lib/utils";

interface SaveDishButtonProps {
  food: SavedFood;
  /** "full" shows a labelled button, "icon" shows a compact square button */
  variant?: "full" | "icon";
  className?: string;
}

export function SaveDishButton({ food, variant = "full", className }: SaveDishButtonProps) {
  const { showToast } = useToast();
  const toggleFood = useSavedStore((s) => s.toggleFood);
  const isFoodSaved = useSavedStore((s) => s.isFoodSaved);
  const hasHydrated = useSavedStore((s) => s._hasHydrated);

  // Avoid hydration mismatch — only reflect persisted state after rehydration
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (hasHydrated) setSaved(isFoodSaved(food.slug));
  }, [hasHydrated, isFoodSaved, food.slug]);

  function handleClick() {
    const nowSaved = toggleFood(food);
    setSaved(nowSaved);
    showToast(
      nowSaved ? "Added to your saved dishes" : "Removed from saved dishes",
      nowSaved ? "success" : "info"
    );
  }

  const label = saved ? "Saved" : "Save Dish";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save dish"}
        className={cn(
          "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          saved
            ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
          className
        )}
      >
        {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-semibold transition-colors",
        saved
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
        className
      )}
    >
      {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      {label}
    </button>
  );
}

"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/lib/store/toastStore";
import { useSavedStore, type SavedVendor } from "@/lib/store/savedStore";
import { cn } from "@/lib/utils";

interface SaveVendorButtonProps {
  vendor: SavedVendor;
  /** "full" shows a labelled button, "icon" shows a compact square button */
  variant?: "full" | "icon";
  className?: string;
}

export function SaveVendorButton({ vendor, variant = "full", className }: SaveVendorButtonProps) {
  const { showToast } = useToast();
  const toggleVendor = useSavedStore((s) => s.toggleVendor);
  const isVendorSaved = useSavedStore((s) => s.isVendorSaved);
  const hasHydrated = useSavedStore((s) => s._hasHydrated);

  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (hasHydrated) setSaved(isVendorSaved(vendor.slug));
  }, [hasHydrated, isVendorSaved, vendor.slug]);

  function handleClick() {
    const nowSaved = toggleVendor(vendor);
    setSaved(nowSaved);
    showToast(
      nowSaved ? "Added to your saved places" : "Removed from saved places",
      nowSaved ? "success" : "info"
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save place"}
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          saved
            ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
          className
        )}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
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
      {saved ? "Saved" : "Save"}
    </button>
  );
}

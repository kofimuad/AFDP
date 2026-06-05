"use client";

import { Bookmark, Heart } from "lucide-react";
import Link from "next/link";

import { useSavedStore } from "@/lib/store/savedStore";

export default function SavedPage() {
  const foods = useSavedStore((s) => s.foods);
  const hasHydrated = useSavedStore((s) => s._hasHydrated);
  const removeFood = useSavedStore((s) => s.removeFood);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="display-font text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          Saved
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Your favourite dishes, all in one spot.
        </p>
      </header>

      {/* Render only after hydration to avoid SSR/localStorage mismatch */}
      {!hasHydrated ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]"
            />
          ))}
        </div>
      ) : foods.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <Bookmark size={26} />
          </span>
          <div>
            <p className="display-font text-xl font-bold text-[var(--color-text-primary)]">
              No saved dishes yet
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--color-text-muted)]">
              Tap the bookmark on any dish to save it here for later.
            </p>
          </div>
          <Link
            href="/foods"
            className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            Explore dishes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {foods.map((food) => (
            <div
              key={food.slug}
              className="group relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <button
                type="button"
                onClick={() => removeFood(food.slug)}
                aria-label={`Remove ${food.name} from saved`}
                className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-primary)] shadow-[var(--shadow-sm)] backdrop-blur transition hover:scale-110"
              >
                <Heart size={16} fill="currentColor" />
              </button>
              <Link href={`/foods/${food.slug}`} aria-label={food.name} className="block">
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
                <div className="p-3">
                  <p className="font-semibold text-[var(--color-text-primary)]">{food.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {food.description ?? "Traditional African flavors."}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

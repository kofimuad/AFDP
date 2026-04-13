import Link from "next/link";

import type { FoodSummary } from "@/types";

const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function fetchFoods(): Promise<FoodSummary[]> {
  const response = await fetch(`${API_BASE_URL}/foods`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load dishes");
  }
  const data: FoodSummary[] = await response.json();
  return data;
}

export default async function FoodsPage() {
  try {
    const foods = await fetchFoods();

    return (
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-20 md:px-6">
        <header className="mb-6">
          <h1 className="display-font text-4xl text-[var(--color-text-primary)]">Popular African Dishes</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Explore dishes from across the African continent</p>
        </header>

        {foods.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No dishes found</p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {foods.map((food) => (
              <article
                key={food.id}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-lg font-semibold text-[var(--color-text-inverse)]">
                  {food.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="display-font text-2xl text-[var(--color-text-primary)]">{food.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-muted)]">{food.description ?? "Traditional flavors and stories on every plate."}</p>
                <Link href={`/foods/${food.slug}`} className="mt-4 inline-block text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
                  View details
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
    );
  } catch {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-20 md:px-6">
        <header className="mb-6">
          <h1 className="display-font text-4xl text-[var(--color-text-primary)]">Popular African Dishes</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Explore dishes from across the African continent</p>
        </header>
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">Failed to load dishes</p>
        </div>
      </main>
    );
  }
}
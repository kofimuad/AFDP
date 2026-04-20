export const metadata = {
  title: "Popular African Dishes | AFDP",
  description:
    "Explore popular African dishes and find restaurants and ingredients near you.",
};
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
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 pb-16 pt-24 md:px-6">
          <header className="mb-10">
            <h1 className="display-font text-4xl text-[var(--color-text-primary)] md:text-5xl">Popular African Dishes</h1>
            <p className="mt-3 text-base text-[var(--color-text-muted)]">Explore dishes from across the African continent</p>
          </header>

          {foods.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No dishes found</p>
            </div>
          ) : (
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {foods.map((food) => (
                <Link key={food.id} href={`/foods/${food.slug}`} className="dd-card">
                  <div className="dd-card-media">
                    {food.image_url ? (
                      <img src={food.image_url} alt={food.name} loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[var(--color-primary-light)]">
                        <span className="display-font text-5xl text-[var(--color-primary)]">
                          {food.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="dd-card-body">
                    <h2 className="display-font text-2xl leading-tight text-[var(--color-text-primary)]">{food.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-muted)]">
                      {food.description ?? "Traditional flavors and stories on every plate."}
                    </p>
                    <span className="mt-4 inline-block text-sm font-semibold text-[var(--color-primary)] group-hover:text-[var(--color-primary-hover)]">
                      View details →
                    </span>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </main>
      </div>
    );
  } catch {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 pb-16 pt-24 md:px-6">
          <header className="mb-10">
            <h1 className="display-font text-4xl text-[var(--color-text-primary)] md:text-5xl">Popular African Dishes</h1>
            <p className="mt-3 text-base text-[var(--color-text-muted)]">Explore dishes from across the African continent</p>
          </header>
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">Failed to load dishes</p>
          </div>
        </main>
      </div>
    );
  }
}
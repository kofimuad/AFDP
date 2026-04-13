import Link from "next/link";

import { CinematicHero } from "@/components/home/CinematicHero";
import { Button } from "@/components/ui/button";
import { getFoods } from "@/lib/api";

export default async function HomePage() {
  const foods = await getFoods().catch(() => []);

  return (
    <main>
      <CinematicHero />

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="display-font text-3xl text-[var(--color-text-primary)]">Popular Dishes</h2>
          <Link href="/search" className="text-sm font-semibold text-[var(--color-primary)]">
            Explore all
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {foods.map((food) => (
            <Link
              key={food.id}
              href={`/foods/${food.slug}`}
              className="min-w-[260px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="mb-3 h-36 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]" />
              <p className="display-font text-xl text-[var(--color-text-primary)]">{food.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">{food.description ?? "Traditional and modern flavors."}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
        <h2 className="display-font text-3xl text-[var(--color-text-primary)]">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Search a dish", "Type in meals like Jollof Rice or Egusi."],
            ["2", "Find restaurants nearby", "See nearby places serving your food."],
            ["3", "Get ingredients", "Discover stores to cook it yourself."]
          ].map(([step, title, desc]) => (
            <article
              key={step}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
            >
              <p className="display-font text-3xl text-[var(--color-primary)]">{step}</p>
              <p className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">{title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6">
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-primary)] p-8 text-[var(--color-text-inverse)]">
          <p className="display-font text-3xl">List your business on AFDP</p>
          <p className="mt-2 text-sm text-[var(--color-text-inverse)]/90">
            Reach local diners and home cooks searching for authentic African food.
          </p>
          <div className="mt-5">
            <Button variant="outline" className="border-white bg-white/10 text-white hover:bg-white/20">
              <Link href="/vendors/register">List Your Business</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
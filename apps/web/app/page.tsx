import Link from "next/link";

import { CinematicHero } from "@/components/home/CinematicHero";
import { Button } from "@/components/ui/button";
import { getFoods } from "@/lib/api";

export default async function HomePage() {
  const foods = await getFoods({ hasVendors: true }).catch(() => []);

  return (
    <main>
      <CinematicHero />

      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="display-font text-3xl text-[var(--color-text-primary)] md:text-4xl">Popular Dishes</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Hand-picked favorites from across the continent.</p>
          </div>
          <Link href="/search" className="whitespace-nowrap text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
            Explore all
          </Link>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          {foods.map((food) => (
            <Link
              key={food.id}
              href={`/foods/${food.slug}`}
              className="dd-card min-w-[280px] max-w-[280px] shrink-0 snap-start"
            >
              <div className="dd-card-media">
                {food.image_url ? (
                  <img src={food.image_url} alt={food.name} loading="lazy" />
                ) : (
                  <span className="dd-card-media-placeholder">No image available</span>
                )}
              </div>
              <div className="dd-card-body">
                <p className="display-font text-xl leading-tight text-[var(--color-text-primary)]">{food.name}</p>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-muted)]">
                  {food.description ?? "Traditional and modern flavors."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <h2 className="display-font text-3xl text-[var(--color-text-primary)] md:text-4xl">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ["1", "Search a dish", "Type in meals like Jollof Rice or Egusi."],
            ["2", "Find restaurants nearby", "See nearby places serving your food."],
            ["3", "Get ingredients", "Discover stores to cook it yourself."]
          ].map(([step, title, desc]) => (
            <article
              key={step}
              className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-md)]"
            >
              <p className="display-font text-4xl text-[var(--color-primary)]">{step}</p>
              <p className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">{title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-6">
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-primary)] p-10 text-[var(--color-text-inverse)] shadow-[var(--shadow-lg)] md:p-12">
          <p className="display-font text-3xl md:text-4xl">List your business on AFDP</p>
          <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-inverse)]/90 md:text-base">
            Reach local diners and home cooks searching for authentic African food.
          </p>
          <div className="mt-6">
            <Button variant="outline" className="border-white bg-white/10 text-white hover:bg-white/20">
              <Link href="/vendors/register">List Your Business</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
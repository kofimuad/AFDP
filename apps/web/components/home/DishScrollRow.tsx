import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { FoodSummary } from "@/types";

interface DishScrollRowProps {
  foods: FoodSummary[];
}

export function DishScrollRow({ foods }: DishScrollRowProps) {
  if (foods.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="display-font text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            Popular Dishes
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            The most-searched flavors on AFDP right now
          </p>
        </div>
        <Link
          href="/foods"
          className="hidden shrink-0 items-center gap-1.5 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-light)] sm:inline-flex"
        >
          View all dishes
          <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
        {foods.map((food) => (
          <Link
            key={food.id}
            href={`/foods/${food.slug}`}
            className="group w-[180px] shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
          >
            {food.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={food.image_url}
                alt={food.name}
                loading="lazy"
                className="h-[130px] w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="food-gradient-dish h-[130px] w-full" />
            )}
            <div className="p-3.5">
              <p className="font-semibold text-[var(--color-text-primary)]">{food.name}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                {food.description ?? "Traditional and modern African flavors."}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/foods"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-light)] sm:hidden"
      >
        Explore all African dishes
      </Link>
    </section>
  );
}

"use client";

import { ChefHat, ChevronRight, Clock, Flame, PlayCircle, ShoppingBasket, Utensils } from "lucide-react";
import Link from "next/link";

import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { ResultCard } from "@/components/search/ResultCard";
import { SaveDishButton } from "@/components/food/SaveDishButton";
import { RecipeLinks } from "@/components/food/RecipeLinks";
import { IngredientStoreFinder } from "@/components/food/IngredientStoreFinder.client";
import { FoodDetailMap } from "@/components/food/FoodDetailMap.client";
import type { FoodDetail as FoodDetailType, FoodSummary, VendorSummary } from "@/types";

interface FoodDetailProps {
  food: FoodDetailType;
  similar: FoodSummary[];
  activeVendorId?: string | null;
  onVendorSelect?: (vendor: VendorSummary) => void;
}

export function FoodDetail({ food, similar, activeVendorId, onVendorSelect }: FoodDetailProps) {
  const mapVendors = [...food.restaurants, ...food.stores];
  const findNearMeHref = `/search?q=${encodeURIComponent(food.name)}` as const;

  const prep = food.prep_minutes ?? null;
  const cook = food.cook_minutes ?? null;
  const total = (prep ?? 0) + (cook ?? 0);

  return (
    <div className="space-y-8">
      {/* ── Breadcrumb (desktop) ── */}
      <nav aria-label="Breadcrumb" className="hidden md:block">
        <ol className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <li><Link href="/" className="transition hover:text-[var(--color-text-primary)]">Home</Link></li>
          <li aria-hidden><ChevronRight size={14} /></li>
          <li><Link href="/foods" className="transition hover:text-[var(--color-text-primary)]">Cook It Yourself</Link></li>
          <li aria-hidden><ChevronRight size={14} /></li>
          <li className="font-medium text-[var(--color-text-primary)]" aria-current="page">{food.name}</li>
        </ol>
      </nav>

      {/* ── Hero ── */}
      <header className="relative overflow-hidden rounded-[var(--radius-lg)]">
        {food.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.image_url}
            alt={food.name}
            className="h-60 w-full object-cover md:h-96"
          />
        ) : (
          <div className="food-gradient-dish h-60 w-full md:h-96" />
        )}
        <div className="food-image-overlay absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          {food.cuisines.length > 0 && (
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/80">
              {food.cuisines.join(" · ")}
            </p>
          )}
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {food.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {total > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                <Clock size={11} />
                {total} min total
              </span>
            )}
            {food.stores.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-grocery)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                <ShoppingBasket size={11} />
                Ingredients at {food.stores.length} {food.stores.length === 1 ? "store" : "stores"}
              </span>
            )}
            {food.restaurants.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                <Utensils size={11} />
                {food.restaurants.length} {food.restaurants.length === 1 ? "restaurant" : "restaurants"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Description + origin ── */}
      <div className="max-w-3xl space-y-2">
        <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
          {food.description ??
            "A beloved dish from across the African continent — gather the ingredients and make it yourself, or order it from a spot nearby."}
        </p>
        {(food.region || food.cuisines.length > 0) && (
          <p className="text-sm text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text-secondary)]">Origin:</span>{" "}
            {[food.region, ...food.cuisines].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {/* ── Two clear paths: cook it yourself vs order nearby ── */}
      <section aria-label="How to get this dish" className="grid gap-3 sm:grid-cols-2">
        <a
          href="#cook"
          className="flex items-start gap-3 rounded-[var(--radius-lg)] border-[1.5px] border-[var(--color-primary)] bg-[var(--color-primary-light)] p-4 transition hover:shadow-[var(--shadow-md)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
            <ChefHat size={22} />
          </span>
          <span className="min-w-0">
            <span className="display-font block text-base font-bold text-[var(--color-text-primary)]">
              Cook it yourself
            </span>
            <span className="mt-0.5 block text-sm text-[var(--color-text-muted)]">
              {food.ingredients.length > 0
                ? `Recipe + ${food.ingredients.length} ingredients to buy nearby`
                : "Recipe + ingredient sourcing"}
            </span>
          </span>
        </a>

        {food.restaurants.length > 0 ? (
          <a
            href="#order"
            className="flex items-start gap-3 rounded-[var(--radius-lg)] border-[1.5px] border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-text-primary)] hover:shadow-[var(--shadow-md)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-dark)] text-[var(--color-text-inverse)]">
              <Utensils size={22} />
            </span>
            <span className="min-w-0">
              <span className="display-font block text-base font-bold text-[var(--color-text-primary)]">
                Order nearby
              </span>
              <span className="mt-0.5 block text-sm text-[var(--color-text-muted)]">
                {food.restaurants.length}{" "}
                {food.restaurants.length === 1 ? "restaurant serves" : "restaurants serve"} it
                {food.restaurants.some((r) => r.delivery_available === true) ? " · some deliver" : ""}
              </span>
            </span>
          </a>
        ) : (
          // Graceful steer: no nearby restaurant → point to cooking it yourself.
          <a
            href="#cook"
            className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-hover)] p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <Utensils size={22} />
            </span>
            <span className="min-w-0">
              <span className="display-font block text-base font-bold text-[var(--color-text-secondary)]">
                No restaurants nearby
              </span>
              <span className="mt-0.5 block text-sm text-[var(--color-text-muted)]">
                None serve {food.name} yet — cook it yourself instead.
              </span>
            </span>
          </a>
        )}
      </section>

      {/* ════════ COOK IT YOURSELF — the headline section ════════ */}
      <section id="cook" className="scroll-mt-24 overflow-hidden rounded-[var(--radius-lg)] border-[1.5px] border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        {/* Banner */}
        <div
          className="flex items-center gap-3 px-5 py-4 text-white md:px-7"
          style={{ background: "linear-gradient(135deg,var(--color-primary) 0%,#D12B1F 100%)" }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <ChefHat size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="display-font text-xl font-extrabold tracking-tight md:text-2xl">
              Cook it yourself
            </h2>
            <p className="text-sm text-white/85">
              Everything you need to make {food.name} at home.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-5 md:p-7">
          {/* Recipe video / links */}
          {food.recipe_links.length > 0 && (
            <div className="space-y-3">
              <h3 className="display-font flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
                <PlayCircle size={18} className="text-[var(--color-primary)]" />
                Watch the recipe
              </h3>
              <RecipeLinks links={food.recipe_links} dishName={food.name} />
            </div>
          )}

          {/* Time stats */}
          {(prep != null || cook != null) && (
            <div className="grid grid-cols-3 gap-3">
              <TimeStat icon={<Clock size={16} />} label="Prep" minutes={prep} />
              <TimeStat icon={<Flame size={16} />} label="Cook" minutes={cook} />
              <TimeStat icon={<ChefHat size={16} />} label="Total" minutes={total > 0 ? total : null} highlight />
            </div>
          )}

          {/* Shopping list — which nearby stores stock each ingredient */}
          {food.ingredients.length > 0 && (
            <IngredientStoreFinder slug={food.slug} ingredients={food.ingredients} />
          )}

          {/* Save for later */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <SaveDishButton
              food={{ slug: food.slug, name: food.name, description: food.description, image_url: food.image_url }}
            />
          </div>
        </div>
      </section>

      {/* ── Order nearby ── */}
      <section id="order" className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
        <div className="mb-1 flex items-center gap-2">
          <Utensils size={18} className="text-[var(--color-text-muted)]" />
          <h2 className="display-font text-lg font-bold text-[var(--color-text-primary)]">
            Order nearby
          </h2>
        </div>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          {food.restaurants.length > 0
            ? `${food.restaurants.length} ${food.restaurants.length === 1 ? "restaurant serves" : "restaurants serve"} ${food.name} near you.`
            : `Can't find ${food.name} nearby? It's easy to make at home.`}
        </p>
        {food.restaurants.length > 0 ? (
          <div className="space-y-3">
            {food.restaurants.slice(0, 4).map((vendor) => (
              <ResultCard
                key={vendor.id}
                vendor={vendor}
                active={activeVendorId === vendor.id}
                onClick={() => onVendorSelect?.(vendor)}
              />
            ))}
            {food.restaurants.length > 4 && (
              <Link
                href={findNearMeHref}
                className="flex w-full items-center justify-center rounded-full border-2 border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-light)]"
              >
                View all {food.restaurants.length} restaurants
              </Link>
            )}
          </div>
        ) : (
          // Graceful steer to the cook-it-yourself path.
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              No nearby restaurant serves {food.name} right now.
            </p>
            <a
              href="#cook"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              <ChefHat size={16} />
              Cook it yourself instead
            </a>
          </div>
        )}
      </section>

      {/* ── About this dish (expandable) ── */}
      <section>
        <Accordion type="single" defaultOpen={["about"]} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <AccordionItem id="about" title="About This Dish">
            <p className="leading-relaxed">
              {food.description ??
                `${food.name} is a treasured part of African cuisine, with regional variations across households and communities. Explore the ingredients above to recreate it, or order from a nearby restaurant.`}
            </p>
          </AccordionItem>
        </Accordion>
      </section>

      {/* ── Map of nearby places ── */}
      {mapVendors.length > 0 && (
        <section className="space-y-3">
          <h2 className="display-font text-xl font-bold text-[var(--color-text-primary)]">
            Where to find it
          </h2>
          <FoodDetailMap vendors={mapVendors} />
        </section>
      )}

      {/* ── Similar dishes ── */}
      {similar.length > 0 && (
        <section className="space-y-4 border-t border-[var(--color-border)] pt-8">
          <div>
            <h2 className="display-font text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              Similar Dishes You Might Like
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              More African dishes to cook
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-5">
            {similar.map((dish) => (
              <Link
                key={dish.id}
                href={`/foods/${dish.slug}`}
                aria-label={dish.name}
                className="group block overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                {dish.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="food-gradient-dish aspect-square w-full" />
                )}
                <div className="p-3">
                  <p className="font-semibold text-[var(--color-text-primary)]">{dish.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {dish.description ?? "Traditional African flavors."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TimeStat({
  icon,
  label,
  minutes,
  highlight = false
}: {
  icon: React.ReactNode;
  label: string;
  minutes: number | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-[var(--radius-md)] border-[1.5px] border-[var(--color-primary-light)] bg-[var(--color-primary-light)] px-3 py-3 text-center"
          : "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-center"
      }
    >
      <span
        className={
          highlight
            ? "inline-flex items-center gap-1.5 text-[var(--color-primary)]"
            : "inline-flex items-center gap-1.5 text-[var(--color-text-muted)]"
        }
      >
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </span>
      <p className="mt-1 text-lg font-extrabold text-[var(--color-text-primary)]">
        {minutes != null && minutes > 0 ? `${minutes} min` : "—"}
      </p>
    </div>
  );
}

"use client";

import { ChevronRight, MapPin, ShoppingBasket, Store, Utensils } from "lucide-react";
import Link from "next/link";

import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { ResultCard } from "@/components/search/ResultCard";
import { SaveDishButton } from "@/components/food/SaveDishButton";
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

  return (
    <div className="space-y-8">
      {/* ── Breadcrumb (desktop) ── */}
      <nav aria-label="Breadcrumb" className="hidden md:block">
        <ol className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <li><Link href="/" className="transition hover:text-[var(--color-text-primary)]">Home</Link></li>
          <li aria-hidden><ChevronRight size={14} /></li>
          <li><Link href="/foods" className="transition hover:text-[var(--color-text-primary)]">Dishes</Link></li>
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
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {food.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {food.restaurants.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                <Utensils size={11} />
                {food.restaurants.length} {food.restaurants.length === 1 ? "restaurant" : "restaurants"}
              </span>
            )}
            {food.stores.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                <Store size={11} />
                {food.stores.length} {food.stores.length === 1 ? "store" : "stores"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Description + CTAs ── */}
      <section className="space-y-5">
        <p className="max-w-3xl text-base leading-relaxed text-[var(--color-text-muted)]">
          {food.description ?? "A beloved dish from across the African continent — discover where to order it nearby or gather the ingredients to cook it yourself."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={findNearMeHref}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            <MapPin size={16} />
            Find Near Me
          </Link>
          <SaveDishButton
            food={{ slug: food.slug, name: food.name, description: food.description, image_url: food.image_url }}
          />
        </div>
      </section>

      {/* ── Key Ingredients (ingredient → store mapping, SCRUM-34) ── */}
      {food.ingredients.length > 0 && (
        <section className="space-y-3">
          <h2 className="display-font text-xl font-bold text-[var(--color-text-primary)]">
            Key Ingredients
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Tap an ingredient to find nearby stores that sell it.
          </p>
          <div className="flex flex-wrap gap-2">
            {food.ingredients.map((item, index) => (
              <Link
                key={item.ingredient.id}
                href={`/search?q=${encodeURIComponent(item.ingredient.name)}`}
                className={
                  index === 0
                    ? "inline-flex items-center rounded-full border-[1.5px] border-[var(--color-primary-light)] bg-[var(--color-primary-light)] px-3.5 py-1.5 text-sm font-medium text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
                    : "inline-flex items-center rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                }
              >
                {item.ingredient.name}
                {item.quantity_note ? ` · ${item.quantity_note}` : ""}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Order nearby vs Cook it yourself (SCRUM-35) ── */}
      <section className="grid gap-8 lg:grid-cols-2">
        {/* Order nearby */}
        <div>
          <h2 className="display-font mb-1 flex items-center gap-2 text-xl font-bold text-[var(--color-text-primary)]">
            <Utensils size={20} className="text-[var(--color-primary)]" />
            Order nearby
          </h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            {food.restaurants.length > 0
              ? `${food.restaurants.length} ${food.restaurants.length === 1 ? "restaurant serves" : "restaurants serve"} ${food.name} near you`
              : `No restaurants serving ${food.name} yet — be the first to add one.`}
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
            <EmptyHint label="No restaurants listed yet." />
          )}
        </div>

        {/* Cook it yourself */}
        <div>
          <h2 className="display-font mb-1 flex items-center gap-2 text-xl font-bold text-[var(--color-text-primary)]">
            <ShoppingBasket size={20} className="text-[var(--color-grocery)]" />
            Cook it yourself
          </h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            Buy the ingredients and make {food.name} at home.
          </p>
          {food.stores.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {food.stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/vendors/${store.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[var(--color-grocery-light)] bg-[var(--color-grocery-light)] px-4 py-2 text-sm font-medium text-[var(--color-grocery)] transition hover:border-[var(--color-grocery)]"
                >
                  <Store size={14} />
                  {store.name}
                  {store.distance_km != null ? ` · ${store.distance_km.toFixed(1)} km` : ""}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyHint label="No ingredient stores listed yet — tap an ingredient above to search." />
          )}
        </div>
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
              More African dishes to explore
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

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
      {label}
    </div>
  );
}

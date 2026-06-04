import { notFound } from "next/navigation";

import { FoodDetailInteractive } from "@/components/food/FoodDetailInteractive.client";
import { getFood, getFoods } from "@/lib/api";
import type { FoodSummary } from "@/types";

interface FoodDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: FoodDetailPageProps) {
  const food = await getFood(params.slug).catch(() => null);
  return {
    title: food ? `${food.name} | AFDP` : "Dish | AFDP",
    description: food?.description ?? "Discover this African dish on AFDP — order nearby or cook it yourself."
  };
}

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const [food, allFoods] = await Promise.all([
    getFood(params.slug).catch(() => null),
    getFoods({ hasVendors: true }).catch((): FoodSummary[] => [])
  ]);

  if (!food) {
    notFound();
  }

  // "Similar dishes" — other dishes from the catalog (no similarity endpoint yet)
  const similar = allFoods.filter((f) => f.slug !== food.slug).slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 md:px-6">
      <FoodDetailInteractive food={food} similar={similar} />
    </main>
  );
}

import { notFound } from "next/navigation";

import { FoodDetailInteractive } from "@/components/food/FoodDetailInteractive.client";
import { getFood } from "@/lib/api";

interface FoodDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: FoodDetailPageProps) {
  const food = await getFood(params.slug).catch(() => null);
  return {
    title: food ? `${food.name} | AFDP` : "Dish | AFDP",
    description: food?.description ?? "Discover this African dish on AFDP.",
  };
}

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const food = await getFood(params.slug).catch(() => null);

  if (!food) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-20 md:px-6">
      <FoodDetailInteractive food={food} />
    </main>
  );
}
import { notFound } from "next/navigation";

import { FoodDetail } from "@/components/food/FoodDetail";
import { FoodDetailMap } from "@/components/food/FoodDetailMap.client";
import { getFood } from "@/lib/api";

interface FoodDetailPageProps {
  params: { slug: string };
}

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const food = await getFood(params.slug).catch(() => null);

  if (!food) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-20 md:px-6">
      <FoodDetail food={food} />
      <section>
        <FoodDetailMap vendors={food.restaurants} />
      </section>
    </main>
  );
}
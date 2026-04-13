"use client";

import { useState } from "react";
import { FoodDetail } from "@/components/food/FoodDetail";
import { FoodDetailMap } from "@/components/food/FoodDetailMap.client";
import type { FoodDetail as FoodDetailType, VendorSummary } from "@/types";

export function FoodDetailInteractive({ food }: { food: FoodDetailType }) {
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);

  const handleVendorSelect = (vendor: VendorSummary) => {
    setActiveVendorId(vendor.id);
  };

  return (
    <>
      <FoodDetail
        food={food}
        onVendorSelect={handleVendorSelect}
        activeVendorId={activeVendorId}
      />
      <section>
        <FoodDetailMap vendors={food.restaurants} />
      </section>
    </>
  );
}

"use client";

import { useState } from "react";

import { FoodDetail } from "@/components/food/FoodDetail";
import { useMapStore } from "@/lib/store/mapStore";
import type { FoodDetail as FoodDetailType, FoodSummary, VendorSummary } from "@/types";

interface FoodDetailInteractiveProps {
  food: FoodDetailType;
  similar: FoodSummary[];
}

export function FoodDetailInteractive({ food, similar }: FoodDetailInteractiveProps) {
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const setMapActiveVendorId = useMapStore((s) => s.setActiveVendorId);

  const handleVendorSelect = (vendor: VendorSummary) => {
    setActiveVendorId(vendor.id);
    setMapActiveVendorId(vendor.id);
  };

  return (
    <FoodDetail
      food={food}
      similar={similar}
      activeVendorId={activeVendorId}
      onVendorSelect={handleVendorSelect}
    />
  );
}

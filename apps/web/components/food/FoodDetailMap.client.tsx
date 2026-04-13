"use client";

import { MapView } from "@/components/map/MapView";
import type { VendorSummary } from "@/types";

export function FoodDetailMap({ vendors }: { vendors: VendorSummary[] }) {
  return <MapView vendors={vendors} />;
}

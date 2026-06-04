"use client";

import { useEffect, useMemo } from "react";

import { MapView } from "@/components/map/MapView";
import { useMapStore } from "@/lib/store/mapStore";
import type { VendorSummary } from "@/types";

export function FoodDetailMap({ vendors }: { vendors: VendorSummary[] }) {
  const setViewport = useMapStore((s) => s.setViewport);

  // Center the shared map on the centroid of this dish's vendors.
  const center = useMemo(() => {
    const located = vendors.filter((v) => v.lat != null && v.lng != null);
    if (located.length === 0) return null;
    const lat = located.reduce((sum, v) => sum + (v.lat as number), 0) / located.length;
    const lng = located.reduce((sum, v) => sum + (v.lng as number), 0) / located.length;
    return { latitude: lat, longitude: lng, zoom: located.length === 1 ? 14 : 12 };
  }, [vendors]);

  useEffect(() => {
    if (center) setViewport(center);
  }, [center, setViewport]);

  return (
    <div className="h-72 overflow-hidden rounded-[var(--radius-lg)] md:h-80 [&>div]:!h-full">
      <MapView vendors={vendors} />
    </div>
  );
}

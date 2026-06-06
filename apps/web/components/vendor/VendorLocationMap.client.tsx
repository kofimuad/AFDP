"use client";

import { useEffect } from "react";

import { MapView } from "@/components/map/MapView";
import { useMapStore } from "@/lib/store/mapStore";
import type { VendorSummary } from "@/types";

export function VendorLocationMap({ vendor }: { vendor: VendorSummary }) {
  const setViewport = useMapStore((s) => s.setViewport);

  useEffect(() => {
    if (vendor.lat != null && vendor.lng != null) {
      setViewport({ latitude: vendor.lat, longitude: vendor.lng, zoom: 14 });
    }
  }, [vendor.lat, vendor.lng, setViewport]);

  return (
    <div className="h-72 overflow-hidden rounded-[var(--radius-lg)] md:h-80 [&>div]:!h-full">
      <MapView vendors={[vendor]} />
    </div>
  );
}

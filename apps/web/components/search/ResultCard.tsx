"use client";

import { Loader2, Navigation2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { VendorSummary } from "@/types";

interface ResultCardProps {
  vendor: VendorSummary;
  active?: boolean;
  onClick?: () => void;
}

export function ResultCard({ vendor, active = false, onClick }: ResultCardProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const openGoogleMaps = (url: string) => {
    window.open(url, "_blank");
  };

  const handleGetDirections = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (vendor.lat == null || vendor.lng == null) return;

    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      openGoogleMaps(`https://www.google.com/maps/search/?api=1&query=${vendor.lat},${vendor.lng}`);
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        openGoogleMaps(`https://www.google.com/maps/dir/${userLat},${userLng}/${vendor.lat},${vendor.lng}`);
        setIsGettingLocation(false);
      },
      () => {
        openGoogleMaps(`https://www.google.com/maps/search/?api=1&query=${vendor.lat},${vendor.lng}`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        active ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="display-font text-lg text-[var(--color-text-primary)]">{vendor.name}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={vendor.type === "grocery_store" ? "grocery" : "restaurant"} />
            {vendor.is_verified ? <Badge variant="verified" /> : null}
            {vendor.is_featured ? <Badge variant="featured" /> : null}
          </div>
        </div>
        {vendor.distance_km != null ? (
          <span className="rounded-[var(--radius-full)] bg-[var(--color-surface-hover)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
            {vendor.distance_km.toFixed(1)} km
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">📍 {vendor.address}</p>

      <button
        type="button"
        onClick={handleGetDirections}
        disabled={isGettingLocation}
        className="mt-2 flex cursor-pointer items-center gap-1 text-sm font-medium text-[#C8522A] underline-offset-2 hover:text-[#A8401E] hover:underline disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isGettingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation2 size={14} />}
        {isGettingLocation ? "Getting location..." : "Get Directions"}
      </button>
    </button>
  );
}

// FLUTTER NOTE:
// This component maps to: ElevatedCard with InkWell + metadata chips
// Design tokens used: --radius-lg, --color-surface, --color-primary, --color-border, --shadow-sm, --shadow-md, --color-text-primary, --color-surface-hover, --radius-full, --color-text-muted
// State management equivalent: BLoC selected-vendor event
// API call: Receives vendors from searchFood/getFood/getVendor
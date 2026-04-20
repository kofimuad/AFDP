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
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "dd-card cursor-pointer text-left outline-none",
        active && "ring-2 ring-[var(--color-primary)]"
      )}
    >
      <div className="dd-card-media" style={{ height: "var(--card-image-height-sm)" }}>
        {vendor.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.image_url} alt={vendor.name} loading="lazy" />
        ) : (
          <span className="dd-card-media-placeholder">No image available</span>
        )}
        {vendor.distance_km != null ? (
          <span className="absolute right-3 top-3 rounded-[var(--radius-full)] bg-white/95 px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]">
            {vendor.distance_km.toFixed(1)} km
          </span>
        ) : null}
      </div>
      <div className="dd-card-body">
        <p className="display-font text-lg leading-tight text-[var(--color-text-primary)]">{vendor.name}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={vendor.type === "grocery_store" ? "grocery" : "restaurant"} />
          {vendor.is_verified ? <Badge variant="verified" /> : null}
          {vendor.is_featured ? <Badge variant="featured" /> : null}
        </div>
        <p className="mt-3 line-clamp-1 text-sm text-[var(--color-text-muted)]">{vendor.address}</p>

        <button
          type="button"
          onClick={handleGetDirections}
          disabled={isGettingLocation}
          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:text-[var(--color-primary-hover)] hover:underline disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGettingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation2 size={14} />}
          {isGettingLocation ? "Getting location..." : "Get Directions"}
        </button>
      </div>
    </div>
  );
}

// FLUTTER NOTE:
// This component maps to: ElevatedCard with InkWell + metadata chips
// Design tokens used: --radius-lg, --color-surface, --color-primary, --color-border, --shadow-sm, --shadow-md, --color-text-primary, --color-surface-hover, --radius-full, --color-text-muted
// State management equivalent: BLoC selected-vendor event
// API call: Receives vendors from searchFood/getFood/getVendor
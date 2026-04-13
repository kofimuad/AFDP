"use client";

import { Marker } from "react-map-gl";

import type { VendorSummary } from "@/types";

interface VendorPinProps {
  vendor: VendorSummary;
  isActive?: boolean;
  onClick?: () => void;
}

export function VendorPin({ vendor, isActive = false, onClick }: VendorPinProps) {
  const fill = vendor.type === "grocery_store" ? "var(--color-grocery)" : "var(--color-primary)";

  return (
    <Marker longitude={vendor.lng ?? 0} latitude={vendor.lat ?? 0} anchor="bottom">
      <button
        type="button"
        onClick={onClick}
        title={vendor.name}
        className="relative rounded-full bg-transparent p-0"
        aria-label={`Select ${vendor.name}`}
      >
        {isActive ? (
          <span className="absolute -inset-2 rounded-full border-2 border-[var(--color-primary)]/40" />
        ) : null}
        <svg width={isActive ? 34 : 28} height={isActive ? 40 : 34} viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 1C7.37258 1 2 6.37258 2 13C2 21.25 14 33 14 33C14 33 26 21.25 26 13C26 6.37258 20.6274 1 14 1Z" fill={fill} />
          <circle cx="14" cy="13" r="5" fill="white" />
        </svg>
      </button>
    </Marker>
  );
}

// FLUTTER NOTE:
// This component maps to: CustomPainter marker widget
// Design tokens used: --color-primary, --color-grocery
// State management equivalent: BLoC selected-marker state
// API call: None
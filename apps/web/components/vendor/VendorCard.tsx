import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { VendorSummary } from "@/types";

interface VendorCardProps {
  vendor: VendorSummary;
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link href={`/vendors/${vendor.slug}`} className="dd-card group">
      <div className="dd-card-media">
        {vendor.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.image_url} alt={vendor.name} loading="lazy" />
        ) : (
          <span className="dd-card-media-placeholder">No image available</span>
        )}
      </div>
      <div className="dd-card-body">
        <p className="display-font text-lg leading-tight text-[var(--color-text-primary)]">{vendor.name}</p>
        <p className="mt-1 line-clamp-1 text-sm text-[var(--color-text-muted)]">{vendor.address}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant={vendor.type === "grocery_store" ? "grocery" : "restaurant"} />
          {vendor.is_verified ? <Badge variant="verified" /> : null}
        </div>
      </div>
    </Link>
  );
}

// FLUTTER NOTE:
// This component maps to: Compact Card/ListTile widget
// Design tokens used: --radius-lg, --color-border, --color-surface, --shadow-sm, --shadow-md, --radius-md, --color-surface-hover, --color-text-muted, --color-text-primary
// State management equivalent: Stateless widget with navigation callback
// API call: getVendors
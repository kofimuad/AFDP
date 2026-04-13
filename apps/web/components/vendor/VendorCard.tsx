import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { VendorSummary } from "@/types";

interface VendorCardProps {
  vendor: VendorSummary;
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      <div className="mb-3 flex h-32 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-muted)]">
        {vendor.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.image_url} alt={vendor.name} className="h-full w-full rounded-[var(--radius-md)] object-cover" />
        ) : (
          "No image available"
        )}
      </div>
      <p className="display-font text-lg text-[var(--color-text-primary)]">{vendor.name}</p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{vendor.address}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={vendor.type === "grocery_store" ? "grocery" : "restaurant"} />
        {vendor.is_verified ? <Badge variant="verified" /> : null}
      </div>
    </Link>
  );
}

// FLUTTER NOTE:
// This component maps to: Compact Card/ListTile widget
// Design tokens used: --radius-lg, --color-border, --color-surface, --shadow-sm, --shadow-md, --radius-md, --color-surface-hover, --color-text-muted, --color-text-primary
// State management equivalent: Stateless widget with navigation callback
// API call: getVendors
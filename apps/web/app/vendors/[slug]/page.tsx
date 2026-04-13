import Link from "next/link";
import { notFound } from "next/navigation";

import { MapView } from "@/components/map/MapView";
import { GetDirectionsButton } from "@/components/vendor/GetDirectionsButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { getVendor } from "@/lib/api";

interface VendorDetailProps {
  params: { slug: string };
}

export default async function VendorDetailPage({ params }: VendorDetailProps) {
  const vendor = await getVendor(params.slug).catch(() => null);

  if (!vendor) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 pt-20 md:px-6">
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display-font text-4xl text-[var(--color-text-primary)]">{vendor.name}</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{vendor.address}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={vendor.type === "grocery_store" ? "grocery" : "restaurant"} />
            {vendor.is_verified ? <Badge variant="verified" /> : null}
            {vendor.is_featured ? <Badge variant="featured" /> : null}
          </div>
        </div>

        {vendor.lat != null && vendor.lng != null ? (
          <div className="mt-4">
            <GetDirectionsButton vendorLat={vendor.lat} vendorLng={vendor.lng} vendorName={vendor.name} />
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Vendor items</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {vendor.vendor_items.length > 0 ? (
            vendor.vendor_items.map((item) => (
              <article
                key={item.id}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
              >
                <p className="display-font text-xl text-[var(--color-text-primary)]">{item.food?.name ?? item.ingredient?.name ?? "Item"}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)] capitalize">{item.item_type}</p>
                {item.price != null ? <p className="mt-2 text-sm text-[var(--color-text-primary)]">${item.price.toFixed(2)}</p> : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No listed items yet.</p>
          )}
        </div>
      </section>

      <section>
        <MapView vendors={[vendor]} />
      </section>

      <div>
        <Button variant="outline">
          <Link href="/search">Back to results</Link>
        </Button>
      </div>
    </main>
  );
}
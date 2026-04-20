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

export async function generateMetadata({ params }: VendorDetailProps) {
  const vendor = await getVendor(params.slug).catch(() => null);
  return {
    title: vendor ? `${vendor.name} | AFDP` : "Vendor | AFDP",
    description: vendor
      ? `${vendor.name} — ${vendor.address}`
      : "African food vendor on AFDP",
  };
}

export default async function VendorDetailPage({ params }: VendorDetailProps) {
  const vendor = await getVendor(params.slug).catch(() => null);

  if (!vendor) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-12 pt-24 md:px-6">
      <section className="dd-card overflow-hidden">
        <div className="dd-card-media" style={{ height: "220px" }}>
          {vendor.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.image_url} alt={vendor.name} />
          ) : (
            <span className="dd-card-media-placeholder">No image available</span>
          )}
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="display-font text-4xl text-[var(--color-text-primary)] md:text-5xl">{vendor.name}</h1>
              <p className="mt-3 text-base text-[var(--color-text-muted)]">{vendor.address}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={vendor.type === "grocery_store" ? "grocery" : "restaurant"} />
              {vendor.is_verified ? <Badge variant="verified" /> : null}
              {vendor.is_featured ? <Badge variant="featured" /> : null}
            </div>
          </div>

          {vendor.lat != null && vendor.lng != null ? (
            <div className="mt-6">
              <GetDirectionsButton vendorLat={vendor.lat} vendorLng={vendor.lng} vendorName={vendor.name} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="display-font text-3xl text-[var(--color-text-primary)]">Vendor items</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendor.vendor_items.length > 0 ? (
            vendor.vendor_items.map((item) => {
              const image = item.food?.image_url ?? item.ingredient?.image_url ?? null;
              const name = item.food?.name ?? item.ingredient?.name ?? "Item";
              return (
                <article key={item.id} className="dd-card">
                  <div className="dd-card-media">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={name} loading="lazy" />
                    ) : (
                      <span className="dd-card-media-placeholder">No image available</span>
                    )}
                  </div>
                  <div className="dd-card-body">
                    <p className="display-font text-xl leading-tight text-[var(--color-text-primary)]">{name}</p>
                    <p className="mt-1 text-sm capitalize text-[var(--color-text-muted)]">{item.item_type}</p>
                    {item.price != null ? (
                      <p className="mt-3 text-base font-semibold text-[var(--color-text-primary)]">${item.price.toFixed(2)}</p>
                    ) : null}
                  </div>
                </article>
              );
            })
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
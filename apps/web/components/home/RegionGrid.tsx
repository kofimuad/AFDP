import Link from "next/link";

interface Region {
  slug: string;
  label: string;
  color: string;
}

const REGIONS: ReadonlyArray<Region> = [
  { slug: "west-africa", label: "West Africa", color: "#E07020" },
  { slug: "east-africa", label: "East Africa", color: "#1E7A4A" },
  { slug: "north-africa", label: "North Africa", color: "#D4A017" },
  { slug: "southern-africa", label: "Southern Africa", color: "#9C4A1A" },
  { slug: "central-africa", label: "Central Africa", color: "#7A2E1C" },
  { slug: "ethiopian", label: "Ethiopian", color: "#C44536" },
  { slug: "ghanaian", label: "Ghanaian", color: "#E0B020" },
  { slug: "senegalese", label: "Senegalese", color: "#4A7B6A" }
];

export function RegionGrid() {
  return (
    <section className="bg-[var(--color-surface-hover)] px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="display-font text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Explore by Region
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          54 countries, thousands of flavors — find cuisine from across the continent
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {REGIONS.map((region) => (
            <Link
              key={region.slug}
              href={`/foods?region=${region.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: region.color }}
                aria-hidden="true"
              />
              {region.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

interface Region {
  /** Must match the regions.name value in the backend (ILIKE) */
  name: string;
  color: string;
}

const REGIONS: ReadonlyArray<Region> = [
  { name: "West African", color: "#F23B2F" },
  { name: "East African", color: "#1E7A4A" },
  { name: "North African", color: "#D4A017" },
  { name: "Southern African", color: "#9C4A1A" },
  { name: "Central African", color: "#7A2E1C" },
  { name: "Afro-Caribbean", color: "#C44536" }
];

export function RegionGrid() {
  return (
    <section className="bg-[var(--color-surface-hover)] px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="display-font text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Explore by Region
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Flavors from across the continent — find cuisine by region
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {REGIONS.map((region) => (
            <Link
              key={region.name}
              href={`/foods?region=${encodeURIComponent(region.name)}`}
              className="group inline-flex items-center gap-2 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: region.color }}
                aria-hidden="true"
              />
              {region.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
